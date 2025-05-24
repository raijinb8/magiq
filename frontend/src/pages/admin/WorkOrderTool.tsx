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
    handleFileSelect, // input要素のonChange用
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
   * 会社が選択されていればAI処理を開始し、されていなければプレビューのみ更新します。
   */
  const handleFileProcessRequest = useCallback(
    async (file: PdfFile) => {
      if (isLoading) {
        toast.info('現在別のファイルを処理中です。少々お待ちください。');
        return;
      }
      if (selectedCompanyId) {
        setProcessingFile(file); // これから処理するファイルとしてマーク
        setGeneratedText(''); // 前回の結果をクリア
        setPdfFileToDisplay(file); // プレビュー対象も更新
        // processedCompanyInfo は processFile の成功/エラーコールバックで更新される
        const companyLabel =
          ALL_COMPANY_OPTIONS.find((c) => c.value === selectedCompanyId)
            ?.label || selectedCompanyId;
        toast.info(
          `「${file.name}」の処理を開始します (会社: ${companyLabel})...`
        );
        await processFile(file, selectedCompanyId, companyLabel);
      } else {
        // 会社未選択時はプレビューのみ更新
        setPdfFileToDisplay(file);
        setProcessingFile(file); // プレビュー対象としてマーク（処理はしない）
        setGeneratedText(''); // テキストエリアクリア
        setProcessedCompanyInfo({ file: null, companyLabel: '' }); // 処理結果情報クリア
        // numPages, pageNumber, pageRotation は onDocumentLoadSuccess でリセットされる
        toast.info('会社を選択すると、このファイルのAI処理を開始できます。', {
          description: `ファイル「${file.name}」をプレビュー中です。`,
        });
      }
    },
    [
      isLoading,
      selectedCompanyId,
      processFile,
      setProcessingFile,
      setPdfFileToDisplay,
      setGeneratedText,
      setProcessedCompanyInfo,
    ]
  );

  /**
   * ファイルがアップロードまたはドラッグアンドドロップで追加されたときの処理。
   * 最初の有効なファイルを自動的に処理対象にするか、プレビュー対象にします。
   */
  const handleNewFilesAdded = useCallback(
    (files: File[]) => {
      const firstValidFile = addFilesToList(files);
      if (firstValidFile && !isLoading) {
        // 新しいファイルが追加されたら、それを処理/プレビュー対象にする
        handleFileProcessRequest(firstValidFile as PdfFile);
      }
    },
    [addFilesToList, isLoading, handleFileProcessRequest]
  );

  const { isDragging, dragEventHandlers } = useDragAndDrop(handleNewFilesAdded);

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const firstValidFile = handleFileSelect(event); // handleFileSelect は addFilesToList を内部で呼ぶ
    if (firstValidFile && !isLoading) {
      handleFileProcessRequest(firstValidFile as PdfFile);
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
          onFileProcessRequest={handleFileProcessRequest} // リストアイテムクリック時
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
