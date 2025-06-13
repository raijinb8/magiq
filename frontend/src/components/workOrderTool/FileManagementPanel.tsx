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
import { CompanyAutoDetectToggle } from './CompanyAutoDetectToggle';
import type {
  CompanyOptionValue,
  PdfFile,
  ProcessedCompanyInfo,
  FileSelectionState,
  CompanyDetectionResult,
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
  // バッチ処理用の新しいプロパティ
  batchMode?: boolean; // バッチモードの有効/無効
  selectedFiles?: FileSelectionState; // 選択されたファイルの状態
  onFileSelectionChange?: (fileName: string, selected: boolean) => void; // ファイル選択の変更
  onSelectAll?: () => void; // 全選択
  onDeselectAll?: () => void; // 全解除
  onBatchProcess?: () => void; // バッチ処理実行
  batchProcessing?: boolean; // バッチ処理中フラグ
  onBatchModeToggle?: () => void; // バッチモード切り替え
  // 自動判定用の新しいプロパティ
  autoDetectEnabled?: boolean;
  onAutoDetectToggle?: () => void;
  lastDetectionResult?: CompanyDetectionResult | null;
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
  // バッチ処理用の新しいプロパティ
  batchMode = false,
  selectedFiles = {},
  onFileSelectionChange,
  onSelectAll,
  onDeselectAll,
  onBatchProcess,
  batchProcessing = false,
  onBatchModeToggle,
  // 自動判定用
  autoDetectEnabled = false,
  onAutoDetectToggle,
  lastDetectionResult,
}) => {
  const selectedCount = Object.values(selectedFiles).filter((v) => v).length;
  // リストアイテムのスタイルを決定するヘルパー関数 (元のclassNameロジックを参考に)
  const getListItemClasses = (file: PdfFile): string => {
    const baseClasses =
      'mb-2 cursor-pointer rounded-md p-2 text-sm transition-colors duration-150 ease-in-out relative';
    
    // 処理中（アニメーション付き）
    if (processingFile?.name === file.name && isLoading) {
      return `${baseClasses} bg-blue-100 dark:bg-blue-800/30 ring-2 ring-blue-500 animate-pulse`;
    }
    
    // 処理成功
    if (
      processedCompanyInfo.file?.name === file.name &&
      !isLoading &&
      generatedText &&
      !generatedText.startsWith('エラー')
    ) {
      return `${baseClasses} bg-green-100 dark:bg-green-800/30 ring-1 ring-green-500`;
    }
    
    // 処理エラー
    if (
      processedCompanyInfo.file?.name === file.name &&
      !isLoading &&
      generatedText &&
      generatedText.startsWith('エラー')
    ) {
      return `${baseClasses} bg-red-100 dark:bg-red-800/30 ring-1 ring-red-500`;
    }
    
    // 現在プレビュー中（データ有り）
    if (
      pdfFileToDisplay?.name === file.name &&
      !isLoading &&
      generatedText
    ) {
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400`;
    }
    
    // 現在プレビュー中（データなし）
    if (
      pdfFileToDisplay?.name === file.name &&
      !isLoading &&
      !generatedText
    ) {
      return `${baseClasses} bg-yellow-100 dark:bg-yellow-800/30 ring-1 ring-yellow-500`;
    }

    return `${baseClasses} hover:bg-muted dark:hover:bg-slate-700`;
  };

  return (
    <aside className="w-1/4 border-r bg-background p-4 flex flex-col overflow-hidden">
      {/* ヘッダー部分 - 見出しとバッチモードボタン */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">PDF一覧</h2>
        <Button
          variant={batchMode ? 'default' : 'outline'}
          size="sm"
          onClick={onBatchModeToggle}
          disabled={batchProcessing}
          className="text-xs px-2 py-1 h-7"
        >
          {batchMode ? 'バッチ' : '単体'}
        </Button>
      </div>
      {/* 会社選択ドロップダウン */}
      <div className="mb-4">
        <label
          htmlFor="company-select"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          処理対象の会社:
        </label>
        <Select
          value={selectedCompanyId}
          onValueChange={onCompanyChange}
          disabled={autoDetectEnabled && !batchMode}
        >
          <SelectTrigger id="company-select" className="w-full">
            <SelectValue
              placeholder={
                autoDetectEnabled ? '自動判定中...' : '会社を選択してください'
              }
            />
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

      {/* 自動判定トグル */}
      {!batchMode && (
        <div className="mb-4">
          <CompanyAutoDetectToggle
            autoDetectEnabled={autoDetectEnabled}
            onToggle={onAutoDetectToggle || (() => {})}
            detectionResult={lastDetectionResult}
            isLoading={isLoading}
          />
        </div>
      )}

      <Button
        className="w-full mb-4"
        variant="outline"
        onClick={onFileUploadClick}
      >
        PDFを選択してアップロード
      </Button>

      {/* バッチ処理モードの場合のコントロール */}
      {batchMode && uploadedFiles.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onSelectAll}
              disabled={
                selectedCount === uploadedFiles.length || batchProcessing
              }
              className="flex-1"
            >
              全選択
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDeselectAll}
              disabled={selectedCount === 0 || batchProcessing}
              className="flex-1"
            >
              全解除
            </Button>
          </div>
          <Button
            className="w-full"
            onClick={onBatchProcess}
            disabled={
              selectedCount === 0 || 
              (!selectedCompanyId && !autoDetectEnabled) || 
              batchProcessing
            }
          >
            {batchProcessing
              ? `処理中... (${selectedCount}個のファイル)`
              : `選択したファイルを一括処理 (${selectedCount}個)`}
          </Button>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="application/pdf"
        onChange={onFileSelect}
        className="hidden"
      />
      <ScrollArea className="flex-1 rounded-md border h-0">
        <div className="p-4">
          {uploadedFiles.length > 0 ? (
            <ul>
              {uploadedFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.lastModified}-${index}`} // lastModified をキーに含めることで同名別ファイルに対応
                  className={`${getListItemClasses(file)} ${batchMode ? 'flex items-center gap-2' : ''}`}
                  onClick={(e) => {
                    // バッチモードの場合、チェックボックス領域のクリックは無視
                    if (
                      batchMode &&
                      (e.target as HTMLInputElement).type === 'checkbox'
                    ) {
                      return;
                    }
                    // バッチモードでも、チェックボックス以外の領域をクリックしたらプレビュー
                    if (!batchProcessing) {
                      onFilePreviewRequest(file);
                    }
                  }}
                >
                  {/* バッチモードの場合はチェックボックスを表示 */}
                  {batchMode && (
                    <input
                      type="checkbox"
                      checked={selectedFiles[file.name] || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        onFileSelectionChange?.(file.name, e.target.checked);
                      }}
                      disabled={batchProcessing}
                      className="cursor-pointer"
                    />
                  )}
                  <span className="flex-1">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
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
