// src/pages/admin/WorkOrderTool/components/GeneratedTextPanel.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  ProcessedCompanyInfo,
  PdfFile,
  CompanyOptionValue,
} from '@/types';

interface GeneratedTextPanelProps {
  generatedText: string;
  isLoading: boolean; // AI処理中か
  processingFile: PdfFile | null; // AI処理中のファイル (プレースホルダー用)
  pdfFileToDisplayForPlaceholder: PdfFile | null; // プレビュー中のファイル (プレースホルダー用)
  selectedCompanyIdForPlaceholder: CompanyOptionValue; // 選択中の会社 (プレースホルダー用)
  processedCompanyInfo: ProcessedCompanyInfo; // 表示ヘッダー用 (ファイル名、会社名)
}

export const GeneratedTextPanel: React.FC<GeneratedTextPanelProps> = ({
  generatedText,
  isLoading,
  processingFile,
  pdfFileToDisplayForPlaceholder,
  selectedCompanyIdForPlaceholder,
  processedCompanyInfo,
}) => {
  const getPlaceholderText = (): string => {
    if (isLoading && processingFile) {
      return `「${processingFile.name}」の業務手配書をAIが生成中です...\n\n通常30秒程度かかります。しばらくお待ちください。`;
    }
    if (generatedText) {
      return ''; // 生成テキストがあればプレースホルダーは不要
    }
    if (pdfFileToDisplayForPlaceholder) {
      if (selectedCompanyIdForPlaceholder) {
        return `「${pdfFileToDisplayForPlaceholder.name}」の処理結果がここに表示されます。\nAI処理が完了するまでお待ちください。`;
      }
      return `「${pdfFileToDisplayForPlaceholder.name}」の処理結果がここに表示されます。\n会社を選択し、リストのファイルをクリックして処理を開始してください。`;
    }
    return '処理するPDFを左の一覧から選択するか、新しいPDFをアップロードしてください。';
  };

  return (
    <div className="w-1/2 p-4 flex flex-col overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          業務手配書 文言
          {processedCompanyInfo.file && (
            <>
              <br />
              <span className="block text-sm font-normal text-muted-foreground ml-2">
                ファイル: {processedCompanyInfo.file.name}
              </span>
              <span className="block text-sm font-normal text-muted-foreground ml-2">
                会社: {processedCompanyInfo.companyLabel}
              </span>
            </>
          )}
        </h2>
        <div>
          {/* これらのボタンは現状ダミーなので、機能実装時にprops経由でハンドラを受け取る */}
          <Button variant="outline" size="sm" className="mr-2" disabled>
            戻る (仮)
          </Button>
          <Button variant="outline" size="sm" className="mr-2" disabled>
            次へ (仮)
          </Button>
          <Button size="sm" disabled>
            保存 (仮)
          </Button>
        </div>
      </div>
      <Textarea
        className="flex-1 resize-none rounded-md text-sm font-mono"
        placeholder={getPlaceholderText()}
        value={generatedText}
        readOnly
      />
    </div>
  );
};
