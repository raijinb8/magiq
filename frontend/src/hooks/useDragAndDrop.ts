// src/pages/admin/WorkOrderTool/hooks/useDragAndDrop.ts
import { useState, useCallback } from 'react';

export interface DragEventHandlers {
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
}

export interface UseDragAndDropReturn {
  isDragging: boolean;
  dragEventHandlers: DragEventHandlers;
}

/**
 * ドラッグアンドドロップのUI状態とイベントハンドラを提供するフック。
 * @param onFilesDropped ファイルがドロップされたときに呼び出されるコールバック関数。ドロップされた File オブジェクトの配列を引数に取る。
 */
export const useDragAndDrop = (
  onFilesDropped: (files: File[]) => void
): UseDragAndDropReturn => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        onFilesDropped(Array.from(files));
      }
    },
    [onFilesDropped]
  ); // onFilesDropped を依存配列に追加

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      // ドラッグされているアイテムがファイルの場合のみ isDragging を true にする (より高度な制御)
      if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
        // 必要であれば、ここで event.dataTransfer.types をチェックしてファイルであることを確認
        setIsDragging(true);
      }
    },
    []
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      // currentTarget の子要素への移動では dragleave を発火させないための一般的な対策
      if (event.currentTarget.contains(event.relatedTarget as Node)) {
        return;
      }
      setIsDragging(false);
    },
    []
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault(); // これがないと onDrop が発火しない
      event.stopPropagation();
      if (
        !isDragging &&
        event.dataTransfer.items &&
        event.dataTransfer.items.length > 0
      ) {
        // handleDragEnter が何らかの理由で発火しなかった場合のフォールバック
        setIsDragging(true);
      }
      // 必要に応じて event.dataTransfer.dropEffect = 'copy'; などを設定
    },
    [isDragging]
  ); // isDragging を依存配列に追加

  return {
    isDragging,
    dragEventHandlers: {
      onDrop: handleDrop,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
    },
  };
};
