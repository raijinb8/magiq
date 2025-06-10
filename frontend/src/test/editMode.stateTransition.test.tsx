// src/test/editMode.stateTransition.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneratedTextPanel } from '@/components/workOrderTool/GeneratedTextPanel';
import { updateWorkOrderEditedText } from '@/lib/api';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  updateWorkOrderEditedText: vi.fn(),
}));

describe('GeneratedTextPanel - 編集モード状態遷移', () => {
  const defaultProps = {
    generatedText: 'AI生成されたテキスト',
    isLoading: false,
    processingFile: null,
    pdfFileToDisplayForPlaceholder: null,
    selectedCompanyIdForPlaceholder: 'NOHARA_G' as const,
    processedCompanyInfo: {
      file: { name: 'test.pdf' } as File,
      companyLabel: '野原G住環境',
    },
    workOrderId: 'test-work-order-id',
    editedText: '',
    onEditedTextChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (updateWorkOrderEditedText as any).mockResolvedValue({
      id: 'test-work-order-id',
      edited_text: 'Updated content',
      updated_at: new Date().toISOString(),
    });
  });

  describe('初期状態', () => {
    it('編集モードでない状態で開始される', () => {
      render(<GeneratedTextPanel {...defaultProps} />);
      
      // 編集ボタンが表示される
      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      
      // 編集モード表示が出ていない
      expect(screen.queryByText('📝 編集モード')).not.toBeInTheDocument();
      
      // テキストエリアが読み取り専用
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('generatedTextが空の場合、編集ボタンが表示されない', () => {
      render(<GeneratedTextPanel {...defaultProps} generatedText="" />);
      
      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
    });

    it('workOrderIdがない場合、編集ボタンが無効化される', () => {
      render(<GeneratedTextPanel {...defaultProps} workOrderId={undefined} />);
      
      const editButton = screen.getByRole('button', { name: '編集' });
      expect(editButton).toBeDisabled();
    });
  });

  describe('編集モード開始', () => {
    it('編集ボタンクリックで編集モードに遷移する', async () => {
      const user = userEvent.setup();
      render(<GeneratedTextPanel {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // 状態変化の確認
      expect(screen.getByText('📝 編集モード - 内容を修正して「保存」ボタンを押してください')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
      
      // テキストエリアが編集可能になる
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toHaveAttribute('readonly');
      expect(textarea).toHaveClass('border-orange-300');
    });

    it('編集済みテキストがある場合、それが編集用テキストの初期値になる', async () => {
      const user = userEvent.setup();
      render(
        <GeneratedTextPanel 
          {...defaultProps} 
          editedText="編集済みテキスト"
        />
      );
      
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // 編集済みテキストが編集用テキストエリアに表示される
      expect(screen.getByDisplayValue('編集済みテキスト')).toBeInTheDocument();
    });
  });

  describe('編集モード中の操作', () => {
    it('テキスト変更で保存ボタンが有効になる', async () => {
      const user = userEvent.setup();
      render(<GeneratedTextPanel {...defaultProps} />);
      
      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // 最初は保存ボタンが有効（既存テキストがあるため）
      const saveButton = screen.getByRole('button', { name: '保存' });
      expect(saveButton).not.toBeDisabled();
      
      // テキストを変更
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '新しいテキスト');
      
      // 保存ボタンが有効のまま
      expect(saveButton).not.toBeDisabled();
    });

    it('テキストを空にすると保存ボタンが無効化される', async () => {
      const user = userEvent.setup();
      render(<GeneratedTextPanel {...defaultProps} />);
      
      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // テキストを空にする
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      
      // 保存ボタンが無効化される
      const saveButton = screen.getByRole('button', { name: '保存' });
      expect(saveButton).toBeDisabled();
    });

    it('保存中はボタンが無効化される', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: any) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });
      (updateWorkOrderEditedText as any).mockReturnValue(updatePromise);
      
      render(<GeneratedTextPanel {...defaultProps} />);
      
      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // テキストを変更
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '新しいテキスト');
      
      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);
      
      // 保存中の状態確認
      expect(screen.getByRole('button', { name: '保存中...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
      expect(textarea).toBeDisabled();
      
      // 保存完了
      resolveUpdate!({
        id: 'test-work-order-id',
        edited_text: '新しいテキスト',
        updated_at: new Date().toISOString(),
      });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      });
    });
  });

  describe('編集モード終了', () => {
    it('保存成功で編集モードが終了する', async () => {
      const user = userEvent.setup();
      const onEditedTextChange = vi.fn();
      
      render(
        <GeneratedTextPanel 
          {...defaultProps} 
          onEditedTextChange={onEditedTextChange}
        />
      );
      
      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // テキストを変更
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '編集されたテキスト');
      
      // 保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);
      
      // 編集モード終了の確認
      await waitFor(() => {
        expect(screen.queryByText('📝 編集モード')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      });
      
      // テキストエリアが読み取り専用に戻る
      const newTextarea = screen.getByRole('textbox');
      expect(newTextarea).toHaveAttribute('readonly');
      
      // 親コンポーネントに通知される
      expect(onEditedTextChange).toHaveBeenCalledWith('編集されたテキスト');
    });

    it('キャンセルで編集モードが終了し元のテキストに戻る', async () => {
      const user = userEvent.setup();
      render(<GeneratedTextPanel {...defaultProps} />);
      
      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // テキストを変更
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '編集されたテキスト');
      
      // キャンセル
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);
      
      // 編集モード終了の確認
      expect(screen.queryByText('📝 編集モード')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      
      // 元のテキストに戻る
      expect(screen.getByDisplayValue('AI生成されたテキスト')).toBeInTheDocument();
      
      // API呼び出しがされない
      expect(updateWorkOrderEditedText).not.toHaveBeenCalled();
    });

    it('保存エラー時は編集モードが継続される', async () => {
      const user = userEvent.setup();
      (updateWorkOrderEditedText as any).mockRejectedValue(new Error('Save failed'));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<GeneratedTextPanel {...defaultProps} />);
      
      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);
      
      // テキストを変更
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '編集されたテキスト');
      
      // 保存
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);
      
      // エラー後も編集モードが継続
      await waitFor(() => {
        expect(screen.getByText(/編集モード/)).toBeInTheDocument();
      });
      
      // 編集したテキストが保持される
      expect(screen.getByDisplayValue('編集されたテキスト')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('外部状態変化への対応', () => {
    it('isLoadingがtrueになると編集ボタンが非表示になる', () => {
      const { rerender } = render(<GeneratedTextPanel {...defaultProps} />);
      
      // 最初は編集ボタンが表示される
      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      
      // isLoadingがtrueになる
      rerender(<GeneratedTextPanel {...defaultProps} isLoading={true} />);
      
      // 編集ボタンが非表示になる
      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
    });

    it('generatedTextが空になると編集ボタンが非表示になる', () => {
      const { rerender } = render(<GeneratedTextPanel {...defaultProps} />);
      
      // 最初は編集ボタンが表示される
      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
      
      // generatedTextが空になる
      rerender(<GeneratedTextPanel {...defaultProps} generatedText="" />);
      
      // 編集ボタンが非表示になる
      expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
    });
  });
});