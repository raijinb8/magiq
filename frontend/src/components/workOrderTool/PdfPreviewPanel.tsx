// src/pages/admin/WorkOrderTool/components/PdfPreviewPanel.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Document, Page } from 'react-pdf';
import { Plus, Minus, RotateCw } from 'lucide-react';
import type { PdfFile } from '@/types';
import { toast } from 'sonner';

interface PdfPreviewPanelProps {
  pdfFileToDisplay: PdfFile | string | null; // URLの場合も考慮
  numPages: number | null;
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>; // 直接setterを渡す例
  pageScale: number;
  setPageScale: React.Dispatch<React.SetStateAction<number>>; // 直接setterを渡す例
  pageRotation: number;
  // setPageRotation: React.Dispatch<React.SetStateAction<number>>; // または回転用ハンドラ
  onRotatePdf: () => void; // 回転用ハンドラ
  onDocumentLoadSuccess: (params: { numPages: number }) => void;
  pdfDisplayContainerRef: React.RefObject<HTMLDivElement | null>;
  isPanning: boolean;
  onMouseDownOnPdfArea: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMoveOnPdfArea: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUpOrLeaveArea: () => void;
  isLoading: boolean; // AI処理中かどうかのローディング状態
  processingFileForHeader: PdfFile | null; // ヘッダーに表示するファイル名 (AI処理中のファイルなど)
  onExecuteAi: () => void; // AI実行ボタンのコールバック
  canExecuteAi: boolean; // AI実行ボタンの有効/無効を親から受け取る
}

export const PdfPreviewPanel: React.FC<PdfPreviewPanelProps> = ({
  pdfFileToDisplay,
  numPages,
  pageNumber,
  setPageNumber,
  pageScale,
  setPageScale,
  // pageRotation, // onRotatePdfを使うので不要な場合も
  onRotatePdf,
  onDocumentLoadSuccess,
  pdfDisplayContainerRef,
  isPanning,
  onMouseDownOnPdfArea,
  onMouseMoveOnPdfArea,
  onMouseUpOrLeaveArea,
  isLoading, // このisLoadingはAI処理中を示すもの
  processingFileForHeader, // ヘッダー表示用のファイル名
  pageRotation, // Pageコンポーネントに渡すために必要
  onExecuteAi,
  canExecuteAi,
}) => {
  const handlePreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages));
    }
  };

  const handleZoomOut = () => {
    setPageScale((prev) => Math.max(0.25, prev - 0.25));
  };

  const handleZoomIn = () => {
    setPageScale((prev) => Math.min(3.0, prev + 0.25));
  };

  const handleZoomReset = () => {
    setPageScale(1.0);
  };

  return (
    <div className="w-1/2 border-r p-4 flex flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          PDFプレビュー{' '}
          {/* 表示するファイル名 (AI処理中のファイル名か、単にプレビュー中のファイル名か) */}
          {pdfFileToDisplay &&
            typeof pdfFileToDisplay !== 'string' &&
            `(${pdfFileToDisplay.name})`}
          {typeof pdfFileToDisplay === 'string' && '(URLから表示中)'}
        </h2>
      </div>

      {/* PDFコントロールヘッダー */}
      {pdfFileToDisplay && numPages && (
        <div className="bg-slate-200 dark:bg-slate-700 p-2 flex items-center justify-center gap-2 w-full mb-2">
          {' '}
          {/* mb-2 を追加して間隔調整 */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={pageScale <= 0.25}
            title="縮小"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">
            {(pageScale * 100).toFixed(0)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={pageScale >= 3.0}
            title="拡大"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="100%"
            onClick={handleZoomReset}
            disabled={pageScale === 1.0}
          >
            100%
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onRotatePdf}
            title="回転"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber <= 1}
              onClick={handlePreviousPage}
            >
              前へ
            </Button>
            <span>
              ページ {pageNumber} / {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!numPages || pageNumber >= numPages}
              onClick={handleNextPage}
            >
              次へ
            </Button>
            {/* AI実行ボタン (既存コントロールの隣など、適切な位置に) */}
            <Button
              onClick={onExecuteAi}
              disabled={!canExecuteAi || isLoading} // isLoadingもここで考慮
              size="sm"
              className="ml-4 bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700" // スタイル例
              title={
                !canExecuteAi
                  ? 'ファイルと会社を選択してください'
                  : '選択中のPDFでAI処理を実行'
              }
            >
              手配書作成
            </Button>
          </div>
        </div>
      )}

      {/* PDF表示エリア */}
      <div
        ref={pdfDisplayContainerRef}
        className={`flex-grow overflow-auto w-full relative ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={onMouseDownOnPdfArea}
        onMouseMove={onMouseMoveOnPdfArea}
        onMouseUp={onMouseUpOrLeaveArea}
        onMouseLeave={onMouseUpOrLeaveArea}
      >
        {pdfFileToDisplay ? (
          <div
            style={{
              width: 'max-content',
              minWidth: '100%',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Document
              file={pdfFileToDisplay}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error: Error) => {
                // react-pdf は Error 型を返す
                toast.error('PDFの読み込みに失敗しました。', {
                  description: error.message,
                });
                console.error('Error while loading PDF:', error);
              }}
              loading={
                <p className="text-muted-foreground p-4">PDFを読み込み中...</p>
              }
              noData={
                // このケースは親コンポーネントの条件分岐で通常表示されない
                <p className="text-muted-foreground p-4">
                  表示するPDFが選択されていません。
                </p>
              }
              error={
                // 同上
                <p className="text-red-500 p-4">PDFの読み込みエラー。</p>
              }
              className="flex flex-col items-center"
            >
              {numPages && (
                <Page
                  pageNumber={pageNumber}
                  scale={pageScale}
                  rotate={pageRotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg mx-auto"
                  loading={<p>ページを読み込み中...</p>}
                  // onRenderSuccess={() => {}} // 必要に応じて追加
                />
              )}
            </Document>
          </div>
        ) : isLoading && processingFileForHeader ? ( // AI処理中で、対象ファイルがある場合
          <p className="text-muted-foreground p-4">
            AI処理中です。「{processingFileForHeader.name}」<br />
            完了後にPDFが表示されます...
          </p>
        ) : (
          <p className="text-muted-foreground p-4">
            左のリストからファイルを選択するか、新しいPDFをアップロードして処理を開始してください。
          </p>
        )}
      </div>
    </div>
  );
};
