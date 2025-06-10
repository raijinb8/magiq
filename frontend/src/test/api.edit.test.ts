// src/test/api.edit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateWorkOrderEditedText } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Supabaseクライアントをモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('updateWorkOrderEditedText', () => {
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Supabaseクエリビルダーのモック設定
    mockSingle.mockResolvedValue({
      data: {
        id: 'test-work-order-id',
        edited_text: 'Updated text content',
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    mockSelect.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
    });
  });

  it('正常に編集テキストを更新できる', async () => {
    const workOrderId = 'test-work-order-id';
    const editedText = 'Updated text content';

    const result = await updateWorkOrderEditedText(workOrderId, editedText);

    expect(supabase.from).toHaveBeenCalledWith('work_orders');
    expect(mockUpdate).toHaveBeenCalledWith({
      edited_text: editedText,
      updated_at: expect.any(String),
    });
    expect(mockEq).toHaveBeenCalledWith('id', workOrderId);
    expect(mockSelect).toHaveBeenCalledWith('id, edited_text, updated_at');

    expect(result).toEqual({
      id: 'test-work-order-id',
      edited_text: 'Updated text content',
      updated_at: expect.any(String),
    });
  });

  it('空文字の編集テキストでも正常に更新できる', async () => {
    const workOrderId = 'test-work-order-id';
    const editedText = '';

    await updateWorkOrderEditedText(workOrderId, editedText);

    expect(mockUpdate).toHaveBeenCalledWith({
      edited_text: '',
      updated_at: expect.any(String),
    });
  });

  it('データベースエラー時に適切にエラーを投げる', async () => {
    const errorMessage = 'Database connection failed';
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    });

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(
      updateWorkOrderEditedText('test-id', 'test-content')
    ).rejects.toEqual({ message: errorMessage });

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ 編集テキスト保存エラー:', {
      message: errorMessage,
    });

    consoleErrorSpy.mockRestore();
  });

  it('長いテキストでも正常に処理できる', async () => {
    const longText = 'A'.repeat(10000); // 10,000文字のテキスト
    const workOrderId = 'test-work-order-id';

    await updateWorkOrderEditedText(workOrderId, longText);

    expect(mockUpdate).toHaveBeenCalledWith({
      edited_text: longText,
      updated_at: expect.any(String),
    });
  });

  it('特殊文字を含むテキストでも正常に処理できる', async () => {
    const specialCharText =
      '🚀 テスト\n改行\t\tタブ"引用符\'シングル\\バックスラッシュ';
    const workOrderId = 'test-work-order-id';

    await updateWorkOrderEditedText(workOrderId, specialCharText);

    expect(mockUpdate).toHaveBeenCalledWith({
      edited_text: specialCharText,
      updated_at: expect.any(String),
    });
  });
});
