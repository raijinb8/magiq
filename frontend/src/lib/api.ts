// lib/api.ts
import { supabase } from './supabase';
import { getTargetShiftWeek } from '@/utils/getTargetShiftWeek';

export async function updateWorkOrderEditedText(
  workOrderId: string,
  editedText: string
) {
  const { data, error } = await supabase
    .from('work_orders')
    .update({
      edited_text: editedText,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workOrderId)
    .select('id, edited_text, updated_at')
    .single();

  if (error) {
    console.error('❌ 編集テキスト保存エラー:', error);
    throw error;
  }

  return data;
}

export async function getSubmittedShiftsForCurrentUser(userId: string) {
  const dates = getTargetShiftWeek();

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .in('date', dates)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Supabase取得エラー:', error);
    return [];
  }

  // 重複を排除
  interface ShiftData {
    date: string;
    shift_type: string;
    custom_end_time: string;
  }

  const uniqueByDate: ShiftData[] = Object.values(
    (data || []).reduce(
      (acc, curr) => {
        acc[curr.date] = acc[curr.date] || curr;
        return acc;
      },
      {} as Record<string, ShiftData>
    )
  );

  // date 昇順にソート
  uniqueByDate.sort((a, b) => a.date.localeCompare(b.date));

  return uniqueByDate;
}
