// src/hooks/useBatchProcessor.ts
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  createBatchProcess,
  recordBatchProcessFile,
  updateBatchProcessFile,
  updateBatchProcessStatus,
} from '@/lib/api';
import type {
  BatchProcessingState,
  BatchProcessResult,
  BatchProcessOptions,
  PdfFile,
  CompanyOptionValue,
  PdfProcessSuccessResponse,
  CompanyDetectionResult,
} from '@/types';

interface UseBatchProcessorProps {
  processFile: (
    fileToProcess: File,
    companyId: CompanyOptionValue,
    companyLabelForError: string,
    enableAutoDetection?: boolean,
    ocrOnly?: boolean
  ) => Promise<{ workOrderId?: string; detectionResult?: CompanyDetectionResult } | null | void>;
  onFileProcessed?: (result: BatchProcessResult) => void;
  onBatchComplete?: (results: BatchProcessResult[]) => void;
  getCompanyLabel?: (companyId: CompanyOptionValue) => string;
}

export const useBatchProcessor = ({
  processFile,
  onFileProcessed,
  onBatchComplete,
  getCompanyLabel = (id) => id,
}: UseBatchProcessorProps) => {
  const [batchState, setBatchState] = useState<BatchProcessingState>({
    isProcessing: false,
    currentFileIndex: 0,
    totalFiles: 0,
    processedFiles: [],
    failedFiles: [],
    results: [],
    isPaused: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const batchProcessIdRef = useRef<string | null>(null);

  // バッチ処理の開始
  const startBatchProcess = useCallback(
    async (
      files: PdfFile[],
      options: BatchProcessOptions = {}
    ) => {
      const {
        companyId = '',
        autoDetectEnabled = false,
        concurrentLimit = 1, // デフォルトは1つずつ処理
        retryFailedFiles = false,
        pauseOnError = false,
      } = options;

      if (files.length === 0) {
        toast.error('処理するファイルが選択されていません');
        return;
      }

      // パフォーマンスのため、大量ファイルの処理には制限を設ける
      if (files.length > 50) {
        toast.warning('一度に処理できるファイルは50個までです。ファイルを分割して処理してください。');
        return;
      }

      try {
        // バッチ処理をデータベースに作成
        const batchProcess = await createBatchProcess(files.length, options);
        batchProcessIdRef.current = batchProcess.id;

        // 各ファイルをデータベースに記録
        await Promise.all(
          files.map(file => 
            recordBatchProcessFile(batchProcess.id, file.name, file.size)
          )
        );

        // 処理開始
        setBatchState({
          isProcessing: true,
          currentFileIndex: 0,
          totalFiles: files.length,
          processedFiles: [],
          failedFiles: [],
          results: [],
          startTime: new Date(),
          isPaused: false,
        });

        pausedRef.current = false;
        abortControllerRef.current = new AbortController();

        toast.info(`${files.length}個のファイルの処理を開始します`);

      const results: BatchProcessResult[] = [];

      // 並行処理のヘルパー関数
      const processFileWithResult = async (
        file: PdfFile,
        index: number
      ): Promise<BatchProcessResult> => {
        // 一時停止チェック
        while (pausedRef.current && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (abortControllerRef.current?.signal.aborted) {
          return {
            fileName: file.name,
            status: 'cancelled',
            errorMessage: '処理がキャンセルされました',
          };
        }

        const startedAt = new Date();
        
        // 現在の処理ファイルを更新
        setBatchState(prev => ({
          ...prev,
          currentFileIndex: index,
        }));

        try {
          let processResult: { workOrderId?: string; detectionResult?: CompanyDetectionResult } | null | void = null;
          
          // 2段階処理の場合
          if (autoDetectEnabled) {
            // Stage 1: OCR + 会社判定
            processResult = await processFile(
              file,
              '',
              'OCR処理',
              true,
              true
            );
            
            // TODO: OCR結果から会社IDを取得する処理
            // 現在の実装では、processFileのコールバックで処理される
          } else {
            // 通常処理
            const companyLabel = getCompanyLabel(companyId);
            processResult = await processFile(
              file,
              companyId,
              companyLabel,
              false,
              false
            );
          }

          const completedAt = new Date();
          const result: BatchProcessResult = {
            fileName: file.name,
            status: 'success',
            companyId: companyId,
            workOrderId: processResult?.workOrderId,
            detectionResult: processResult?.detectionResult,
            processingTime: completedAt.getTime() - startedAt.getTime(),
            startedAt,
            completedAt,
          };

          setBatchState(prev => ({
            ...prev,
            processedFiles: [...prev.processedFiles, file.name],
            results: [...prev.results, result],
          }));

          // データベースに結果を記録
          if (batchProcessIdRef.current) {
            await updateBatchProcessFile(batchProcessIdRef.current, file.name, result);
          }

          onFileProcessed?.(result);
          return result;

        } catch (error) {
          const completedAt = new Date();
          const errorMessage = error instanceof Error ? error.message : '不明なエラー';
          
          const result: BatchProcessResult = {
            fileName: file.name,
            status: 'error',
            errorMessage,
            processingTime: completedAt.getTime() - startedAt.getTime(),
            startedAt,
            completedAt,
          };

          setBatchState(prev => ({
            ...prev,
            failedFiles: [...prev.failedFiles, file.name],
            results: [...prev.results, result],
          }));

          // データベースに結果を記録
          if (batchProcessIdRef.current) {
            await updateBatchProcessFile(batchProcessIdRef.current, file.name, result);
          }

          onFileProcessed?.(result);

          if (pauseOnError) {
            pauseBatchProcess();
            toast.error(`エラーが発生したため処理を一時停止しました: ${file.name}`);
          }

          return result;
        }
      };

      // 並行処理数に応じて処理を実行
      if (concurrentLimit > 1) {
        // 並行処理（メモリ効率を考慮して最大3並列に制限）
        const effectiveConcurrentLimit = Math.min(concurrentLimit, 3);
        const chunks: PdfFile[][] = [];
        for (let i = 0; i < files.length; i += effectiveConcurrentLimit) {
          chunks.push(files.slice(i, i + effectiveConcurrentLimit));
        }

        for (const chunk of chunks) {
          if (abortControllerRef.current?.signal.aborted) break;
          
          const chunkResults = await Promise.all(
            chunk.map((file, index) => 
              processFileWithResult(file, files.indexOf(file))
            )
          );
          results.push(...chunkResults);
          
          // メモリ解放のため、大量処理時は少し待機
          if (files.length > 20 && chunks.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        // 順次処理
        for (let i = 0; i < files.length; i++) {
          if (abortControllerRef.current?.signal.aborted) break;
          
          const result = await processFileWithResult(files[i], i);
          results.push(result);
        }
      }

      // 処理完了
      const endTime = new Date();
      setBatchState(prev => ({
        ...prev,
        isProcessing: false,
        endTime,
        results,
      }));

      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const cancelledCount = results.filter(r => r.status === 'cancelled').length;

      // データベースのバッチ処理ステータスを更新
      if (batchProcessIdRef.current) {
        const status = cancelledCount > 0 ? 'cancelled' : 
                       errorCount === files.length ? 'error' : 
                       'completed';
        await updateBatchProcessStatus(
          batchProcessIdRef.current,
          status,
          successCount + errorCount,
          errorCount
        );
      }

      if (cancelledCount > 0) {
        toast.warning(
          `バッチ処理を中断しました。成功: ${successCount}件、失敗: ${errorCount}件、キャンセル: ${cancelledCount}件`
        );
      } else {
        toast.success(
          `バッチ処理が完了しました。成功: ${successCount}件、失敗: ${errorCount}件`
        );
      }

      onBatchComplete?.(results);

      // ブラウザ通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('MagIQ - バッチ処理完了', {
          body: `${files.length}個のファイルの処理が完了しました`,
          icon: '/vite.svg',
        });
      }
    } catch (error) {
      console.error('バッチ処理の開始エラー:', error);
      toast.error('バッチ処理の開始に失敗しました');
      setBatchState(prev => ({ ...prev, isProcessing: false }));
    }
    },
    [processFile, onFileProcessed, onBatchComplete]
  );

  // バッチ処理の一時停止
  const pauseBatchProcess = useCallback(() => {
    if (batchState.isProcessing && !batchState.isPaused) {
      pausedRef.current = true;
      setBatchState(prev => ({ ...prev, isPaused: true }));
      toast.info('バッチ処理を一時停止しました');
    }
  }, [batchState.isProcessing, batchState.isPaused]);

  // バッチ処理の再開
  const resumeBatchProcess = useCallback(() => {
    if (batchState.isProcessing && batchState.isPaused) {
      pausedRef.current = false;
      setBatchState(prev => ({ ...prev, isPaused: false }));
      toast.info('バッチ処理を再開しました');
    }
  }, [batchState.isProcessing, batchState.isPaused]);

  // バッチ処理のキャンセル
  const cancelBatchProcess = useCallback(() => {
    if (batchState.isProcessing) {
      abortControllerRef.current?.abort();
      pausedRef.current = false;
      setBatchState(prev => ({
        ...prev,
        isProcessing: false,
        isPaused: false,
        endTime: new Date(),
      }));
      toast.warning('バッチ処理をキャンセルしました');
    }
  }, [batchState.isProcessing]);

  // 進捗率の計算
  const getProgress = useCallback(() => {
    if (batchState.totalFiles === 0) return 0;
    return Math.round((batchState.results.length / batchState.totalFiles) * 100);
  }, [batchState.results.length, batchState.totalFiles]);

  // 処理時間の計算
  const getElapsedTime = useCallback(() => {
    if (!batchState.startTime) return 0;
    const endTime = batchState.endTime || new Date();
    return endTime.getTime() - batchState.startTime.getTime();
  }, [batchState.startTime, batchState.endTime]);

  return {
    batchState,
    startBatchProcess,
    pauseBatchProcess,
    resumeBatchProcess,
    cancelBatchProcess,
    getProgress,
    getElapsedTime,
  };
};