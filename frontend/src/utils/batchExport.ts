// src/utils/batchExport.ts
import type { BatchProcessResult } from '@/types';

/**
 * バッチ処理結果をCSV形式にエクスポート
 */
export function exportBatchResultsToCSV(results: BatchProcessResult[]): string {
  const headers = [
    'ファイル名',
    'ステータス',
    '会社ID',
    'Work Order ID',
    '処理時間（秒）',
    '開始時刻',
    '完了時刻',
    'エラーメッセージ',
  ];

  const rows = results.map(result => [
    result.fileName,
    result.status === 'success' ? '成功' : result.status === 'error' ? 'エラー' : result.status,
    result.companyId || '',
    result.workOrderId || '',
    result.processingTime ? (result.processingTime / 1000).toFixed(2) : '',
    result.startedAt ? new Date(result.startedAt).toLocaleString('ja-JP') : '',
    result.completedAt ? new Date(result.completedAt).toLocaleString('ja-JP') : '',
    result.errorMessage || '',
  ]);

  // BOMを追加してExcelで日本語が文字化けしないようにする
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * CSVファイルをダウンロード
 */
export function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // メモリリークを防ぐためにURLを解放
  URL.revokeObjectURL(url);
}

/**
 * バッチ処理結果をエクスポートしてダウンロード
 */
export function downloadBatchResults(results: BatchProcessResult[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const fileName = `batch_results_${timestamp}.csv`;
  const csvContent = exportBatchResultsToCSV(results);
  downloadCSV(csvContent, fileName);
}