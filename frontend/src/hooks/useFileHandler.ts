// src/pages/admin/WorkOrderTool/hooks/useFileHandler.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { PdfFile } from '@/types'; // File 型を拡張した PdfFile 型を想定

export interface UseFileHandlerReturn {
  uploadedFiles: PdfFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<PdfFile[]>>;
  processingFile: PdfFile | null;
  setProcessingFile: React.Dispatch<React.SetStateAction<PdfFile | null>>;
  pdfFileToDisplay: PdfFile | null; // string (URL) も許容する場合は PdfFile | string | null
  setPdfFileToDisplay: React.Dispatch<React.SetStateAction<PdfFile | null>>; // 同上
  addFilesToList: (newFilesInput: File[]) => File | null; // 処理対象として最初の有効なファイルを返す
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => File | null; // 同上
}

export const useFileHandler = (): UseFileHandlerReturn => {
  const [uploadedFiles, setUploadedFiles] = useState<PdfFile[]>([]);
  const [processingFile, setProcessingFile] = useState<PdfFile | null>(null);
  const [pdfFileToDisplay, setPdfFileToDisplay] = useState<PdfFile | null>(
    null
  );

  /**
   * 新しいファイルの配列を受け取り、PDF形式チェックと重複チェックを行った上でリストに追加します。
   * @param newFilesInput Fileオブジェクトの配列
   * @returns 追加されたファイルのうち、最初に処理対象となりうるファイル (File | null)
   */
  const addFilesToList = useCallback(
    (newFilesInput: File[]): File | null => {
      let firstValidFileForProcessing: File | null = null;
      const filesToAdd: PdfFile[] = [];

      newFilesInput.forEach((newFile) => {
        if (newFile.type !== 'application/pdf') {
          toast.error(`不正なファイル形式: 「${newFile.name}」`, {
            description: 'PDFファイルではありません。スキップしました。',
            duration: 5000,
          });
          return;
        }
        const isDuplicate = uploadedFiles.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.lastModified === newFile.lastModified
        );
        if (isDuplicate) {
          toast.warning(`ファイルが重複しています: 「${newFile.name}」`, {
            description: 'このファイルは既に追加されています。',
            duration: 5000,
          });
        } else {
          filesToAdd.push(newFile as PdfFile);
          if (!firstValidFileForProcessing) {
            firstValidFileForProcessing = newFile;
          }
        }
      });

      if (filesToAdd.length > 0) {
        setUploadedFiles((prevFiles) => [...prevFiles, ...filesToAdd]);
        toast.success(
          `${filesToAdd.length}件のPDFファイルが一覧に追加されました。`
        );
      }
      return firstValidFileForProcessing;
    },
    [uploadedFiles]
  ); // uploadedFiles を依存配列に追加

  /**
   * ファイル選択ダイアログの変更イベントを処理します。
   * @param event HTMLInputElement の ChangeEvent
   * @returns 処理対象として最初の有効なファイルを返す (File | null)
   */
  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ): File | null => {
    const files = event.target.files;
    let firstFile: File | null = null;
    if (files && files.length > 0) {
      firstFile = addFilesToList(Array.from(files));
    }
    if (event.target) {
      event.target.value = ''; // 同じファイルを選択できるように値をリセット
    }
    return firstFile;
  };

  return {
    uploadedFiles,
    setUploadedFiles,
    processingFile,
    setProcessingFile,
    pdfFileToDisplay,
    setPdfFileToDisplay,
    addFilesToList,
    handleFileSelect,
  };
};
