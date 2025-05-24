// src/pages/admin/WorkOrderTool/WorkOrderTool.tsx
import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 型定義と定数
import type {
  CompanyOptionValue,
  ProcessedCompanyInfo,
  PdfFile,
  PdfProcessSuccessResponse,
} from '@/types';
import { ALL_COMPANY_OPTIONS } from '@/constants/company'; // すべての会社情報 (ラベル取得用)

// カスタムフック
import { useFileHandler } from '@/hooks/useFileHandler';
import { usePdfDocument } from '@/hooks/usePdfDocument';
import { usePdfControls } from '@/hooks/usePdfControls';
import { usePdfProcessor } from '@/hooks/usePdfProcessor';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

// 子コンポーネント
import { FileManagementPanel } from '@/components/workOrderTool/FileManagementPanel';
import { PdfPreviewPanel } from '@/components/workOrderTool/PdfPreviewPanel';
import { GeneratedTextPanel } from '@/components/workOrderTool/GeneratedTextPanel';

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
      const companyLabel =
        ALL_COMPANY_OPTIONS.find((opt) => opt.value === data.identifiedCompany)
          ?.label || (data.identifiedCompany as string);
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
        `エラーが発生しました:\n${errorMessage}\n\n詳細は開発者コンソールを確認してください。`
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
    if (!selectedCompanyId) {
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

    const companyLabelForToast =
      ALL_COMPANY_OPTIONS.find((c) => c.value === selectedCompanyId)?.label ||
      selectedCompanyId;

    toast.info(
      `「${processingFile.name}」のAI処理を開始します (会社: ${companyLabelForToast})...`
    );
    await processFile(processingFile, selectedCompanyId, companyLabelForToast);
  }, [
    processingFile,
    selectedCompanyId,
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
          />

          <GeneratedTextPanel
            generatedText={generatedText}
            isLoading={isLoading && !!processingFile} // AI処理中かつ対象ファイルがある場合
            processingFile={processingFile} // プレースホルダー用 (AI処理中のファイル)
            pdfFileToDisplayForPlaceholder={pdfFileToDisplay} // プレースホルダー用 (プレビュー中のファイル)
            selectedCompanyIdForPlaceholder={selectedCompanyId} // プレースホルダー用
            processedCompanyInfo={processedCompanyInfo}
          />
        </main>
      </div>
    </div>
  );
};

export default WorkOrderTool;
