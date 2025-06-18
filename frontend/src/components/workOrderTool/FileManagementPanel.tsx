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
  // バッチ処理完了ファイル状態
  batchProcessedFiles?: { [fileName: string]: 'success' | 'error' | 'processing' | 'cancelled' | 'pending' };
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
  // バッチ処理完了ファイル状態
  batchProcessedFiles = {},
}) => {
  const selectedCount = Object.values(selectedFiles).filter((v) => v).length;
  // リストアイテムのスタイルを決定するヘルパー関数 (選択状態対応版)
  const getListItemClasses = (file: PdfFile): string => {
    const baseClasses =
      'mb-2 cursor-pointer rounded-md p-2 text-sm transition-colors duration-150 ease-in-out relative';
    
    // 選択状態の判定
    const isSelected = pdfFileToDisplay?.name === file.name;
    const isCurrentlyProcessing = processingFile?.name === file.name && isLoading;
    const batchStatus = batchProcessedFiles[file.name];
    
    // デバッグ情報（詳細版）
    console.log(`[FileManagementPanel] ${file.name} 状態詳細:`, {
      isSelected,
      isCurrentlyProcessing,
      batchStatus,
      pdfFileToDisplayName: pdfFileToDisplay?.name,
      batchProcessingFlag: batchProcessing,
    });
    
    // 現在AI処理中（最優先）
    if (isCurrentlyProcessing) {
      return `${baseClasses} bg-blue-100 dark:bg-blue-800/30 ring-2 ring-blue-500 animate-pulse`;
    }
    
    // バッチ処理の状態を最優先で表示（選択状態に関係なく）
    if (batchStatus === 'error') {
      const selectedStyle = isSelected ? 'ring-4 ring-blue-500 shadow-lg border-2 border-blue-400' : 'ring-2 ring-red-500';
      return `${baseClasses} bg-red-100 dark:bg-red-800/30 ${selectedStyle}`;
    }
    
    if (batchStatus === 'success') {
      const selectedStyle = isSelected ? 'ring-4 ring-blue-500 shadow-lg border-2 border-blue-400' : 'ring-2 ring-green-500';
      return `${baseClasses} bg-green-100 dark:bg-green-800/30 ${selectedStyle}`;
    }
    
    if (batchStatus === 'processing') {
      const selectedStyle = isSelected ? 'ring-4 ring-blue-500 shadow-lg border-2 border-blue-400' : 'ring-2 ring-orange-500';
      return `${baseClasses} bg-orange-100 dark:bg-orange-800/30 ${selectedStyle} animate-pulse`;
    }
    
    if (batchStatus === 'cancelled') {
      const selectedStyle = isSelected ? 'ring-4 ring-blue-500 shadow-lg border-2 border-blue-400' : 'ring-2 ring-gray-500';
      return `${baseClasses} bg-gray-100 dark:bg-gray-800/30 ${selectedStyle}`;
    }
    
    if (batchStatus === 'pending') {
      const selectedStyle = isSelected ? 'ring-4 ring-blue-500 shadow-lg border-2 border-blue-400' : 'ring-2 ring-yellow-300';
      return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 ${selectedStyle}`;
    }
    
    // バッチ処理状態がない場合、選択状態に応じた表示
    if (isSelected) {
      // 単体処理結果がある場合
      const isSingleProcessCompleted = processedCompanyInfo.file?.name === file.name && processedCompanyInfo.status === 'completed' && generatedText;
      
      if (isSingleProcessCompleted) {
        if (generatedText && generatedText.startsWith('エラー')) {
          return `${baseClasses} bg-red-100 dark:bg-red-800/30 ring-4 ring-blue-500 shadow-lg border-2 border-blue-400`;
        }
        return `${baseClasses} bg-green-100 dark:bg-green-800/30 ring-4 ring-blue-500 shadow-lg border-2 border-blue-400`;
      }
      
      // 選択状態だがデータなし
      return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-500 shadow-lg border-2 border-blue-400`;
    }
    
    // 非選択状態で単体処理結果がある場合
    const isSingleProcessCompleted = processedCompanyInfo.file?.name === file.name && processedCompanyInfo.status === 'completed' && generatedText;
    
    if (isSingleProcessCompleted) {
      if (generatedText && generatedText.startsWith('エラー')) {
        return `${baseClasses} bg-red-100 dark:bg-red-800/30 ring-1 ring-red-500`;
      }
      return `${baseClasses} bg-green-100 dark:bg-green-800/30 ring-1 ring-green-500`;
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
          {batchMode ? '一括' : '単体'}
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
                    // ファイルプレビューを常に許可（バッチ処理中の制限はhandleFilePreviewRequestで実装）
                    onFilePreviewRequest(file);
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
                  {/* ステータス表示 (選択状態優先版) */}
                  {/* 現在AI処理中（最優先） */}
                  {processingFile?.name === file.name && isLoading && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      (処理中...)
                    </span>
                  )}
                  
                  {/* 選択中の表示（処理中でない場合） */}
                  {pdfFileToDisplay?.name === file.name && !isLoading && (
                    <>
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        (選択中)
                      </span>
                      {/* 選択中のファイルの処理状態を追加表示（より明確に） */}
                      {batchProcessedFiles[file.name] === 'success' && (
                        <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-bold">
                          ✓完了
                        </span>
                      )}
                      {batchProcessedFiles[file.name] === 'error' && (
                        <span className="ml-1 text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/30 px-1 rounded">
                          ✗エラー
                        </span>
                      )}
                      {batchProcessedFiles[file.name] === 'processing' && (
                        <span className="ml-1 text-xs text-orange-600 dark:text-orange-400 font-bold">
                          ⟳処理中
                        </span>
                      )}
                      {batchProcessedFiles[file.name] === 'cancelled' && (
                        <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                          ⊘キャンセル
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* 非選択時のバッチ処理結果表示（より目立つように） */}
                  {pdfFileToDisplay?.name !== file.name && !isLoading && (
                    <>
                      {batchProcessedFiles[file.name] === 'success' && (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-semibold">
                          (処理完了)
                        </span>
                      )}
                      {batchProcessedFiles[file.name] === 'error' && (
                        <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/30 px-1 rounded">
                          (エラー)
                        </span>
                      )}
                      {batchProcessedFiles[file.name] === 'processing' && (
                        <span className="ml-2 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                          (処理中...)
                        </span>
                      )}
                      {batchProcessedFiles[file.name] === 'cancelled' && (
                        <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                          (キャンセル)
                        </span>
                      )}
                      {batchProcessedFiles[file.name] === 'pending' && (
                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                          (待機中)
                        </span>
                      )}
                    </>
                  )}
                  {/* 単体処理結果の表示（バッチ処理結果がない場合のみ、completedステータスのみ） */}
                  {!batchProcessedFiles[file.name] && 
                    pdfFileToDisplay?.name !== file.name && 
                    processedCompanyInfo.file?.name === file.name &&
                    processedCompanyInfo.status === 'completed' &&
                    !isLoading &&
                    generatedText &&
                    !generatedText.startsWith('エラー') && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        (処理完了)
                      </span>
                    )}
                  {!batchProcessedFiles[file.name] && 
                    pdfFileToDisplay?.name !== file.name && 
                    processedCompanyInfo.file?.name === file.name &&
                    processedCompanyInfo.status === 'completed' &&
                    !isLoading &&
                    generatedText &&
                    generatedText.startsWith('エラー') && (
                      <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                        (エラー)
                      </span>
                    )}
                  
                  {/* 選択中ファイルの単体処理結果アイコン表示（completedステータスのみ） */}
                  {!batchProcessedFiles[file.name] && 
                    pdfFileToDisplay?.name === file.name &&
                    !isLoading &&
                    processedCompanyInfo.file?.name === file.name &&
                    processedCompanyInfo.status === 'completed' &&
                    generatedText && (
                      <>
                        {generatedText.startsWith('エラー') ? (
                          <span className="ml-1 text-xs text-red-600 dark:text-red-400">
                            ✗
                          </span>
                        ) : (
                          <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                            ✓
                          </span>
                        )}
                      </>
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
