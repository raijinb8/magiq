// src/pages/admin/WorkOrderTool/hooks/usePdfControls.ts
import { useState, useCallback, useRef } from 'react';
import type { Point, ScrollPosition } from '@/types'; // 型定義は適切にインポート

export interface UsePdfControlsReturn {
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  pageScale: number;
  setPageScale: React.Dispatch<React.SetStateAction<number>>;
  pageRotation: number;
  setPageRotation: React.Dispatch<React.SetStateAction<number>>;
  handleRotatePdf: () => void;
  pdfDisplayContainerRef: React.RefObject<HTMLDivElement | null>;
  isPanning: boolean;
  handleMouseDownOnPdfArea: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMoveOnPdfArea: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUpOrLeaveArea: () => void;
  resetPdfControls: () => void; // PDFドキュメントが変更された時にコントロールをリセットするための関数
}

/**
 * PDFビューアの操作（ページ、スケール、回転、パンニング）を管理するフック。
 */
export const usePdfControls = (): UsePdfControlsReturn => {
  // ★ 引数を削除
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageScale, setPageScale] = useState<number>(1.0);
  const [pageRotation, setPageRotation] = useState<number>(0);

  // パンニング機能関連
  const pdfDisplayContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState<ScrollPosition>({
    left: 0,
    top: 0,
  });

  /**
   * PDFコントロール（ページ番号、スケール、回転）を初期状態にリセットします。
   * 新しいPDFドキュメントが読み込まれた際に呼び出されることを想定しています。
   */
  const resetPdfControls = useCallback(() => {
    setPageNumber(1);
    setPageScale(1.0);
    setPageRotation(0);
  }, []); // 依存配列は空でOK（内部のsetterは安定しているため）

  /**
   * PDFを90度ずつ回転させます。
   */
  const handleRotatePdf = useCallback(() => {
    setPageRotation((prevRotation) => (prevRotation + 90) % 360);
  }, []);

  /**
   * PDF表示エリアでのマウスダウンイベントを処理し、パンニングを開始します。
   */
  const handleMouseDownOnPdfArea = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (pdfDisplayContainerRef.current) {
        setIsPanning(true);
        setPanStart({ x: event.clientX, y: event.clientY });
        setScrollStart({
          left: pdfDisplayContainerRef.current.scrollLeft,
          top: pdfDisplayContainerRef.current.scrollTop,
        });
      }
    },
    [] // isPanning や panStart, scrollStart はこの関数内で更新されるため依存配列に不要
  );

  /**
   * PDF表示エリアでのマウスムーブイベントを処理し、パンニング操作を実行します。
   */
  const handleMouseMoveOnPdfArea = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (isPanning && pdfDisplayContainerRef.current) {
        const deltaX = event.clientX - panStart.x;
        const deltaY = event.clientY - panStart.y;
        pdfDisplayContainerRef.current.scrollLeft = scrollStart.left - deltaX;
        pdfDisplayContainerRef.current.scrollTop = scrollStart.top - deltaY;
      }
    },
    [isPanning, panStart, scrollStart] // これらの値に依存して処理を行う
  );

  /**
   * PDF表示エリアでのマウスアップまたはマウスリーブイベントを処理し、パンニングを終了します。
   */
  const handleMouseUpOrLeaveArea = useCallback((): void => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]); // isPanning の状態に依存

  return {
    pageNumber,
    setPageNumber,
    pageScale,
    setPageScale,
    pageRotation,
    setPageRotation,
    handleRotatePdf,
    pdfDisplayContainerRef,
    isPanning,
    handleMouseDownOnPdfArea,
    handleMouseMoveOnPdfArea,
    handleMouseUpOrLeaveArea,
    resetPdfControls,
  };
};
