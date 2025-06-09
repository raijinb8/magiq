// src/pages/admin/WorkOrderTool/WorkOrderTool.tsx
import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from '@/components/ui/button';

// 型定義と定数
import type {
  CompanyOptionValue,
  ProcessedCompanyInfo,
  PdfFile,
  PdfProcessSuccessResponse,
  FileSelectionState,
  BatchProcessResult,
  CompanyDetectionResult,
} from '@/types';
import { ALL_COMPANY_OPTIONS } from '@/constants/company'; // すべての会社情報 (ラベル取得用)

// カスタムフック
import { useFileHandler } from '@/hooks/useFileHandler';
import { usePdfDocument } from '@/hooks/usePdfDocument';
import { usePdfControls } from '@/hooks/usePdfControls';
import { usePdfProcessor } from '@/hooks/usePdfProcessor';
import { usePdfBatchProcessor } from '@/hooks/usePdfBatchProcessor';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

// 子コンポーネント
import { FileManagementPanel } from '@/components/workOrderTool/FileManagementPanel';
import { PdfPreviewPanel } from '@/components/workOrderTool/PdfPreviewPanel';
import { GeneratedTextPanel } from '@/components/workOrderTool/GeneratedTextPanel';
import { CompanyAutoDetectToggle } from '@/components/workOrderTool/CompanyAutoDetectToggle';
import { DetectionFeedbackModal } from '@/components/workOrderTool/DetectionFeedbackModal';

// PDFのレンダリングを効率的に行うための Web Worker を設定
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const WorkOrderTool: React.FC = () => {
  // --- 状態管理 ---
  // 会社選択の状態
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<CompanyOptionValue>('');
  // 生成されたテキストの状態
  const [generatedText, setGeneratedText] = useState<string>('');
  // AI処理結果に関する情報 (ファイル名、会社ラベル)
  const [processedCompanyInfo, setProcessedCompanyInfo] =
    useState<ProcessedCompanyInfo>({ file: null, companyLabel: '' });
  
  // バッチ処理用の状態
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<FileSelectionState>({});
  const [batchConsolidatedText, setBatchConsolidatedText] = useState<string>('');
  const [batchProcessResult, setBatchProcessResult] = useState<BatchProcessResult | null>(null);

  // 自動判定用の状態
  const [autoDetectEnabled, setAutoDetectEnabled] = useState<boolean>(true); // デフォルトで有効
  const [lastDetectionResult, setLastDetectionResult] = useState<CompanyDetectionResult | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [lastWorkOrderId, setLastWorkOrderId] = useState<string | null>(null);

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

  // API処理とローディング状態の管理
  const { isLoading, processFile } = usePdfProcessor({
    onSuccess: (data: PdfProcessSuccessResponse, file: File) => {
      setGeneratedText(
        data.generatedText || 'テキストが生成されませんでした。'
      );
      
      // 自動判定結果を保存
      if (data.detectionResult) {
        setLastDetectionResult(data.detectionResult);
        
        // 自動判定で会社が検出された場合、それを選択
        if (data.detectionResult.detectedCompanyId && !selectedCompanyId) {
          setSelectedCompanyId(data.detectionResult.detectedCompanyId as CompanyOptionValue);
          toast.info(`会社を自動判定しました: ${data.detectionResult.detectedCompanyId} (信頼度: ${(data.detectionResult.confidence * 100).toFixed(0)}%)`);
        }
      }
      
      // Work Order IDを保存（フィードバック用）
      if (data.dbRecordId) {
        setLastWorkOrderId(data.dbRecordId);
      }
      
      const companyLabel =
        ALL_COMPANY_OPTIONS.find((opt) => opt.value === data.identifiedCompany)
          ?.label || String(data.identifiedCompany);
      setProcessedCompanyInfo({ file, companyLabel });
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
      });
      // setProcessingFile(null); // エラー時も、どのファイルでエラーか示すために維持しても良い
      toast.error(`処理エラー: ${errorMessage}`, {
        description: `ファイル「${file.name}」の処理中に問題が発生しました。`,
      });
    },
  });

  // バッチ処理用のフック
  const { isLoading: isBatchLoading, processBatchFiles } = usePdfBatchProcessor({
    onSuccess: (result: BatchProcessResult, files: File[]) => {
      setBatchConsolidatedText(result.consolidatedText);
      setBatchProcessResult(result);
      setGeneratedText(result.consolidatedText); // 統合結果を表示
      const companyLabel =
        ALL_COMPANY_OPTIONS.find((opt) => opt.value === selectedCompanyId)
          ?.label || selectedCompanyId;
      setProcessedCompanyInfo({ 
        file: null, // バッチ処理の場合は単一ファイルではない
        companyLabel: `バッチ処理完了 (${companyLabel})` 
      });
      // ファイル選択状態をクリア
      setSelectedFiles({});
      setBatchMode(false); // バッチモードを終了
    },
    onError: (
      errorMessage: string,
      files: File[],
      companyLabelForError: string
    ) => {
      setBatchConsolidatedText(
        `バッチ処理エラーが発生しました:\n${errorMessage}\n\n処理対象の会社を正しく選択しているか確認してください。`
      );
      toast.error(`バッチ処理エラー: ${errorMessage}`, {
        description: `${files.length}個のファイルの処理中に問題が発生しました。`,
      });
    },
  });

  /**
   * 「AI実行」ボタンが押されたときの処理。
   * 現在 processingFile としてマークされているファイルに対してAI処理を開始します。
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

    // setGeneratedText(''); // AI処理開始時にクリアするかはUX次第 (processFileのコールバックで設定される)
    // setProcessedCompanyInfo({ file: null, companyLabel: '' }); // 同上
    setLastDetectionResult(null); // 前回の判定結果をクリア

    const companyLabelForToast =
      selectedCompanyId
        ? (ALL_COMPANY_OPTIONS.find((c) => c.value === selectedCompanyId)?.label || selectedCompanyId)
        : '自動判定';

    toast.info(
      `「${processingFile.name}」のAI処理を開始します (会社: ${companyLabelForToast})...`
    );
    await processFile(processingFile, selectedCompanyId, companyLabelForToast, autoDetectEnabled);
  }, [
    processingFile,
    selectedCompanyId,
    autoDetectEnabled,
    isLoading,
    processFile,
    // setGeneratedText, // 実際には不要 (processFileのコールバックで設定)
    // setProcessedCompanyInfo, // 実際には不要 (processFileのコールバックで設定)
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
   * ファイルリスト内のファイルがクリックされたときの処理。
   * 該当ファイルのPDFプレビューのみを行います。
   */
  const handleFilePreviewRequest = useCallback(
    (file: PdfFile) => {
      if (isLoading) {
        // AI処理中は何もしない（またはトースト表示）
        toast.info(
          '現在AI処理中です。完了後に別のファイルをプレビューできます。'
        );
        return;
      }
      setPdfFileToDisplay(file);
      setProcessingFile(file); // ★ プレビュー中のファイルを「次にAI実行する対象」としてマーク
      setGeneratedText(''); // プレビュー変更時は生成テキストをクリア
      setProcessedCompanyInfo({ file: null, companyLabel: '' }); // 処理情報もクリア
      setLastDetectionResult(null); // 前回の判定結果もクリア
      // ページ数などは Document の onLoadSuccess でリセットされる (handleDocumentLoadSuccess経由)
      toast.dismiss(); // 既存の通知があれば消す
      toast.info(`「${file.name}」をプレビュー中です。`);
    },
    [
      isLoading,
      setPdfFileToDisplay,
      setProcessingFile,
      setGeneratedText,
      setProcessedCompanyInfo,
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

  // --- バッチ処理関連のハンドラー ---
  
  /**
   * ファイル選択状態の変更
   */
  const handleFileSelectionChange = useCallback(
    (fileName: string, selected: boolean) => {
      setSelectedFiles(prev => ({
        ...prev,
        [fileName]: selected
      }));
    },
    []
  );

  /**
   * 全選択
   */
  const handleSelectAll = useCallback(() => {
    const newSelection: FileSelectionState = {};
    uploadedFiles.forEach(file => {
      newSelection[file.name] = true;
    });
    setSelectedFiles(newSelection);
  }, [uploadedFiles]);

  /**
   * 全解除
   */
  const handleDeselectAll = useCallback(() => {
    setSelectedFiles({});
  }, []);

  /**
   * バッチ処理の実行
   */
  const handleBatchProcess = useCallback(async () => {
    const selectedFileObjects = uploadedFiles.filter(file => selectedFiles[file.name]);
    
    if (selectedFileObjects.length === 0) {
      toast.error('処理するファイルを選択してください。');
      return;
    }

    if (!selectedCompanyId) {
      toast.error('会社が選択されていません。', {
        description: '処理を開始する前に、ドロップダウンから会社を選択してください。',
      });
      return;
    }

    const companyLabel =
      ALL_COMPANY_OPTIONS.find((c) => c.value === selectedCompanyId)?.label ||
      selectedCompanyId;

    await processBatchFiles(selectedFileObjects, selectedCompanyId, companyLabel);
  }, [uploadedFiles, selectedFiles, selectedCompanyId, processBatchFiles]);

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
          created_by: userId
        });

      if (error) throw error;

      toast.success('フィードバックを送信しました。今後の判定精度向上に活用されます。');
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
        <div className="ml-auto">
          <Button
            variant={batchMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setBatchMode(!batchMode);
              setSelectedFiles({});
              if (!batchMode) {
                // バッチモードに切り替える時は、既存の表示をクリア
                setGeneratedText('');
                setProcessedCompanyInfo({ file: null, companyLabel: '' });
              }
            }}
            disabled={isLoading || isBatchLoading}
          >
            {batchMode ? "通常モードに戻る" : "複数ファイル一括処理"}
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
          isLoading={isLoading || isBatchLoading}
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
          onFileUploadClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileInputChange} // input[type=file] の onChange
          onFilePreviewRequest={handleFilePreviewRequest} // リストアイテムクリック時
          processedCompanyInfo={processedCompanyInfo}
          // バッチ処理用の新しいプロパティ
          batchMode={batchMode}
          selectedFiles={selectedFiles}
          onFileSelectionChange={handleFileSelectionChange}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBatchProcess={handleBatchProcess}
          batchProcessing={isBatchLoading}
          // 自動判定用の新しいプロパティ
          autoDetectEnabled={autoDetectEnabled}
          onAutoDetectToggle={() => setAutoDetectEnabled(!autoDetectEnabled)}
          lastDetectionResult={lastDetectionResult}
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
            canExecuteAi={!!processingFile && (!!selectedCompanyId || autoDetectEnabled)} // 実行可能条件を渡す (自動判定有効時は会社未選択でもOK)
          />

          <GeneratedTextPanel
            generatedText={generatedText}
            isLoading={isLoading && !!processingFile} // AI処理中かつ対象ファイルがある場合
            processingFile={processingFile} // プレースホルダー用 (AI処理中のファイル)
            pdfFileToDisplayForPlaceholder={pdfFileToDisplay} // プレースホルダー用 (プレビュー中のファイル)
            selectedCompanyIdForPlaceholder={selectedCompanyId} // プレースホルダー用
            processedCompanyInfo={processedCompanyInfo}
            lastDetectionResult={lastDetectionResult}
            onRequestFeedback={() => setShowFeedbackModal(true)}
          />
        </main>
      </div>

      {/* フィードバックモーダル */}
      <DetectionFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        detectionResult={lastDetectionResult || {
          detectedCompanyId: null,
          confidence: 0,
          method: 'unknown',
          details: {}
        }}
        currentFileName={processingFile?.name || ''}
        onSubmitFeedback={handleDetectionFeedback}
      />
    </div>
  );
};

export default WorkOrderTool;
