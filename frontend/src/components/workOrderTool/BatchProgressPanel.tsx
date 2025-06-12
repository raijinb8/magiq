// src/components/workOrderTool/BatchProgressPanel.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BatchProcessingState, BatchProcessResult } from '@/types';

interface BatchProgressPanelProps {
  batchState: BatchProcessingState;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  progress: number;
  elapsedTime: number;
}

export const BatchProgressPanel: React.FC<BatchProgressPanelProps> = ({
  batchState,
  onPause,
  onResume,
  onCancel,
  progress,
  elapsedTime,
}) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分${seconds % 60}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const getStatusBadge = (status: BatchProcessResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">成功</Badge>;
      case 'error':
        return <Badge variant="destructive">エラー</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">処理中</Badge>;
      case 'pending':
        return <Badge variant="secondary">待機中</Badge>;
      case 'cancelled':
        return <Badge variant="outline">キャンセル</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const successCount = batchState.results.filter(r => r.status === 'success').length;
  const errorCount = batchState.results.filter(r => r.status === 'error').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>バッチ処理進捗</span>
          <div className="flex gap-2">
            {batchState.isProcessing && (
              <>
                {batchState.isPaused ? (
                  <Button size="sm" onClick={onResume}>
                    再開
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={onPause}>
                    一時停止
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={onCancel}>
                  キャンセル
                </Button>
              </>
            )}
            {!batchState.isProcessing && batchState.results.length > 0 && (
              <Button size="sm" variant="secondary" disabled>
                完了
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>
              {batchState.results.length} / {batchState.totalFiles} ファイル
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-muted-foreground">成功</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-muted-foreground">エラー</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-muted-foreground">処理時間</div>
          </div>
        </div>

        {/* 処理結果リスト */}
        <div className="border rounded-lg">
          <div className="p-2 bg-muted">
            <h4 className="text-sm font-semibold">処理結果</h4>
          </div>
          <ScrollArea className="h-64">
            <div className="p-2">
              {batchState.results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  処理結果がまだありません
                </p>
              ) : (
                <ul className="space-y-2">
                  {batchState.results.map((result, index) => (
                    <li 
                      key={`${result.fileName}-${index}`}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm truncate">{result.fileName}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      {result.processingTime && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(result.processingTime)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* エラー詳細 */}
        {errorCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
              エラー詳細
            </h4>
            <ul className="space-y-1">
              {batchState.results
                .filter(r => r.status === 'error')
                .map((result, index) => (
                  <li key={`error-${result.fileName}-${index}`} className="text-xs">
                    <span className="font-medium">{result.fileName}:</span>{' '}
                    <span className="text-red-600 dark:text-red-400">
                      {result.errorMessage || '不明なエラー'}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* 現在処理中のファイル */}
        {batchState.isProcessing && !batchState.isPaused && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">
                処理中: {batchState.results.find(r => r.status === 'processing')?.fileName || 
                        `${batchState.currentFileIndex + 1}番目のファイル`}
              </span>
            </div>
          </div>
        )}

        {/* 一時停止中の表示 */}
        {batchState.isPaused && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              処理を一時停止中です
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};