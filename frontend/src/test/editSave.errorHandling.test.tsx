// src/test/editSave.errorHandling.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
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

describe('GeneratedTextPanel - 編集保存エラーハンドリング', () => {
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
  });

  describe('保存前バリデーション', () => {
    it('workOrderIdがない場合のエラーハンドリング', async () => {
      const user = userEvent.setup();
      render(<GeneratedTextPanel {...defaultProps} workOrderId={undefined} />);

      // 編集ボタンが無効化されている
      const editButton = screen.getByRole('button', { name: '編集' });
      expect(editButton).toBeDisabled();

      // 手動でクリックを試みる（実際にはクリックできないはず）
      await user.click(editButton);

      // 編集モードに入らない
      expect(screen.queryByText('📝 編集モード')).not.toBeInTheDocument();
    });

    it('編集テキストが空の場合のエラー表示', async () => {
      const user = userEvent.setup();
      (updateWorkOrderEditedText as any).mockResolvedValue({});

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

      // 保存は実行されない
      expect(updateWorkOrderEditedText).not.toHaveBeenCalled();
    });

    it('スペースのみのテキストで保存ボタンが無効化される', async () => {
      const user = userEvent.setup();
      render(<GeneratedTextPanel {...defaultProps} />);

      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);

      // スペースのみ入力
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '   ');

      // 保存ボタンが無効化される
      const saveButton = screen.getByRole('button', { name: '保存' });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('API エラーパターン', () => {
    it('ネットワークエラーのハンドリング', async () => {
      const user = userEvent.setup();
      const networkError = new Error('Network Error');
      (updateWorkOrderEditedText as any).mockRejectedValue(networkError);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

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

      // エラーハンドリングの確認
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('保存に失敗しました');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('保存エラー:', networkError);

      // 編集モードが継続される
      expect(screen.getByText(/編集モード/)).toBeInTheDocument();

      // 編集内容が保持される
      expect(
        screen.getByDisplayValue('編集されたテキスト')
      ).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('データベースエラーのハンドリング', async () => {
      const user = userEvent.setup();
      const dbError = new Error('Database connection failed');
      (updateWorkOrderEditedText as any).mockRejectedValue(dbError);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

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

      // エラーハンドリングの確認
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('保存に失敗しました');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('保存エラー:', dbError);

      consoleErrorSpy.mockRestore();
    });

    it('権限不足エラーのハンドリング', async () => {
      const user = userEvent.setup();
      const authError = new Error('Permission denied');
      (updateWorkOrderEditedText as any).mockRejectedValue(authError);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

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

      // エラーハンドリングの確認
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('保存に失敗しました');
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('保存中の状態制御', () => {
    it('保存中にキャンセルボタンが無効化される', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (
        value: Awaited<ReturnType<typeof updateWorkOrderEditedText>>
      ) => void;
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
      await user.type(textarea, '編集されたテキスト');

      // 保存開始
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      // 保存中の状態確認
      expect(
        screen.getByRole('button', { name: '保存中...' })
      ).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).toBeDisabled();

      expect(textarea).toBeDisabled();

      // 保存完了
      resolveUpdate!({
        id: 'test-work-order-id',
        edited_text: '編集されたテキスト',
        updated_at: new Date().toISOString(),
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '編集' })
        ).toBeInTheDocument();
      });
    });

    it('保存中にエラーが発生しても状態が適切にリセットされる', async () => {
      const user = userEvent.setup();
      const error = new Error('Save failed');
      (updateWorkOrderEditedText as any).mockRejectedValue(error);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<GeneratedTextPanel {...defaultProps} />);

      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);

      // テキストを変更
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, '編集されたテキスト');

      // 保存（エラーが発生）
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      // エラー後の状態確認
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '保存' })
        ).toBeInTheDocument();
      });

      // ボタンが再度有効になる
      const newSaveButton = screen.getByRole('button', { name: '保存' });
      expect(newSaveButton).not.toBeDisabled();

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      expect(cancelButton).not.toBeDisabled();

      // テキストエリアが再度有効になる
      const newTextarea = screen.getByRole('textbox');
      expect(newTextarea).not.toBeDisabled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('特殊ケース', () => {
    it('長いテキストの保存エラーハンドリング', async () => {
      const user = userEvent.setup();
      const error = new Error('Text too long');
      (updateWorkOrderEditedText as any).mockRejectedValue(error);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<GeneratedTextPanel {...defaultProps} />);

      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);

      // 長いテキストを入力（paste使用でタイムアウト回避）
      const longText = 'A'.repeat(1000); // サイズを縮小
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.click(textarea);
      await user.paste(longText);

      // 保存（エラーが発生）
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      // エラーハンドリングの確認
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('保存に失敗しました');
      });

      consoleErrorSpy.mockRestore();
    });

    it('特殊文字を含むテキストのエラーハンドリング', async () => {
      const user = userEvent.setup();
      const error = new Error('Invalid characters');
      (updateWorkOrderEditedText as any).mockRejectedValue(error);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<GeneratedTextPanel {...defaultProps} />);

      // 編集モードに入る
      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);

      // 特殊文字を含むテキストを入力
      const specialText = '🚀\n\t"\'\\特殊文字テスト';
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, specialText);

      // 保存（エラーが発生）
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      // エラーハンドリングの確認
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('保存に失敗しました');
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
