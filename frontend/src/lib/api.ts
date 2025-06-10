// lib/api.ts
import { supabase } from './supabase';
import { getTargetShiftWeek } from '@/utils/getTargetShiftWeek';
import type { 
  ProcessStatusResponse, 
  WorkOrderRecord, 
  ProcessStatus 
} from '@/types';

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

// ===== Process Status API Functions =====

/**
 * work_orderレコードのステータスを取得（ポーリング用）
 */
export async function getWorkOrderStatus(
  recordId: string
): Promise<ProcessStatusResponse> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('id, status, error_message, updated_at')
    .eq('id', recordId)
    .single();

  if (error) {
    console.error('❌ ステータス取得エラー:', error);
    throw new Error(`ステータス取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    throw new Error('レコードが見つかりません');
  }

  return {
    id: data.id,
    status: data.status as ProcessStatus,
    error_message: data.error_message,
    updated_at: data.updated_at,
  };
}

/**
 * work_orderレコードの完全な情報を取得
 */
export async function getWorkOrderRecord(
  recordId: string
): Promise<WorkOrderRecord> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', recordId)
    .single();

  if (error) {
    console.error('❌ work_orderレコード取得エラー:', error);
    throw new Error(`レコード取得に失敗しました: ${error.message}`);
  }

  if (!data) {
    throw new Error('レコードが見つかりません');
  }

  return data as WorkOrderRecord;
}

/**
 * 処理中のwork_orderをキャンセル状態に更新
 */
export async function cancelWorkOrderProcessing(
  recordId: string,
  reason: string = 'ユーザーによるキャンセル'
): Promise<void> {
  const { error } = await supabase
    .from('work_orders')
    .update({
      status: 'error',
      error_message: `処理がキャンセルされました: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId);

  if (error) {
    console.error('❌ 処理キャンセルエラー:', error);
    throw new Error(`処理キャンセルに失敗しました: ${error.message}`);
  }
}

/**
 * 複数のwork_orderレコードのステータスを一括取得
 */
export async function getMultipleWorkOrderStatuses(
  recordIds: string[]
): Promise<ProcessStatusResponse[]> {
  if (recordIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('work_orders')
    .select('id, status, error_message, updated_at')
    .in('id', recordIds);

  if (error) {
    console.error('❌ 複数ステータス取得エラー:', error);
    throw new Error(`ステータス取得に失敗しました: ${error.message}`);
  }

  return (data || []).map(record => ({
    id: record.id,
    status: record.status as ProcessStatus,
    error_message: record.error_message,
    updated_at: record.updated_at,
  }));
}

/**
 * 特定のファイル名の最新work_orderレコードを取得
 */
export async function getLatestWorkOrderByFileName(
  fileName: string
): Promise<WorkOrderRecord | null> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('file_name', fileName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ ファイル名でのwork_order取得エラー:', error);
    throw new Error(`レコード取得に失敗しました: ${error.message}`);
  }

  return data as WorkOrderRecord | null;
}
