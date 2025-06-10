// hooks/useWorkOrderStatus.ts
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useProcessStatus } from './useProcessStatus';
import type { ProcessStatus, ProcessStatusResponse } from '@/types';

export interface UseWorkOrderStatusOptions {
  /** 処理完了時の自動通知を有効にするか */
  enableNotifications?: boolean;
  /** カスタム通知メッセージ */
  customMessages?: {
    completed?: string;
    error?: string;
  };
  /** 処理完了時のコールバック */
  onProcessComplete?: (response: ProcessStatusResponse) => void;
  /** エラー時のコールバック */
  onProcessError?: (response: ProcessStatusResponse) => void;
}

/**
 * WorkOrderTool用に最適化されたプロセスステータス管理フック
 *
 * useProcessStatusの上位ラッパーで、以下の機能を提供：
 * - 自動通知（toast）
 * - WorkOrderTool固有のコールバック処理
 * - 簡素化されたAPI
 */
export const useWorkOrderStatus = (options: UseWorkOrderStatusOptions = {}) => {
  const {
    enableNotifications = true,
    customMessages = {},
    onProcessComplete,
    onProcessError,
  } = options;

  // ステータス変化時の処理
  const handleStatusChange = useCallback(
    (status: ProcessStatus, response: ProcessStatusResponse) => {
      if (!enableNotifications) return;

      switch (status) {
        case 'ocr_processing':
          toast.info('会社判定を開始しました', {
            description: 'PDFから会社情報を抽出しています...',
          });
          break;
        case 'document_creating':
          toast.info('手配書作成を開始しました', {
            description: 'AIが手配書を作成しています...',
          });
          break;
        case 'completed':
          toast.success(customMessages.completed || '処理が完了しました！', {
            description: '手配書の作成が完了しました',
          });
          onProcessComplete?.(response);
          break;
        case 'error':
          toast.error(customMessages.error || '処理中にエラーが発生しました', {
            description:
              response.error_message || '詳細は画面で確認してください',
          });
          onProcessError?.(response);
          break;
      }
    },
    [enableNotifications, customMessages, onProcessComplete, onProcessError]
  );

  // エラー時の処理
  const handleError = useCallback(
    (error: Error) => {
      if (enableNotifications) {
        toast.error('ステータス取得エラー', {
          description: error.message,
        });
      }
    },
    [enableNotifications]
  );

  // 処理完了時の処理
  const handleComplete = useCallback(
    (response: ProcessStatusResponse) => {
      // ブラウザ通知（許可されている場合）
      if (
        enableNotifications &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('MagIQ - 処理完了', {
          body:
            response.status === 'completed'
              ? '手配書の作成が完了しました'
              : 'エラーが発生しました',
          icon: '/vite.svg', // アプリのアイコン
        });
      }
    },
    [enableNotifications]
  );

  const processStatus = useProcessStatus({
    pollingInterval: 3000, // 3秒間隔
    onStatusChange: handleStatusChange,
    onError: handleError,
    onComplete: handleComplete,
  });

  // WorkOrderTool用の便利メソッド
  const startProcessing = useCallback(
    (recordId: string, fileName?: string) => {
      if (enableNotifications) {
        toast.info('処理を開始しました', {
          description: fileName
            ? `「${fileName}」を処理中...`
            : '処理を開始しています...',
        });
      }
      processStatus.startPolling(recordId);
    },
    [processStatus.startPolling, enableNotifications]
  );

  const cancelProcessing = useCallback(() => {
    processStatus.stopPolling();
    if (enableNotifications) {
      toast.info('処理を中断しました');
    }
  }, [processStatus.stopPolling, enableNotifications]);

  return {
    ...processStatus,
    // WorkOrderTool用の便利メソッド
    startProcessing,
    cancelProcessing,
    // 追加の状態情報
    isProcessing: processStatus.isPolling,
    hasError: !!processStatus.error,
    isCompleted: processStatus.statusInfo?.status === 'completed',
    isErrored: processStatus.statusInfo?.status === 'error',
  };
};
