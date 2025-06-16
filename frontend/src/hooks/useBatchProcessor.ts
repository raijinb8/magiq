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
  getLastProcessResult?: () => { workOrderId?: string; detectionResult?: CompanyDetectionResult } | null;
}

export const useBatchProcessor = ({
  processFile,
  onFileProcessed,
  onBatchComplete,
  getCompanyLabel = (id) => id,
  getLastProcessResult,
}: UseBatchProcessorProps) => {
  const [batchState, setBatchState] = useState<BatchProcessingState>({
    isProcessing: false,
    isPaused: false,
    processedCount: 0,
    totalCount: 0,
    successCount: 0,
    errorCount: 0,
    currentFileIndex: 0,
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    results: [],
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
          isPaused: false,
          processedCount: 0,
          totalCount: files.length,
          successCount: 0,
          errorCount: 0,
          currentFileIndex: 0,
          totalFiles: files.length,
          processedFiles: 0,
          failedFiles: 0,
          results: [],
          startTime: new Date(),
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
          let actualResult: { workOrderId?: string; detectionResult?: CompanyDetectionResult } = { workOrderId: undefined, detectionResult: undefined };
          
          // 2段階処理の場合
          if (autoDetectEnabled) {
            // バッチ処理でのAPI負荷軽減のため、ファイル間に待機時間を追加
            if (index > 0) {
              console.log(`[useBatchProcessor] API負荷軽減のため1秒待機: ${file.name}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Stage 1: OCR + 会社判定
            await processFile(
              file,
              '',
              'OCR処理',
              true,
              true
            );
            
            // Stage 1完了後、少し待機してからlastProcessResultRefを確認
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Stage 1の結果を取得
            const stage1Result = getLastProcessResult?.();
            console.log(`[useBatchProcessor] Stage 1結果確認: ${file.name}`, {
              stage1Result: stage1Result,
              detectionResult: stage1Result?.detectionResult,
              detectedCompanyId: stage1Result?.detectionResult?.detectedCompanyId,
              confidence: stage1Result?.detectionResult?.confidence,
            });
            
            if (stage1Result?.detectionResult?.detectedCompanyId) {
              const detectedCompanyId = stage1Result.detectionResult.detectedCompanyId;
              const companyLabel = getCompanyLabel(detectedCompanyId);
              
              console.log(`[useBatchProcessor] Stage 2開始: ${file.name} (会社: ${companyLabel})`);
              
              try {
                // Stage 1とStage 2の間にも待機時間を追加（API負荷軽減）
                console.log(`[useBatchProcessor] Stage 1→2間で1秒待機: ${file.name}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Stage 2: 手配書作成
                await processFile(
                  file,
                  detectedCompanyId,
                  companyLabel,
                  false, // enableAutoDetection = false (判定は完了済み)
                  false // ocrOnly = false (手配書作成を実行)
                );
                
                // Stage 2完了後、再度結果を取得
                await new Promise(resolve => setTimeout(resolve, 500));
                actualResult = getLastProcessResult?.() || actualResult;
                
                // Stage 2が成功したかチェック
                if (!actualResult.workOrderId) {
                  throw new Error('手配書作成でwork_orderが作成されませんでした');
                }
              } catch (stage2Error) {
                console.error(`[useBatchProcessor] Stage 2エラー: ${file.name}`, stage2Error);
                const completedAt = new Date();
                
                const stage2ErrorResult = {
                  fileName: file.name,
                  status: 'error' as const,
                  errorMessage: `手配書作成に失敗しました: ${stage2Error instanceof Error ? stage2Error.message : String(stage2Error)}`,
                  processingTime: completedAt.getTime() - startedAt.getTime(),
                  startedAt,
                  completedAt,
                };
                
                console.log(`[useBatchProcessor] Stage 2エラー結果を作成:`, {
                  fileName: stage2ErrorResult.fileName,
                  status: stage2ErrorResult.status,
                  errorMessage: stage2ErrorResult.errorMessage,
                });
                
                // バッチ状態を更新
                setBatchState(prev => ({
                  ...prev,
                  processedCount: prev.processedCount + 1,
                  errorCount: prev.errorCount + 1,
                  failedFiles: (prev.failedFiles || 0) + 1,
                  results: [...prev.results, stage2ErrorResult],
                }));
                
                // Stage 2エラーもDBに記録
                if (batchProcessIdRef.current) {
                  try {
                    console.log(`[useBatchProcessor] ${file.name}のStage 2エラー状態をDBに記録中...`);
                    await updateBatchProcessFile(batchProcessIdRef.current, file.name, stage2ErrorResult);
                    console.log(`[useBatchProcessor] ${file.name}のStage 2エラー状態をDBに記録完了`);
                  } catch (dbError) {
                    console.error(`[useBatchProcessor] ${file.name}のStage 2エラーDB記録に失敗:`, dbError);
                  }
                }
                
                // onFileProcessedコールバックを確実に呼び出す
                try {
                  console.log(`[useBatchProcessor] Stage 2エラーでonFileProcessedコールバック呼び出し: ${file.name}`);
                  onFileProcessed?.(stage2ErrorResult);
                  console.log(`[useBatchProcessor] Stage 2エラーでonFileProcessedコールバック完了: ${file.name}`);
                } catch (callbackError) {
                  console.error(`[useBatchProcessor] Stage 2エラーでonFileProcessedコールバックエラー:`, callbackError);
                }
                
                return stage2ErrorResult;
              }
            } else {
              // 会社判定に失敗した場合は、エラーとして記録するが処理は継続
              const detectionDetails = stage1Result?.detectionResult;
              const errorDetails = detectionDetails ? 
                `信頼度: ${detectionDetails.confidence}, 検出キーワード: ${detectionDetails.details?.foundKeywords?.join(', ') || 'なし'}` :
                'OCR処理の結果が取得できませんでした';
                
              console.warn(`[useBatchProcessor] 会社判定に失敗: ${file.name}`, {
                detectionResult: detectionDetails,
                errorDetails,
              });
              
              const completedAt = new Date();
              
              const detectionErrorResult = {
                fileName: file.name,
                status: 'error' as const,
                errorMessage: `会社の自動判定に失敗しました。${errorDetails}`,
                processingTime: completedAt.getTime() - startedAt.getTime(),
                startedAt,
                completedAt,
              };
              
              console.log(`[useBatchProcessor] 会社判定エラー結果を作成:`, {
                fileName: detectionErrorResult.fileName,
                status: detectionErrorResult.status,
                errorMessage: detectionErrorResult.errorMessage,
              });
              
              // バッチ状態を更新
              setBatchState(prev => ({
                ...prev,
                processedCount: prev.processedCount + 1,
                errorCount: prev.errorCount + 1,
                failedFiles: (prev.failedFiles || 0) + 1,
                results: [...prev.results, detectionErrorResult],
              }));
              
              // 会社判定失敗もDBに記録
              if (batchProcessIdRef.current) {
                try {
                  console.log(`[useBatchProcessor] ${file.name}の会社判定失敗状態をDBに記録中...`);
                  await updateBatchProcessFile(batchProcessIdRef.current, file.name, detectionErrorResult);
                  console.log(`[useBatchProcessor] ${file.name}の会社判定失敗状態をDBに記録完了`);
                } catch (dbError) {
                  console.error(`[useBatchProcessor] ${file.name}の会社判定失敗DB記録に失敗:`, dbError);
                }
              }
              
              // onFileProcessedコールバックを確実に呼び出す
              try {
                console.log(`[useBatchProcessor] 会社判定エラーでonFileProcessedコールバック呼び出し: ${file.name}`);
                onFileProcessed?.(detectionErrorResult);
                console.log(`[useBatchProcessor] 会社判定エラーでonFileProcessedコールバック完了: ${file.name}`);
              } catch (callbackError) {
                console.error(`[useBatchProcessor] 会社判定エラーでonFileProcessedコールバックエラー:`, callbackError);
              }
              
              return detectionErrorResult;
            }
          } else {
            // 通常処理
            // バッチ処理でのAPI負荷軽減のため、ファイル間に待機時間を追加
            if (index > 0) {
              console.log(`[useBatchProcessor] API負荷軽減のため1秒待機: ${file.name}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const companyLabel = getCompanyLabel(companyId);
            await processFile(
              file,
              companyId,
              companyLabel,
              false,
              false
            );
            
            // 処理完了後、結果を取得
            await new Promise(resolve => setTimeout(resolve, 500));
            actualResult = getLastProcessResult?.() || actualResult;
          }

          // 処理完了後にキャンセルされていないかチェック
          if (abortControllerRef.current?.signal.aborted) {
            return {
              fileName: file.name,
              status: 'cancelled',
              errorMessage: '処理がキャンセルされました',
              processingTime: new Date().getTime() - startedAt.getTime(),
              startedAt,
              completedAt: new Date(),
            };
          }

          const completedAt = new Date();
            
          const result: BatchProcessResult = {
            fileName: file.name,
            status: 'success',
            companyId: actualResult.detectionResult?.detectedCompanyId || companyId,
            workOrderId: actualResult.workOrderId,
            detectionResult: actualResult.detectionResult,
            processingTime: completedAt.getTime() - startedAt.getTime(),
            startedAt,
            completedAt,
          };

          setBatchState(prev => ({
            ...prev,
            processedCount: prev.processedCount + 1,
            successCount: prev.successCount + 1,
            processedFiles: (prev.processedFiles || 0) + 1,
            results: [...prev.results, result],
          }));

          // データベースに結果を記録
          if (batchProcessIdRef.current) {
            await updateBatchProcessFile(batchProcessIdRef.current, file.name, result);
          }

          onFileProcessed?.(result);
          return result;

        } catch (error) {
          console.error(`[useBatchProcessor] ${file.name}の処理中にエラーが発生:`, error);
          
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

          console.log(`[useBatchProcessor] エラー結果を作成:`, {
            fileName: result.fileName,
            status: result.status,
            errorMessage: result.errorMessage,
            callbackAvailable: !!onFileProcessed,
          });

          setBatchState(prev => ({
            ...prev,
            processedCount: prev.processedCount + 1,
            errorCount: prev.errorCount + 1,
            failedFiles: (prev.failedFiles || 0) + 1,
            results: [...prev.results, result],
          }));

          // データベースに結果を記録
          if (batchProcessIdRef.current) {
            try {
              console.log(`[useBatchProcessor] ${file.name}のエラー状態をDBに記録中...`, {
                batchProcessId: batchProcessIdRef.current,
                fileName: file.name,
                status: result.status,
                errorMessage: result.errorMessage,
              });
              
              await updateBatchProcessFile(batchProcessIdRef.current, file.name, result);
              
              console.log(`[useBatchProcessor] ${file.name}のエラー状態をDBに記録完了`);
            } catch (dbError) {
              console.error(`[useBatchProcessor] ${file.name}のDBエラー記録に失敗:`, dbError);
              // DB更新エラーでもバッチ処理は継続
            }
          } else {
            console.warn(`[useBatchProcessor] ${file.name}エラー時にbatchProcessIdが未設定`);
          }

          // onFileProcessedコールバックを確実に呼び出す
          try {
            console.log(`[useBatchProcessor] onFileProcessedコールバック呼び出し開始: ${file.name}`);
            onFileProcessed?.(result);
            console.log(`[useBatchProcessor] onFileProcessedコールバック呼び出し完了: ${file.name}`);
          } catch (callbackError) {
            console.error(`[useBatchProcessor] onFileProcessedコールバックでエラー:`, callbackError);
          }

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
            chunk.map((file) => 
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processFile, onFileProcessed, onBatchComplete, getCompanyLabel]
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
    if (!batchState.totalFiles || batchState.totalFiles === 0) return 0;
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