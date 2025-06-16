// lib/api.ts
import { supabase } from './supabase';
import { getTargetShiftWeek } from '@/utils/getTargetShiftWeek';
import type { BatchProcessOptions, BatchProcessResult } from '@/types';

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

/**
 * ファイル名でwork_orderを取得
 */
export async function getWorkOrderByFileName(fileName: string) {
  const { data, error } = await supabase
    .from('work_orders')
    .select('id, file_name, generated_text, edited_text, status, company_name, prompt_identifier')
    .eq('file_name', fileName)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ work_order取得エラー:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

// バッチ処理関連のAPI

/**
 * バッチ処理ジョブを作成
 */
export async function createBatchProcess(
  totalFiles: number,
  options: BatchProcessOptions
) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('ユーザーが認証されていません');
  }

  const { data, error } = await supabase
    .from('batch_processes')
    .insert({
      user_id: userId,
      total_files: totalFiles,
      company_id: options.companyId,
      auto_detect_enabled: options.autoDetectEnabled,
      options: {
        concurrentLimit: options.concurrentLimit,
        retryFailedFiles: options.retryFailedFiles,
        pauseOnError: options.pauseOnError,
      },
      status: 'processing',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ バッチ処理作成エラー:', error);
    throw error;
  }

  return data;
}

/**
 * バッチ処理ファイルを記録
 */
export async function recordBatchProcessFile(
  batchProcessId: string,
  fileName: string,
  fileSize?: number
) {
  const { data, error } = await supabase
    .from('batch_process_files')
    .insert({
      batch_process_id: batchProcessId,
      file_name: fileName,
      file_size: fileSize,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ バッチファイル記録エラー:', error);
    throw error;
  }

  return data;
}

/**
 * バッチ処理ファイルのステータスを更新
 */
export async function updateBatchProcessFile(
  batchProcessId: string,
  fileName: string,
  result: BatchProcessResult
) {
  interface UpdateData {
    status: string;
    error_message?: string;
    processing_time_ms?: number;
    started_at?: string;
    completed_at?: string;
    work_order_id?: string;
    detection_result?: unknown;
    company_id?: string;
  }

  const updateData: UpdateData = {
    status: result.status,
    error_message: result.errorMessage,
    processing_time_ms: result.processingTime,
    started_at: result.startedAt?.toISOString(),
    completed_at: result.completedAt?.toISOString(),
  };

  if (result.workOrderId) {
    updateData.work_order_id = result.workOrderId;
  }

  if (result.detectionResult) {
    updateData.detection_result = result.detectionResult;
  }

  if (result.companyId) {
    updateData.company_id = result.companyId;
  }

  const { data, error } = await supabase
    .from('batch_process_files')
    .update(updateData)
    .eq('batch_process_id', batchProcessId)
    .eq('file_name', fileName)
    .select()
    .single();

  if (error) {
    console.error('❌ バッチファイル更新エラー:', error);
    throw error;
  }

  return data;
}

/**
 * バッチ処理のステータスを更新
 */
export async function updateBatchProcessStatus(
  batchProcessId: string,
  status: string,
  processedFiles?: number,
  failedFiles?: number
) {
  interface BatchUpdateData {
    status: string;
    processed_files?: number;
    failed_files?: number;
    completed_at?: string;
  }

  const updateData: BatchUpdateData = { status };

  if (processedFiles !== undefined) {
    updateData.processed_files = processedFiles;
  }

  if (failedFiles !== undefined) {
    updateData.failed_files = failedFiles;
  }

  if (status === 'completed' || status === 'cancelled' || status === 'error') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('batch_processes')
    .update(updateData)
    .eq('id', batchProcessId)
    .select()
    .single();

  if (error) {
    console.error('❌ バッチ処理ステータス更新エラー:', error);
    throw error;
  }

  return data;
}

/**
 * バッチ処理の履歴を取得
 */
export async function getBatchProcessHistory(limit = 10) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('ユーザーが認証されていません');
  }

  const { data, error } = await supabase
    .from('batch_processes')
    .select(`
      *,
      batch_process_files (
        id,
        file_name,
        status,
        error_message,
        processing_time_ms,
        company_id,
        work_order_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ バッチ処理履歴取得エラー:', error);
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
