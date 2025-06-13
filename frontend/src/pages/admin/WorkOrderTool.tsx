// src/pages/admin/WorkOrderTool/WorkOrderTool.tsx
import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

// 型定義と定数
import type {
  CompanyOptionValue,
  ProcessedCompanyInfo,
  PdfFile,
  PdfProcessSuccessResponse,
  CompanyDetectionResult,
} from '@/types';
import { ALL_COMPANY_OPTIONS } from '@/constants/company'; // すべての会社情報 (ラベル取得用)

// カスタムフック
import { useFileHandler } from '@/hooks/useFileHandler';
import { usePdfDocument } from '@/hooks/usePdfDocument';
import { usePdfControls } from '@/hooks/usePdfControls';
import { usePdfProcessor } from '@/hooks/usePdfProcessor';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useWorkOrderStatus } from '@/hooks/useWorkOrderStatus';
import { useBatchProcessor } from '@/hooks/useBatchProcessor';

// 子コンポーネント
import { FileManagementPanel } from '@/components/workOrderTool/FileManagementPanel';
import { PdfPreviewPanel } from '@/components/workOrderTool/PdfPreviewPanel';
import { GeneratedTextPanel } from '@/components/workOrderTool/GeneratedTextPanel';
import { DetectionFeedbackModal } from '@/components/workOrderTool/DetectionFeedbackModal';
import { BatchProgressPanel } from '@/components/workOrderTool/BatchProgressPanel';
import { BatchHistoryPanel } from '@/components/workOrderTool/BatchHistoryPanel';

// PDFのレンダリングを効率的に行うための Web Worker を設定
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const WorkOrderTool: React.FC = () => {
  // ブラウザ通知の許可を要求
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- 状態管理 ---
  // 会社選択の状態
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<CompanyOptionValue>('');
  // 生成されたテキストの状態
  const [generatedText, setGeneratedText] = useState<string>('');
  // 編集されたテキストの状態
  const [editedText, setEditedText] = useState<string>('');
  // AI処理結果に関する情報 (ファイル名、会社ラベル)
  const [processedCompanyInfo, setProcessedCompanyInfo] =
    useState<ProcessedCompanyInfo>({ file: undefined, companyLabel: '' });

  // 自動判定用の状態
  const [autoDetectEnabled, setAutoDetectEnabled] = useState<boolean>(true); // デフォルトで有効
  const [lastDetectionResult, setLastDetectionResult] =
    useState<CompanyDetectionResult | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [lastWorkOrderId, setLastWorkOrderId] = useState<string | null>(null);

  // バッチ処理用の状態
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<{ [fileName: string]: boolean }>({});
  const [showBatchProgress, setShowBatchProgress] = useState<boolean>(false);
  const [showBatchHistory, setShowBatchHistory] = useState<boolean>(false);
  
  // バッチ処理完了ファイルを追跡する状態
  const [batchProcessedFiles, setBatchProcessedFiles] = useState<{ [fileName: string]: 'success' | 'error' | 'processing' | 'cancelled' | 'pending' }>({});

  // --- カスタムフックの利用 ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadedFiles,
    // setUploadedFiles, // 直接は使わないが、useFileHandler内で使われる
    processingFile,
    setProcessingFile,
    pdfFileToDisplay,
    setPdfFileToDisplay,
    addFilesToList, // ファイルをリストに追加する関数
    handleFileSelect: handleFileSelectFromHook, // フックからの関数名を変更
  } = useFileHandler();

  const {
    resetPdfControls, // PDFコントロールリセット用関数
    pageNumber,
    setPageNumber,
    pageScale,
    setPageScale,
    pageRotation,
    // setPageRotation, // handleRotatePdf で管理
    handleRotatePdf,
    pdfDisplayContainerRef,
    isPanning,
    handleMouseDownOnPdfArea,
    handleMouseMoveOnPdfArea,
    handleMouseUpOrLeaveArea,
  } = usePdfControls();

  const {
    numPages,
    // setNumPages, // 直接は使わない
    onDocumentLoadSuccess: baseOnDocumentLoadSuccess, // フックからの基本処理
  } = usePdfDocument();

  // ステータス管理フック（usePdfProcessorより先に定義する必要がある）
  const {
    processState,
    startProcessWithoutId,
    updateWorkOrderId,
    setDocumentCreating,
    completeProcess,
    setErrorState,
    cancelProcess: cancelWorkOrderStatus,
    clearProcess,
  } = useWorkOrderStatus({
    onProcessComplete: () => {
      toast.success('処理が完了しました！');
      // ブラウザ通知（対応ブラウザのみ）
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('MagIQ - 処理完了', {
          body: `「${processingFile?.name}」の手配書作成が完了しました`,
          icon: '/vite.svg',
        });
      }
    },
    onProcessError: (_, errorMessage) => {
      toast.error('処理中にエラーが発生しました', {
        description: errorMessage,
      });
    },
  });

  // API処理とローディング状態の管理
  const { isLoading, processFile, abortRequest } = usePdfProcessor({
    onSuccess: (data: PdfProcessSuccessResponse, file: File) => {
      // レスポンスデータの検証
      if (!data.generatedText && !data.ocrOnly) {
        console.error('Empty generatedText received:', data);
        setErrorState(
          'AIから空のレスポンスが返されました。PDFの内容を確認してください。'
        );
        return;
      }

      // 自動判定結果を保存
      if (data.detectionResult) {
        setLastDetectionResult(data.detectionResult);

        // OCRのみの場合はStage 2へ進む
        if (data.ocrOnly && data.detectionResult.detectedCompanyId) {
          const detectedCompanyId = data.detectionResult
            .detectedCompanyId as CompanyOptionValue;
          setSelectedCompanyId(detectedCompanyId);

          // OCR完了時：判定された会社情報を表示
          const companyLabel =
            ALL_COMPANY_OPTIONS.find((opt) => opt.value === detectedCompanyId)
              ?.label || detectedCompanyId;

          setGeneratedText(
            `📋 会社判定が完了しました\n\n✅ 判定結果: ${companyLabel}\n📊 信頼度: ${(data.detectionResult.confidence * 100).toFixed(0)}%\n\n🔄 手配書作成を開始します...`
          );

          toast.success(`会社を自動判定しました: ${detectedCompanyId}`, {
            description: `信頼度: ${(data.detectionResult.confidence * 100).toFixed(0)}% - 手配書作成を開始します`,
          });

          // Stage 1完了 → Stage 2の状態に遷移
          if (data.dbRecordId) {
            updateWorkOrderId(data.dbRecordId);
          }

          setTimeout(async () => {
            // Stage 2開始時に確実に手配書作成中状態を設定
            setDocumentCreating();

            toast.info(`「${file.name}」の手配書作成を開始します`, {
              description: `会社: ${companyLabel}`,
            });

            await processFile(
              file,
              detectedCompanyId,
              companyLabel,
              false, // enableAutoDetection = false (判定は完了済み)
              false // ocrOnly = false (手配書作成を実行)
            );
          }, 1000); // 1秒待ってからStage 2を実行

          return; // Stage 1完了、Stage 2は非同期で実行
        }

        // 通常の自動判定結果処理
        if (data.detectionResult.detectedCompanyId && !selectedCompanyId) {
          setSelectedCompanyId(
            data.detectionResult.detectedCompanyId as CompanyOptionValue
          );
          toast.info(
            `会社を自動判定しました: ${data.detectionResult.detectedCompanyId} (信頼度: ${(data.detectionResult.confidence * 100).toFixed(0)}%)`
          );
        }
      }

      // 手配書作成完了時の検証
      if (
        !data.ocrOnly &&
        (!data.generatedText || data.generatedText.trim().length === 0)
      ) {
        console.error('Empty final generatedText received:', data);
        setErrorState('手配書の生成に失敗しました。再度実行してください。');
        return;
      }

      // Work Order IDを保存（フィードバック用）
      if (data.dbRecordId) {
        setLastWorkOrderId(data.dbRecordId);
        // バッチ処理用に結果を保存
        lastProcessResultRef.current = {
          workOrderId: data.dbRecordId,
          detectionResult: data.detectionResult || undefined,
        };
        // 処理完了状態に遷移
        completeProcess();
      }

      const companyLabel =
        ALL_COMPANY_OPTIONS.find((opt) => opt.value === data.identifiedCompany)
          ?.label || String(data.identifiedCompany);
      setProcessedCompanyInfo({ 
        file, 
        companyLabel,
        status: 'completed' // 処理成功時はcompletedステータスを設定
      });

      // 最終的な生成テキストを設定
      if (data.generatedText && !data.ocrOnly) {
        setGeneratedText(data.generatedText);
      }

      toast.success(
        `「${file.name}」のAI処理が完了しました！ (会社: ${companyLabel})`
      );
      // processingFile はAI処理が完了しても維持 (どのファイルの結果かを示すため)
    },
    onError: (
      errorMessage: string,
      file: File,
      companyLabelForError: string
    ) => {
      setGeneratedText(
        `エラーが発生しました:\n${errorMessage}\n\n処理対象の会社を正しく選択しているか確認してください。\n\n再度、手配書作成ボタンを押下してください。\n\n解決しない場合は開発者に連絡してください。`
      );
      setProcessedCompanyInfo({
        file,
        companyLabel: `エラー (${companyLabelForError})`,
        status: 'error' // エラー時はerrorステータスを設定
      });

      // プロセス状態をエラーに更新
      setErrorState(errorMessage);

      toast.error(`処理エラー: ${errorMessage}`, {
        description: `ファイル「${file.name}」の処理中に問題が発生しました。`,
      });
    },
  });


  // processFileの結果を保持するためのRef
  const lastProcessResultRef = useRef<{ workOrderId?: string; detectionResult?: CompanyDetectionResult } | null>(null);

  // バッチ処理用のAbortController（永続化）
  const batchAbortControllerRef = useRef<AbortController | null>(null);
  
  // バッチ処理用AbortControllerを初期化（一度だけ）
  React.useEffect(() => {
    if (!batchAbortControllerRef.current) {
      batchAbortControllerRef.current = new AbortController();
    }
  }, []);
  
  // バッチ処理専用のPDFプロセッサ
  const { processFile: batchProcessFile } = usePdfProcessor({
    onSuccess: (data: PdfProcessSuccessResponse) => {
      // バッチ処理の成功処理は個別ファイル処理と同じロジック
      // レスポンスデータの検証
      if (!data.generatedText && !data.ocrOnly) {
        console.error('Empty generatedText received:', data);
        return;
      }

      // 自動判定結果を保存
      if (data.detectionResult) {
        setLastDetectionResult(data.detectionResult);
      }

      // Work Order IDを保存（フィードバック用）
      if (data.dbRecordId) {
        setLastWorkOrderId(data.dbRecordId);
        // バッチ処理用に結果を保存
        lastProcessResultRef.current = {
          workOrderId: data.dbRecordId,
          detectionResult: data.detectionResult || undefined,
        };
      }
    },
    onError: (errorMessage: string, file: File) => {
      console.error(`[Batch Processing] Error processing ${file.name}:`, errorMessage);
      // エラー時も結果をrefに保存（エラー状態として）
      lastProcessResultRef.current = null;
    },
    // バッチ処理専用のAbortSignalを渡す
    externalAbortSignal: batchAbortControllerRef.current?.signal,
  });

  // バッチ処理フック
  const {
    batchState,
    startBatchProcess,
    pauseBatchProcess,
    resumeBatchProcess,
    cancelBatchProcess,
    getProgress,
    getElapsedTime,
  } = useBatchProcessor({
    processFile: async (file, companyId, companyLabel, enableAutoDetection, ocrOnly) => {
      // バッチ処理がキャンセルされている場合は早期リターン
      if (batchAbortControllerRef.current?.signal.aborted) {
        console.log(`[Batch Processing] Skipping ${file.name} - batch was cancelled`);
        return null;
      }
      
      // processFileを呼び出す前にrefをクリア
      lastProcessResultRef.current = null;
      
      // バッチ処理専用のprocessFileを呼び出し
      await batchProcessFile(file, companyId, companyLabel, enableAutoDetection, ocrOnly);
      
      // 処理結果をrefから取得して返す
      return lastProcessResultRef.current;
    },
    onFileProcessed: (result) => {
      // 各ファイルの処理完了時の処理
      console.log('File processed:', result);
      
      // バッチ処理完了ファイルの状態を更新
      setBatchProcessedFiles(prev => ({
        ...prev,
        [result.fileName]: result.status,
      }));
      
      // 処理済みファイルのリストを更新（現在プレビュー中の場合は自動的に生成文言を表示）
      if (result.status === 'success' && result.workOrderId && pdfFileToDisplay?.name === result.fileName) {
        // 現在プレビュー中のファイルが処理完了した場合、自動的にデータを取得して表示
        import('@/lib/api').then(({ getWorkOrderByFileName }) => {
          getWorkOrderByFileName(result.fileName).then(workOrder => {
            if (workOrder) {
              setGeneratedText(workOrder.generated_text || '');
              setEditedText(workOrder.edited_text || '');
              setLastWorkOrderId(workOrder.id);
              setProcessedCompanyInfo({
                file: pdfFileToDisplay,
                companyLabel: workOrder.company_name || '',
              });
            }
          });
        });
      }
    },
    onBatchComplete: (results) => {
      // バッチ処理完了時の処理
      setShowBatchProgress(false);
      setBatchMode(false);
      setSelectedFiles({});
      
      // バッチ処理用AbortControllerをクリーンアップ
      if (batchAbortControllerRef.current) {
        batchAbortControllerRef.current = null;
      }
      
      // 処理中状態をクリア
      setProcessingFile(null);
      clearProcess();
      
      // 成功したファイル数を通知
      const successCount = results.filter(r => r.status === 'success').length;
      if (successCount > 0) {
        toast.success(`${successCount}個のファイルの処理が完了しました。ファイルをクリックして結果を確認してください。`);
      }
    },
    getCompanyLabel: (companyId) => 
      ALL_COMPANY_OPTIONS.find(opt => opt.value === companyId)?.label || companyId,
  });

  // 統合された中断処理：バッチ処理中か単体処理中かを判定して適切にキャンセル
  const cancelProcess = useCallback(() => {
    if (batchState.isProcessing) {
      // バッチ処理中の場合
      console.log('[cancelProcess] Cancelling batch process');
      
      // バッチレベルのAbortControllerを中断
      if (batchAbortControllerRef.current) {
        batchAbortControllerRef.current.abort();
        batchAbortControllerRef.current = null;
      }
      
      // バッチ処理をキャンセル
      cancelBatchProcess();
      
      // UI状態もクリア
      setShowBatchProgress(false);
      setProcessingFile(null);
      clearProcess();
      
      // バッチ処理済みファイル状態を更新（成功済みは保持、それ以外はキャンセル）
      setBatchProcessedFiles(prev => {
        const updated = { ...prev };
        
        // 既に成功したファイルは保持
        const successfulFiles = batchState.results
          .filter(result => result.status === 'success')
          .map(result => result.fileName);
        
        // 全てのファイルを確認
        Object.keys(updated).forEach(fileName => {
          // 成功済みファイル以外をキャンセル状態に更新
          if (!successfulFiles.includes(fileName) && updated[fileName] !== 'success') {
            updated[fileName] = 'cancelled';
          }
        });
        
        return updated;
      });
      
      toast.info('バッチ処理を中断しました');
    } else {
      // 単体処理中の場合
      console.log('[cancelProcess] Cancelling single file process');
      
      cancelWorkOrderStatus(); // ワークオーダーステータスを中断状態にする
      abortRequest(); // 進行中のAPIリクエストを中断する
      
      toast.info('処理を中断しました');
    }
  }, [batchState.isProcessing, batchState.results, cancelBatchProcess, cancelWorkOrderStatus, abortRequest, clearProcess, setProcessingFile, setBatchProcessedFiles]);

  /**
   * 2段階処理：OCR+会社判定 → 手配書作成
   */
  const handleTwoStageProcess = useCallback(async () => {
    if (!processingFile) return;

    try {
      // Stage 1: OCR + 会社判定
      toast.info(`「${processingFile.name}」の会社判定を開始します...`, {
        description: 'PDFから会社情報を抽出中',
      });

      // OCR専用処理で会社判定を実行
      await processFile(
        processingFile,
        '', // 会社IDは未選択
        'OCR処理',
        true, // enableAutoDetection = true
        true // ocrOnly = true
      );
    } catch (error) {
      console.error('[Two Stage Process] Error in OCR stage:', error);
      toast.error('会社判定中にエラーが発生しました');
    }
  }, [processingFile, processFile]);

  /**
   * 「AI実行」ボタンが押されたときの処理。
   * 自動判定が有効な場合は2段階処理。
   */
  const handleAiExecution = useCallback(async () => {
    if (!processingFile) {
      toast.error('処理対象のファイルが選択されていません。', {
        description:
          'リストからファイルをクリックしてプレビューし、処理対象を選択してください。',
      });
      return;
    }

    // 自動判定が無効で、会社が選択されていない場合のみエラー
    if (!autoDetectEnabled && !selectedCompanyId) {
      toast.error('会社が選択されていません。', {
        description:
          '処理を開始する前に、ドロップダウンから会社を選択してください。',
      });
      return;
    }

    if (isLoading) {
      toast.info('現在別のファイルを処理中です。少々お待ちください。');
      return;
    }

    setLastDetectionResult(null); // 前回の判定結果をクリア
    clearProcess(); // 前回のプロセス状態をクリア

    // プログレスバー表示開始
    startProcessWithoutId();

    // 自動判定有効の場合は2段階処理
    if (autoDetectEnabled) {
      await handleTwoStageProcess();
    } else {
      // 自動判定無効の場合は従来通りの1段階処理
      const companyLabelForToast = selectedCompanyId
        ? ALL_COMPANY_OPTIONS.find((c) => c.value === selectedCompanyId)
            ?.label || selectedCompanyId
        : '会社未選択';

      toast.info(
        `「${processingFile.name}」の手配書作成を開始します (会社: ${companyLabelForToast})...`
      );
      await processFile(
        processingFile,
        selectedCompanyId,
        companyLabelForToast,
        false,
        false
      );
    }
  }, [
    processingFile,
    selectedCompanyId,
    autoDetectEnabled,
    isLoading,
    processFile,
    handleTwoStageProcess,
    clearProcess,
    startProcessWithoutId,
  ]);

  // --- 連携ロジックとコールバック関数 ---

  /**
   * PDFドキュメントの読み込みが成功した際のコールバック。
   * ページ数を設定し、PDFビューアのコントロール（ページ番号、スケール、回転）をリセットします。
   */
  const handleDocumentLoadSuccess = useCallback(
    (params: { numPages: number }) => {
      baseOnDocumentLoadSuccess(params); // usePdfDocumentの基本処理を呼び出す
      resetPdfControls(); // PDFコントロールをリセット
    },
    [baseOnDocumentLoadSuccess, resetPdfControls]
  );

  /**
   * 編集テキストが変更されたときのコールバック。
   * GeneratedTextPanelから呼び出される。
   */
  const handleEditedTextChange = useCallback((newEditedText: string) => {
    setEditedText(newEditedText);
  }, []);

  /**
   * ファイルリスト内のファイルがクリックされたときの処理。
   * 該当ファイルのPDFプレビューを行い、既存のwork_orderデータがあれば表示します。
   */
  const handleFilePreviewRequest = useCallback(
    async (file: PdfFile) => {
      if (isLoading) {
        // AI処理中は何もしない（またはトースト表示）
        toast.info(
          '現在AI処理中です。完了後に別のファイルをプレビューできます。'
        );
        return;
      }
      
      console.log(`[handleFilePreviewRequest] ファイルクリック: ${file.name}`);
      
      setPdfFileToDisplay(file);
      setProcessingFile(file); // ★ プレビュー中のファイルを「次にAI実行する対象」としてマーク
      
      // 既存の通知を消す
      toast.dismiss();
      
      // データベースから既存のwork_orderを検索
      try {
        console.log(`[handleFilePreviewRequest] データベース検索開始: ${file.name}`);
        const { getWorkOrderByFileName } = await import('@/lib/api');
        const workOrder = await getWorkOrderByFileName(file.name);
        
        console.log(`[handleFilePreviewRequest] 検索結果:`, workOrder);
        
        if (workOrder) {
          // 既存のwork_orderが見つかった場合、その内容を表示
          console.log(`[handleFilePreviewRequest] 処理済みデータを表示: status=${workOrder.status}`);
          
          // completedステータスの場合のみ処理済みとして扱う
          if (workOrder.status === 'completed') {
            setGeneratedText(workOrder.generated_text || '');
            setEditedText(workOrder.edited_text || '');
            setLastWorkOrderId(workOrder.id);
            setProcessedCompanyInfo({
              file: file,
              companyLabel: workOrder.company_name || '',
              status: 'completed', // ステータスを明示的に設定
            });
            clearProcess(); // プロセス状態をクリア
            
            toast.success(`「${file.name}」の処理済みデータを表示しています。`);
          } else {
            // completed以外のステータス（processing, error等）の場合は処理済み扱いしない
            setGeneratedText('');
            setEditedText('');
            setProcessedCompanyInfo({ 
              file: undefined, 
              companyLabel: '',
              status: undefined // ステータスもクリア
            });
            setLastDetectionResult(null);
            setLastWorkOrderId(workOrder.id); // IDだけは保持（再処理用）
            clearProcess();
            
            // ステータスに応じてメッセージを変更
            if (workOrder.status === 'processing') {
              toast.info(`「${file.name}」は処理中です。完了までお待ちください。`);
            } else if (workOrder.status === 'error') {
              toast.warning(`「${file.name}」の処理でエラーが発生しています。再処理が可能です。`);
            } else {
              toast.info(`「${file.name}」をプレビュー中です。AI実行ボタンを押して処理を開始してください。`);
            }
          }
        } else {
          console.log(`[handleFilePreviewRequest] 処理済みデータなし - プレビュー状態に設定`);
          // データがない場合はプレビュー状態をクリア
          setGeneratedText('');
          setEditedText('');
          setProcessedCompanyInfo({ 
            file: undefined, 
            companyLabel: '',
            status: undefined
          });
          setLastDetectionResult(null);
          setLastWorkOrderId(null);
          clearProcess();
          
          toast.info(`「${file.name}」をプレビュー中です。AI実行ボタンを押して処理を開始してください。`);
        }
      } catch (error) {
        console.error('[handleFilePreviewRequest] 既存データの取得エラー:', error);
        
        // エラー時もプレビュー状態をクリア
        setGeneratedText('');
        setEditedText('');
        setProcessedCompanyInfo({ 
          file: undefined, 
          companyLabel: '',
          status: undefined
        });
        setLastDetectionResult(null);
        setLastWorkOrderId(null);
        clearProcess();
        
        toast.error(`「${file.name}」のデータ取得中にエラーが発生しました。`);
      }
    },
    [
      isLoading,
      setPdfFileToDisplay,
      setProcessingFile,
      setGeneratedText,
      setEditedText,
      setProcessedCompanyInfo,
      setLastDetectionResult,
      setLastWorkOrderId,
      clearProcess,
    ]
  );

  /**
   * ファイルがアップロードまたはドラッグアンドドロップで追加されたときの処理。
   * ファイルをリストに追加するだけ。
   */
  const handleNewFilesAdded = useCallback(
    (files: File[]) => {
      addFilesToList(files);
      // ★ ここでは自動プレビューや自動処理は行わない
      //   もしリスト追加後、最初のファイルをデフォルトでプレビューしたい場合は、
      //   ここで setPdfFileToDisplay(files[0] as PdfFile) などを行う
    },
    [addFilesToList]
  );

  const { isDragging, dragEventHandlers } = useDragAndDrop(handleNewFilesAdded);

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFileSelectFromHook(event); // useFileHandler の関数を呼び出すだけ
    // ★ ここでは自動プレビューや自動処理は行わない
  };

  /**
   * バッチ処理関連の関数
   */
  const handleFileSelectionChange = useCallback((fileName: string, selected: boolean) => {
    setSelectedFiles(prev => ({
      ...prev,
      [fileName]: selected,
    }));
  }, []);

  const handleSelectAll = useCallback(() => {
    const newSelection: { [fileName: string]: boolean } = {};
    uploadedFiles.forEach(file => {
      newSelection[file.name] = true;
    });
    setSelectedFiles(newSelection);
  }, [uploadedFiles]);

  const handleDeselectAll = useCallback(() => {
    setSelectedFiles({});
  }, []);

  const handleBatchProcess = useCallback(async () => {
    const filesToProcess = uploadedFiles.filter(file => selectedFiles[file.name]);
    
    if (filesToProcess.length === 0) {
      toast.error('処理するファイルを選択してください');
      return;
    }

    if (!selectedCompanyId && !autoDetectEnabled) {
      toast.error('会社を選択してください');
      return;
    }

    // バッチ処理開始時に状態をクリア
    setBatchProcessedFiles({});
    
    // バッチ処理用のAbortControllerを作成（前回がabortされている場合は新しく作成）
    if (!batchAbortControllerRef.current || batchAbortControllerRef.current.signal.aborted) {
      batchAbortControllerRef.current = new AbortController();
    }
    
    setShowBatchProgress(true);
    await startBatchProcess(filesToProcess, {
      companyId: selectedCompanyId,
      autoDetectEnabled,
      concurrentLimit: 1, // 1つずつ処理
      pauseOnError: true,
    });
  }, [uploadedFiles, selectedFiles, selectedCompanyId, autoDetectEnabled, startBatchProcess]);

  const handleBatchModeToggle = useCallback(() => {
    setBatchMode(!batchMode);
    setSelectedFiles({});
    setShowBatchProgress(false);
  }, [batchMode]);

  /**
   * 判定フィードバックの送信
   */
  const handleDetectionFeedback = async (
    correctedCompanyId: string,
    correctionReason: string
  ) => {
    if (!lastWorkOrderId || !lastDetectionResult) {
      toast.error('フィードバック送信に必要な情報がありません');
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;

      const { error } = await supabase
        .from('company_detection_history')
        .insert({
          work_order_id: lastWorkOrderId,
          file_name: processingFile?.name || '',
          detected_company_id: lastDetectionResult.detectedCompanyId,
          detection_confidence: lastDetectionResult.confidence,
          detection_details: lastDetectionResult.details,
          user_corrected_company_id: correctedCompanyId,
          correction_reason: correctionReason,
          created_by: userId,
        });

      if (error) throw error;

      toast.success(
        'フィードバックを送信しました。今後の判定精度向上に活用されます。'
      );
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('フィードバックの送信に失敗しました');
    }
  };

  // --- JSXレンダリング ---
  return (
    <div
      className={`flex flex-col h-full pt-4 ${
        isDragging ? 'border-4 border-dashed border-primary bg-primary/10' : ''
      }`}
      {...dragEventHandlers}
    >
      {/* ツールヘッダー */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
        <h1 className="text-xl font-semibold">業務手配書 作成ツール</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showBatchHistory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowBatchHistory(!showBatchHistory)}
          >
            履歴
          </Button>
        </div>
      </header>

      {/* メインコンテンツエリア (3ペイン) */}
      <div className="flex flex-1 overflow-hidden">
        <FileManagementPanel
          uploadedFiles={uploadedFiles}
          processingFile={processingFile}
          pdfFileToDisplay={pdfFileToDisplay}
          generatedText={generatedText}
          isLoading={isLoading}
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
          onFileUploadClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileInputChange} // input[type=file] の onChange
          onFilePreviewRequest={handleFilePreviewRequest} // リストアイテムクリック時
          processedCompanyInfo={processedCompanyInfo}
          // 自動判定用のプロパティ
          autoDetectEnabled={autoDetectEnabled}
          onAutoDetectToggle={() => setAutoDetectEnabled(!autoDetectEnabled)}
          lastDetectionResult={lastDetectionResult}
          // バッチ処理用のプロパティ
          batchMode={batchMode}
          selectedFiles={selectedFiles}
          onFileSelectionChange={handleFileSelectionChange}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBatchProcess={handleBatchProcess}
          batchProcessing={batchState.isProcessing}
          onBatchModeToggle={handleBatchModeToggle}
          // バッチ処理完了ファイル状態
          batchProcessedFiles={batchProcessedFiles}
        />

        <main className="flex-1 flex flex-row overflow-hidden">
          <PdfPreviewPanel
            pdfFileToDisplay={pdfFileToDisplay}
            numPages={numPages}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            pageScale={pageScale}
            setPageScale={setPageScale}
            pageRotation={pageRotation}
            onRotatePdf={handleRotatePdf}
            onDocumentLoadSuccess={handleDocumentLoadSuccess}
            pdfDisplayContainerRef={pdfDisplayContainerRef}
            isPanning={isPanning}
            onMouseDownOnPdfArea={handleMouseDownOnPdfArea}
            onMouseMoveOnPdfArea={handleMouseMoveOnPdfArea}
            onMouseUpOrLeaveArea={handleMouseUpOrLeaveArea}
            isLoading={isLoading && !!processingFile} // AI処理中かつ対象ファイルがある場合
            processingFileForHeader={pdfFileToDisplay} // ヘッダー表示用 (プレビュー中のファイル)
            onExecuteAi={handleAiExecution} // AI実行関数を渡す
            canExecuteAi={
              !!processingFile && (!!selectedCompanyId || autoDetectEnabled)
            } // 実行可能条件を渡す (自動判定有効時は会社未選択でもOK)
          />

          <GeneratedTextPanel
            generatedText={generatedText}
            isLoading={isLoading && !!processingFile} // AI処理中かつ対象ファイルがある場合
            processingFile={processingFile} // プレースホルダー用 (AI処理中のファイル)
            pdfFileToDisplayForPlaceholder={pdfFileToDisplay} // プレースホルダー用 (プレビュー中のファイル)
            processedCompanyInfo={processedCompanyInfo}
            lastDetectionResult={lastDetectionResult}
            onRequestFeedback={() => setShowFeedbackModal(true)}
            workOrderId={lastWorkOrderId || undefined}
            editedText={editedText}
            onEditedTextChange={handleEditedTextChange}
            processState={processState}
            onCancelProcess={cancelProcess}
          />
        </main>
      </div>

      {/* フィードバックモーダル */}
      <DetectionFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        detectionResult={
          lastDetectionResult || {
            detectedCompanyId: null,
            confidence: 0,
            method: 'unknown',
            details: {},
          }
        }
        currentFileName={processingFile?.name || ''}
        onSubmitFeedback={handleDetectionFeedback}
      />

      {/* バッチ処理進捗パネル */}
      {showBatchProgress && (
        <div className="fixed bottom-4 right-4 z-50 w-96">
          <BatchProgressPanel
            batchState={batchState}
            onPause={pauseBatchProcess}
            onResume={resumeBatchProcess}
            onCancel={cancelProcess}
            progress={getProgress()}
            elapsedTime={getElapsedTime()}
          />
        </div>
      )}

      {/* バッチ処理履歴パネル */}
      {showBatchHistory && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-lg">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-semibold">バッチ処理履歴</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBatchHistory(false)}
                >
                  閉じる
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <BatchHistoryPanel />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderTool;
