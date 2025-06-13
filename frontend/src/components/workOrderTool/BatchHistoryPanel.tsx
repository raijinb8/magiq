// src/components/workOrderTool/BatchHistoryPanel.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBatchProcessHistory } from '@/lib/api';

interface BatchProcess {
  id: string;
  status: string;
  total_files: number;
  processed_files: number;
  failed_files: number;
  company_id?: string;
  auto_detect_enabled: boolean;
  started_at: string;
  completed_at?: string;
  batch_process_files?: Array<{
    id: string;
    file_name: string;
    status: string;
    error_message?: string;
    processing_time_ms?: number;
    company_id?: string;
    work_order_id?: string;
  }>;
}

export const BatchHistoryPanel: React.FC = () => {
  const [history, setHistory] = useState<BatchProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getBatchProcessHistory(20);
      setHistory(data || []);
    } catch (error) {
      console.error('バッチ履歴の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">完了</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">処理中</Badge>;
      case 'cancelled':
        return <Badge variant="outline">キャンセル</Badge>;
      case 'error':
        return <Badge variant="destructive">エラー</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return '-';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">履歴を読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>バッチ処理履歴</CardTitle>
          <Button size="sm" variant="outline" onClick={loadHistory}>
            更新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                バッチ処理の履歴がありません
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((batch) => (
                  <div
                    key={batch.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(batch.status)}
                        <span className="text-sm font-medium">
                          {batch.total_files}個のファイル
                        </span>
                        {batch.auto_detect_enabled && (
                          <Badge variant="secondary" className="text-xs">
                            自動判定
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setExpandedBatch(
                            expandedBatch === batch.id ? null : batch.id
                          )
                        }
                      >
                        {expandedBatch === batch.id ? '詳細を隠す' : '詳細を表示'}
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div className="flex gap-4">
                        <span>開始: {formatDate(batch.started_at)}</span>
                        {batch.completed_at && (
                          <span>
                            処理時間: {formatDuration(batch.started_at, batch.completed_at)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        成功: {batch.processed_files - batch.failed_files}件、
                        失敗: {batch.failed_files}件
                      </div>
                    </div>

                    {expandedBatch === batch.id && batch.batch_process_files && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold mb-2">ファイル詳細</h4>
                        <div className="space-y-2">
                          {batch.batch_process_files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                            >
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[200px]">
                                  {file.file_name}
                                </span>
                                {file.status === 'success' ? (
                                  <Badge className="bg-green-500 text-xs">成功</Badge>
                                ) : file.status === 'error' ? (
                                  <Badge variant="destructive" className="text-xs">
                                    エラー
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    {file.status}
                                  </Badge>
                                )}
                              </div>
                              {file.processing_time_ms && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(file.processing_time_ms / 1000)}秒
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {batch.batch_process_files.some((f) => f.error_message) && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                            <h5 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                              エラー詳細
                            </h5>
                            {batch.batch_process_files
                              .filter((f) => f.error_message)
                              .map((file) => (
                                <p key={file.id} className="text-xs text-red-600 dark:text-red-400">
                                  {file.file_name}: {file.error_message}
                                </p>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};