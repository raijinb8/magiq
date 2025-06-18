// src/pages/admin/WorkOrderTool/components/GeneratedTextPanel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, CopyCheck, List, FileText } from 'lucide-react';
import { updateWorkOrderEditedText } from '@/lib/api';
import type {
  ProcessedCompanyInfo,
  PdfFile,
  CompanyDetectionResult,
  ProcessState,
} from '@/types';
import { ProcessStatusIndicator } from './ProcessStatusIndicator';

interface GeneratedTextPanelProps {
  generatedText: string;
  isLoading: boolean; // AI処理中か
  processingFile: PdfFile | null; // AI処理中のファイル (プレースホルダー用)
  pdfFileToDisplayForPlaceholder: PdfFile | null; // プレビュー中のファイル (プレースホルダー用)
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
  
  // 行別コピー機能の状態管理
  const [viewMode, setViewMode] = useState<'normal' | 'line-copy'>('normal');
  const [copiedLines, setCopiedLines] = useState<Set<number>>(new Set());

  // 表示用テキストの決定（編集テキストがあれば優先、なければ生成テキスト）
  const displayText = editedText || generatedText;
  const currentEditText = isEditMode ? localEditedText : displayText;
  
  // テキストを行に分割（空行も含む）
  const textLines = displayText ? displayText.split('\n') : [];

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

  // コピー機能のヘルパー関数
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // フォールバック: 旧い方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('コピーエラー:', error);
      return false;
    }
  };

  // 単一行のコピー
  const handleCopyLine = async (lineIndex: number, lineText: string) => {
    const success = await copyToClipboard(lineText);
    if (success) {
      setCopiedLines(prev => new Set([...prev, lineIndex]));
      toast.success(`行 ${lineIndex + 1} をコピーしました`);
      // 3秒後にコピー状態をリセット
      setTimeout(() => {
        setCopiedLines(prev => {
          const newSet = new Set(prev);
          newSet.delete(lineIndex);
          return newSet;
        });
      }, 3000);
    } else {
      toast.error('コピーに失敗しました');
    }
  };

  // 全行一括コピー
  const handleCopyAllLines = async () => {
    const success = await copyToClipboard(displayText);
    if (success) {
      toast.success('全テキストをコピーしました');
    } else {
      toast.error('コピーに失敗しました');
    }
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
      return `「${pdfFileToDisplayForPlaceholder.name}」をプレビュー中です。\n\n処理結果を表示するには、AI実行ボタンを押して処理を開始してください。`;
    }
    return '処理するPDFを左の一覧から選択するか、新しいPDFをアップロードしてください。';
  };

  return (
    <div className="w-1/2 p-4 flex flex-col min-h-0">
      <div className="mb-2 flex items-center justify-between flex-shrink-0">
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
          {/* 表示モード切り替えボタン */}
          {displayText && !isLoading && !isEditMode && (
            <>
              <Button
                variant={viewMode === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('normal')}
              >
                <FileText className="w-4 h-4 mr-1" />
                通常表示
              </Button>
              <Button
                variant={viewMode === 'line-copy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('line-copy')}
              >
                <List className="w-4 h-4 mr-1" />
                行別コピー
              </Button>
              {viewMode === 'line-copy' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAllLines}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    全コピー
                  </Button>
                </>
              )}
            </>
          )}
          
          {/* 編集機能ボタン */}
          {displayText && !isLoading && viewMode === 'normal' && (
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
      <div className="flex flex-col flex-1 gap-2 min-h-0">
        {/* プロセス状態表示 */}
        {processState && (
          <ProcessStatusIndicator
            processState={processState}
            onCancel={onCancelProcess}
            className="mb-2 flex-shrink-0"
          />
        )}

        {/* 編集状態の表示 */}
        {isEditMode && (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-4 border-orange-400 flex-shrink-0">
            📝 編集モード - 内容を修正して「保存」ボタンを押してください
          </div>
        )}
        {editedText && !isEditMode && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border-l-4 border-blue-400 flex-shrink-0">
            ✓ 編集済み - この内容は編集されています
          </div>
        )}

        {/* 表示モードによる切り替え */}
        {viewMode === 'normal' ? (
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
        ) : (
          <div className="flex-1 overflow-auto min-h-0 border rounded-md bg-white">
            {textLines.length > 0 ? (
              <>
                {/* 行別コピーモードのヘッダー */}
                <div className="sticky top-0 bg-gray-50 border-b p-2">
                  <div className="text-sm font-medium text-gray-700">
                    全 {textLines.length} 行 - 行をクリックしてコピー
                  </div>
                </div>
                
                {/* 行別表示 */}
                <div className="divide-y">
                  {textLines.map((line, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleCopyLine(index, line)}
                      title={`クリックで行 ${index + 1} をコピー`}
                    >
                      {/* 行番号 */}
                      <div className="w-12 text-xs text-gray-400 text-right mr-3 flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      {/* 行内容 */}
                      <div 
                        className={`flex-1 text-sm font-mono mr-3 px-2 py-1 rounded transition-colors ${
                          line.trim() === '' ? 'text-gray-300 italic' : ''
                        } ${copiedLines.has(index) ? 'bg-green-50 border border-green-200' : 'hover:bg-blue-50'}`}
                      >
                        {line.trim() === '' ? '(空行)' : line}
                      </div>
                      
                      {/* コピー状態表示アイコン */}
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        {copiedLines.has(index) ? (
                          <CopyCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                {getPlaceholderText()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
