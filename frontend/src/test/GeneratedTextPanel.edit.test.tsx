// src/test/GeneratedTextPanel.edit.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { GeneratedTextPanel } from '@/components/workOrderTool/GeneratedTextPanel';
import { updateWorkOrderEditedText } from '@/lib/api';

// 依存関係をモック
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  updateWorkOrderEditedText: vi.fn(),
}));

describe('GeneratedTextPanel - 編集機能', () => {
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

  it('生成テキストが表示される', () => {
    render(<GeneratedTextPanel {...defaultProps} />);
    
    expect(screen.getByDisplayValue('AI生成されたテキスト')).toBeInTheDocument();
  });

  it('work_order IDがない場合、編集ボタンが無効化される', () => {
    render(<GeneratedTextPanel {...defaultProps} workOrderId={undefined} />);
    
    const editButton = screen.getByRole('button', { name: '編集' });
    expect(editButton).toBeDisabled();
  });

  it('編集ボタンをクリックすると編集モードに入る', async () => {
    const user = userEvent.setup();
    render(<GeneratedTextPanel {...defaultProps} />);
    
    const editButton = screen.getByRole('button', { name: '編集' });
    await user.click(editButton);
    
    // 編集モード表示の確認
    expect(screen.getByText('📝 編集モード - 内容を修正して「保存」ボタンを押してください')).toBeInTheDocument();
    
    // ボタンの状態変化確認
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
    
    // テキストエリアが編集可能になることを確認
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toHaveAttribute('readonly');
  });

  it('編集モードでテキストを変更できる', async () => {
    const user = userEvent.setup();
    render(<GeneratedTextPanel {...defaultProps} />);
    
    // 編集モードに入る
    const editButton = screen.getByRole('button', { name: '編集' });
    await user.click(editButton);
    
    // テキストを変更
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, '編集されたテキスト');
    
    expect(screen.getByDisplayValue('編集されたテキスト')).toBeInTheDocument();
  });

  it('保存ボタンで編集内容を保存できる', async () => {
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
    
    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);
    
    // API呼び出しの確認
    await waitFor(() => {
      expect(updateWorkOrderEditedText).toHaveBeenCalledWith(
        'test-work-order-id',
        '編集されたテキスト'
      );
    });
    
    // 成功トーストの確認
    expect(toast.success).toHaveBeenCalledWith('編集内容を保存しました');
    
    // 親コンポーネントへの通知確認
    expect(onEditedTextChange).toHaveBeenCalledWith('編集されたテキスト');
    
    // 編集モード終了の確認
    await waitFor(() => {
      expect(screen.queryByText('📝 編集モード')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
    });
  });

  it('キャンセルボタンで編集をキャンセルできる', async () => {
    const user = userEvent.setup();
    render(<GeneratedTextPanel {...defaultProps} />);
    
    // 編集モードに入る
    const editButton = screen.getByRole('button', { name: '編集' });
    await user.click(editButton);
    
    // テキストを変更
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, '編集されたテキスト');
    
    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await user.click(cancelButton);
    
    // 元のテキストに戻ることを確認
    expect(screen.getByDisplayValue('AI生成されたテキスト')).toBeInTheDocument();
    
    // API呼び出しがされないことを確認
    expect(updateWorkOrderEditedText).not.toHaveBeenCalled();
    
    // 編集モード終了の確認
    expect(screen.queryByText('📝 編集モード')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
  });

  it('空のテキストで保存ボタンが無効化される', async () => {
    const user = userEvent.setup();
    render(<GeneratedTextPanel {...defaultProps} />);
    
    // 編集モードに入る
    const editButton = screen.getByRole('button', { name: '編集' });
    await user.click(editButton);
    
    // テキストを空にする
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    
    // 保存ボタンが無効化されることを確認
    const saveButton = screen.getByRole('button', { name: '保存' });
    expect(saveButton).toBeDisabled();
  });

  it('保存エラー時にエラートーストが表示される', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error';
    (updateWorkOrderEditedText as any).mockRejectedValue(new Error(errorMessage));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<GeneratedTextPanel {...defaultProps} />);
    
    // 編集モードに入る
    const editButton = screen.getByRole('button', { name: '編集' });
    await user.click(editButton);
    
    // テキストを変更
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, '編集されたテキスト');
    
    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);
    
    // エラートーストの確認
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('保存に失敗しました');
    });
    
    // コンソールエラーログの確認
    expect(consoleErrorSpy).toHaveBeenCalledWith('保存エラー:', expect.any(Error));
    
    // 編集モードが継続されることを確認（部分マッチで検索）
    await waitFor(() => {
      expect(screen.getByText(/編集モード/)).toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('編集済みテキストがある場合、編集済み表示が出る', () => {
    render(
      <GeneratedTextPanel 
        {...defaultProps} 
        editedText="編集済みテキスト"
      />
    );
    
    // 編集済み表示の確認
    expect(screen.getByText('✓ 編集済み - この内容は編集されています')).toBeInTheDocument();
    
    // 編集済みテキストが表示されることを確認
    expect(screen.getByDisplayValue('編集済みテキスト')).toBeInTheDocument();
  });

  it('編集済みテキストがある場合、それが生成テキストより優先される', () => {
    render(
      <GeneratedTextPanel 
        {...defaultProps} 
        generatedText="AI生成テキスト"
        editedText="編集済みテキスト"
      />
    );
    
    // 編集済みテキストが表示される
    expect(screen.getByDisplayValue('編集済みテキスト')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('AI生成テキスト')).not.toBeInTheDocument();
  });

  it('ローディング中は編集ボタンが表示されない', () => {
    render(<GeneratedTextPanel {...defaultProps} isLoading={true} />);
    
    expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
  });
});