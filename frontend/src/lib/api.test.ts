// api.ts のテスト
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSubmittedShiftsForCurrentUser } from './api';
import { supabase } from './supabase';
import * as getTargetShiftWeekModule from '@/utils/getTargetShiftWeek';

// Supabaseクライアントをモック
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// getTargetShiftWeekをモック
vi.mock('@/utils/getTargetShiftWeek');

describe('getSubmittedShiftsForCurrentUser', () => {
  const mockUserId = 'test-user-id';
  const mockDates = ['2024-01-01', '2024-01-02', '2024-01-03'];
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(getTargetShiftWeekModule, 'getTargetShiftWeek').mockReturnValue(mockDates);
    console.error = vi.fn(); // console.errorをモック
  });

  it('シフトデータを正常に取得して重複を排除する', async () => {
    const mockShifts = [
      { date: '2024-01-01', shift_type: 'full', custom_end_time: null, created_at: '2024-01-01T10:00:00Z' },
      { date: '2024-01-01', shift_type: 'pm', custom_end_time: null, created_at: '2024-01-01T09:00:00Z' }, // 重複
      { date: '2024-01-02', shift_type: 'custom', custom_end_time: '17:00', created_at: '2024-01-01T10:00:00Z' },
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    const result = await getSubmittedShiftsForCurrentUser(mockUserId);

    // Supabaseメソッドが正しく呼ばれたか確認
    expect(supabase.from).toHaveBeenCalledWith('shifts');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
    expect(mockQuery.in).toHaveBeenCalledWith('date', mockDates);
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });

    // 結果の確認（重複が排除され、日付順にソートされているか）
    expect(result).toHaveLength(2); // 重複が排除されている
    expect(result[0].date).toBe('2024-01-01');
    expect(result[0].shift_type).toBe('full'); // 最初に見つかったものが保持される
    expect(result[1].date).toBe('2024-01-02');
  });

  it('エラーが発生した場合は空配列を返す', async () => {
    const mockError = { message: 'Database error', code: '500' };
    
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    const result = await getSubmittedShiftsForCurrentUser(mockUserId);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('❌ Supabase取得エラー:', mockError);
  });

  it('データがない場合は空配列を返す', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    const result = await getSubmittedShiftsForCurrentUser(mockUserId);

    expect(result).toEqual([]);
  });

  it('日付でソートされた結果を返す', async () => {
    const mockShifts = [
      { date: '2024-01-03', shift_type: 'off', custom_end_time: null },
      { date: '2024-01-01', shift_type: 'full', custom_end_time: null },
      { date: '2024-01-02', shift_type: 'pm', custom_end_time: null },
    ];

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockShifts, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    const result = await getSubmittedShiftsForCurrentUser(mockUserId);

    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2024-01-01');
    expect(result[1].date).toBe('2024-01-02');
    expect(result[2].date).toBe('2024-01-03');
  });

  it('getTargetShiftWeekの結果を使用する', async () => {
    const customDates = ['2024-02-01', '2024-02-02'];
    vi.mocked(getTargetShiftWeekModule.getTargetShiftWeek).mockReturnValue(customDates);

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as ReturnType<typeof supabase.from>);

    await getSubmittedShiftsForCurrentUser(mockUserId);

    expect(getTargetShiftWeekModule.getTargetShiftWeek).toHaveBeenCalled();
    expect(mockQuery.in).toHaveBeenCalledWith('date', customDates);
  });
});