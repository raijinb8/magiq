// src/pages/admin/WorkOrderTool/components/FileManagementPanel.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { COMPANY_OPTIONS } from '@/constants/company';
import type {
  CompanyOptionValue,
  PdfFile,
  ProcessedCompanyInfo,
} from '@/types';

interface FileManagementPanelProps {
  uploadedFiles: PdfFile[];
  processingFile: PdfFile | null;
  pdfFileToDisplay: PdfFile | null; // リストアイテムのスタイル（プレビュー中など）のため
  generatedText: string; // リストアイテムのスタイル（エラー、完了）のため
  isLoading: boolean;
  selectedCompanyId: CompanyOptionValue;
  onCompanyChange: (value: CompanyOptionValue) => void;
  onFileUploadClick: () => void; // 「PDFを選択してアップロード」ボタンのクリックハンドラ
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void; // input[type=file] の onChange ハンドラ
  onFilePreviewRequest: (file: PdfFile) => void; // リスト内のファイルクリック時のプレビュー要求
  processedCompanyInfo: ProcessedCompanyInfo; // リストアイテムのスタイル用
}

export const FileManagementPanel: React.FC<FileManagementPanelProps> = ({
  uploadedFiles,
  processingFile,
  pdfFileToDisplay,
  generatedText,
  isLoading,
  selectedCompanyId,
  onCompanyChange,
  onFileUploadClick,
  fileInputRef,
  onFileSelect,
  onFilePreviewRequest,
  processedCompanyInfo,
}) => {
  // リストアイテムのスタイルを決定するヘルパー関数 (元のclassNameロジックを参考に)
  const getListItemClasses = (file: PdfFile): string => {
    const baseClasses =
      'mb-2 cursor-pointer rounded-md p-2 text-sm transition-colors duration-150 ease-in-out';
    if (processingFile?.name === file.name && isLoading) {
      return `${baseClasses} bg-blue-100 dark:bg-blue-800/30 ring-2 ring-blue-500 animate-pulse`;
    }
    if (
      processedCompanyInfo.file?.name === file.name &&
      !isLoading &&
      generatedText &&
      !generatedText.startsWith('エラー')
    ) {
      return `${baseClasses} bg-green-100 dark:bg-green-800/30 ring-1 ring-green-500`;
    }
    if (
      processedCompanyInfo.file?.name === file.name &&
      !isLoading &&
      generatedText &&
      generatedText.startsWith('エラー')
    ) {
      return `${baseClasses} bg-red-100 dark:bg-red-800/30 ring-1 ring-red-500`;
    }
    // プレビュー中 (まだ処理結果がない or エラーだった場合)
    if (
      pdfFileToDisplay?.name === file.name &&
      !isLoading &&
      (!processedCompanyInfo.file ||
        processedCompanyInfo.file.name !== file.name ||
        generatedText.startsWith('エラー'))
    ) {
      // 処理中でない && (まだ処理結果がない || 表示中ファイルと処理結果ファイルが違う || エラーだった)
      return `${baseClasses} bg-yellow-100 dark:bg-yellow-800/30 ring-1 ring-yellow-500`;
    }

    return `${baseClasses} hover:bg-muted dark:hover:bg-slate-700`;
  };

  return (
    <aside className="w-1/4 border-r bg-background p-4 flex flex-col overflow-hidden">
      <h2 className="mb-4 text-lg font-semibold">アップロード済みPDF一覧</h2>
      {/* 会社選択ドロップダウン */}
      <div className="mb-4">
        <label
          htmlFor="company-select"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          処理対象の会社:
        </label>
        <Select value={selectedCompanyId} onValueChange={onCompanyChange}>
          <SelectTrigger id="company-select" className="w-full">
            <SelectValue placeholder="会社を選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>会社一覧</SelectLabel>
              {COMPANY_OPTIONS.map(
                (
                  company // UNKNOWN_OR_NOT_SET は表示しない想定
                ) =>
                  company.value !== 'UNKNOWN_OR_NOT_SET' && (
                    <SelectItem
                      key={company.value}
                      value={company.value}
                      disabled={company.label.includes('準備中')}
                    >
                      {company.label}
                    </SelectItem>
                  )
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full mb-4"
        variant="outline"
        onClick={onFileUploadClick}
      >
        PDFを選択してアップロード
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="application/pdf"
        onChange={onFileSelect}
        className="hidden"
      />
      <ScrollArea className="flex-1 rounded-md border">
        <div className="p-4">
          {uploadedFiles.length > 0 ? (
            <ul>
              {uploadedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.lastModified}-${index}`} // lastModified をキーに含めることで同名別ファイルに対応
                  className={getListItemClasses(file)}
                  onClick={() => onFilePreviewRequest(file)}
                >
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  {/* ステータス表示 (元のロジックを参考に) */}
                  {processingFile?.name === file.name && isLoading && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      (処理中...)
                    </span>
                  )}
                  {processedCompanyInfo.file?.name === file.name &&
                    !isLoading &&
                    generatedText &&
                    !generatedText.startsWith('エラー') && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        (処理完了)
                      </span>
                    )}
                  {processedCompanyInfo.file?.name === file.name &&
                    !isLoading &&
                    generatedText &&
                    generatedText.startsWith('エラー') && (
                      <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                        (エラー)
                      </span>
                    )}
                  {/* プレビュー中だがまだ処理結果がない場合の表示 */}
                  {pdfFileToDisplay?.name === file.name &&
                    !isLoading &&
                    (!processedCompanyInfo.file ||
                      processedCompanyInfo.file.name !== file.name) &&
                    (!generatedText ||
                      generatedText.startsWith(
                        'エラー'
                      )) /* エラーでない場合のみ */ &&
                    !(
                      processingFile?.name === file.name && isLoading
                    ) /* 処理中でない */ && (
                      <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                        (プレビュー中)
                      </span>
                    )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              ここにPDFファイルをドラッグ＆ドロップするか、
              <br />
              上のボタンからファイルを選択してください。
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
