// src/pages/admin/WorkOrderTool/components/GeneratedTextPanel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateWorkOrderEditedText } from '@/lib/api';
import type {
  ProcessedCompanyInfo,
  PdfFile,
  CompanyOptionValue,
  CompanyDetectionResult,
  ProcessState,
} from '@/types';
import { ProcessStatusIndicator } from './ProcessStatusIndicator';

interface GeneratedTextPanelProps {
  generatedText: string;
  isLoading: boolean; // AI処理中か
  processingFile: PdfFile | null; // AI処理中のファイル (プレースホルダー用)
  pdfFileToDisplayForPlaceholder: PdfFile | null; // プレビュー中のファイル (プレースホルダー用)
  selectedCompanyIdForPlaceholder: CompanyOptionValue; // 選択中の会社 (プレースホルダー用)
  processedCompanyInfo: ProcessedCompanyInfo; // 表示ヘッダー用 (ファイル名、会社名)
  lastDetectionResult?: CompanyDetectionResult | null; // 自動判定結果
  onRequestFeedback?: () => void; // フィードバックモーダルを開く
  workOrderId?: string; // 編集対象のwork_order ID
  editedText?: string; // 編集済みテキスト
  onEditedTextChange?: (text: string) => void; // 編集テキスト変更時のコールバック
  // ステータス管理関連
  processState?: ProcessState | null; // プロセス状態
  onCancelProcess?: () => void; // プロセスキャンセル
}

export const GeneratedTextPanel: React.FC<GeneratedTextPanelProps> = ({
  generatedText,
  isLoading,
  processingFile,
  pdfFileToDisplayForPlaceholder,
  selectedCompanyIdForPlaceholder,
  processedCompanyInfo,
  lastDetectionResult,
  onRequestFeedback,
  workOrderId,
  editedText = '',
  onEditedTextChange,
  processState,
  onCancelProcess,
}) => {
  // 編集モード状態管理
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [localEditedText, setLocalEditedText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 表示用テキストの決定（編集テキストがあれば優先、なければ生成テキスト）
  const displayText = editedText || generatedText;
  const currentEditText = isEditMode ? localEditedText : displayText;

  // 編集モードに入る
  const handleEnterEditMode = () => {
    setLocalEditedText(displayText); // 現在のテキストを編集用にコピー
    setIsEditMode(true);
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setLocalEditedText('');
    setIsEditMode(false);
  };

  // 編集内容を保存
  const handleSaveEdit = async () => {
    if (!workOrderId) {
      toast.error('保存先のwork_order IDが見つかりません');
      return;
    }

    if (localEditedText.trim() === '') {
      toast.error('編集内容が空です');
      return;
    }

    setIsSaving(true);
    try {
      await updateWorkOrderEditedText(workOrderId, localEditedText);

      // 親コンポーネントに編集テキストの変更を通知
      onEditedTextChange?.(localEditedText);

      setIsEditMode(false);
      setLocalEditedText('');
      toast.success('編集内容を保存しました');
    } catch (error) {
      console.error('保存エラー:', error);
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
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
    <div className="w-1/2 p-4 flex flex-col min-h-0">
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
        <div className="flex gap-2">
          {/* 編集機能ボタン */}
          {displayText && !isLoading && (
            <>
              {!isEditMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnterEditMode}
                  disabled={!workOrderId}
                >
                  編集
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving || localEditedText.trim() === ''}
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </Button>
                </>
              )}
            </>
          )}

          {/* 自動判定結果がある場合、フィードバックボタンを表示 */}
          {lastDetectionResult &&
            onRequestFeedback &&
            generatedText &&
            !generatedText.startsWith('エラー') && (
              <Button variant="outline" size="sm" onClick={onRequestFeedback}>
                判定を修正
              </Button>
            )}

          {/* これらのボタンは現状ダミーなので、機能実装時にprops経由でハンドラを受け取る */}
          <Button variant="outline" size="sm" disabled>
            戻る (仮)
          </Button>
          <Button variant="outline" size="sm" disabled>
            次へ (仮)
          </Button>
        </div>
      </div>
      <div className="flex flex-col flex-1 gap-2">
        {/* プロセス状態表示 */}
        {processState && (
          <ProcessStatusIndicator
            processState={processState}
            onCancel={onCancelProcess}
            className="mb-2"
          />
        )}

        {/* 編集状態の表示 */}
        {isEditMode && (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-4 border-orange-400">
            📝 編集モード - 内容を修正して「保存」ボタンを押してください
          </div>
        )}
        {editedText && !isEditMode && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border-l-4 border-blue-400">
            ✓ 編集済み - この内容は編集されています
          </div>
        )}

        <Textarea
          className={`flex-1 resize-none rounded-md text-sm font-mono overflow-auto min-h-0 ${
            isEditMode
              ? 'border-orange-300 focus:border-orange-500 bg-orange-50/30'
              : editedText
                ? 'bg-blue-50/30 border-blue-200'
                : ''
          }`}
          placeholder={getPlaceholderText()}
          value={currentEditText}
          readOnly={!isEditMode}
          onChange={(e) => setLocalEditedText(e.target.value)}
          disabled={isSaving}
        />
      </div>
    </div>
  );
};
