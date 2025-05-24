// src/pages/admin/WorkOrderTool/hooks/usePdfDocument.ts
import { useState, useCallback } from 'react';

export interface PdfDocumentLoadSuccessParams {
  numPages: number;
}

export interface UsePdfDocumentReturn {
  numPages: number | null;
  setNumPages: React.Dispatch<React.SetStateAction<number | null>>;
  onDocumentLoadSuccess: (params: PdfDocumentLoadSuccessParams) => void;
}

/**
 * PDFドキュメントの読み込み状態（ページ数など）を管理するフック。
 * @param onNewDocumentLoaded 新しいドキュメントが読み込まれた際に呼び出されるコールバック (ページ番号リセット等に利用)
 */
export const usePdfDocument = (
  onNewDocumentLoaded?: () => void
): UsePdfDocumentReturn => {
  const [numPages, setNumPages] = useState<number | null>(null);

  /**
   * react-pdf の Document コンポーネントの onLoadSuccess イベントハンドラ。
   * PDFが読み込まれた際にページ数を設定し、関連する状態をリセットします。
   * @param params numPages を含むオブジェクト
   */
  const onDocumentLoadSuccess = useCallback(
    ({ numPages: nextNumPages }: PdfDocumentLoadSuccessParams): void => {
      setNumPages(nextNumPages);
      if (onNewDocumentLoaded) {
        onNewDocumentLoaded();
      }
    },
    [onNewDocumentLoaded]
  ); // onNewDocumentLoaded を依存配列に追加

  return {
    numPages,
    setNumPages,
    onDocumentLoadSuccess,
  };
};
