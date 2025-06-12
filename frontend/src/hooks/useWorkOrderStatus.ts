import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  ProcessState,
  ProcessStatus,
  WorkOrderStatusResponse,
} from '@/types';

export interface UseWorkOrderStatusProps {
  onProcessComplete?: (workOrderId: string) => void;
  onProcessError?: (workOrderId: string, errorMessage: string) => void;
  pollingInterval?: number; // ポーリング間隔（ミリ秒）
}

export interface UseWorkOrderStatusReturn {
  processState: ProcessState | null;
  startProcess: (workOrderId: string) => void;
  startProcessWithoutId: () => void;
  updateWorkOrderId: (workOrderId: string) => void;
  setDocumentCreating: () => void;
  completeProcess: () => void;
  setErrorState: (errorMessage: string) => void;
  cancelProcess: () => void;
  retryProcess: () => void;
  clearProcess: () => void;
  isPolling: boolean;
}

export const useWorkOrderStatus = ({
  onProcessComplete,
  onProcessError,
  pollingInterval = 3000, // デフォルト3秒間隔
}: UseWorkOrderStatusProps = {}): UseWorkOrderStatusReturn => {
  const [processState, setProcessState] = useState<ProcessState | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentWorkOrderIdRef = useRef<string | null>(null);
  const documentCreatingStartTimeRef = useRef<Date | null>(null);

  // DBステータスをProcessStatusにマッピング
  const mapDbStatusToProcessStatus = useCallback(
    (dbStatus: string): ProcessStatus => {
      switch (dbStatus.toLowerCase()) {
        case 'processing':
        case 'uploaded':
          return 'ocr_processing';
        case 'generating':
        case 'document_creating':
          return 'document_creating';
        case 'completed':
        case 'success':
          return 'completed';
        case 'error':
        case 'failed':
          return 'error';
        case 'cancelled':
          return 'cancelled';
        default:
          return 'waiting';
      }
    },
    []
  );

  // ステータスに応じた日本語表示を生成（ファイル名なし）
  const getStepDescription = useCallback((status: ProcessStatus): string => {
    switch (status) {
      case 'waiting':
        return '処理待機中...';
      case 'ocr_processing':
        return '会社情報を判定中...';
      case 'document_creating':
        return '手配書を作成中...';
      case 'completed':
        return '処理完了';
      case 'error':
        return 'エラーが発生しました';
      case 'cancelled':
        return '処理がキャンセルされました';
      default:
        return '状態不明';
    }
  }, []);

  // work_orderのステータスを取得
  const fetchWorkOrderStatus = useCallback(
    async (workOrderId: string): Promise<WorkOrderStatusResponse | null> => {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select(
            'id, status, error_message, uploaded_at, gemini_processed_at, file_name, updated_at'
          )
          .eq('id', workOrderId)
          .single();

        if (error) {
          console.error('Error fetching work order status:', error);
          return null;
        }

        return data as WorkOrderStatusResponse;
      } catch (error) {
        console.error('Unexpected error fetching work order status:', error);
        return null;
      }
    },
    []
  );

  // ポーリング処理
  const pollStatus = useCallback(async () => {
    const workOrderId = currentWorkOrderIdRef.current;
    if (!workOrderId) return;

    const statusData = await fetchWorkOrderStatus(workOrderId);
    if (!statusData) return;

    const mappedStatus = mapDbStatusToProcessStatus(statusData.status);
    const currentStep = getStepDescription(mappedStatus);

    setProcessState((prevState) => {
      if (!prevState) return null;

      const newState: ProcessState = {
        ...prevState,
        status: mappedStatus,
        currentStep,
        errorDetail: statusData.error_message || undefined,
        canCancel:
          mappedStatus === 'ocr_processing' ||
          mappedStatus === 'document_creating',
      };

      return newState;
    });

    // 完了またはエラー時の処理
    if (mappedStatus === 'completed') {
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onProcessComplete?.(workOrderId);
    } else if (mappedStatus === 'error') {
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      onProcessError?.(
        workOrderId,
        statusData.error_message || 'Unknown error'
      );
    }
  }, [
    fetchWorkOrderStatus,
    mapDbStatusToProcessStatus,
    getStepDescription,
    onProcessComplete,
    onProcessError,
  ]);

  // 処理開始
  const startProcess = useCallback(
    (workOrderId: string) => {
      currentWorkOrderIdRef.current = workOrderId;

      const initialState: ProcessState = {
        status: 'waiting',
        currentStep: getStepDescription('waiting'),
        startTime: new Date(),
        workOrderId,
        canCancel: false,
      };

      setProcessState(initialState);
      setIsPolling(true);

      // ポーリング開始
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(pollStatus, pollingInterval);

      // 初回即座に実行
      pollStatus();
    },
    [getStepDescription, pollStatus, pollingInterval]
  );

  // 処理キャンセル
  const cancelProcess = useCallback(async () => {
    const workOrderId = currentWorkOrderIdRef.current;

    try {
      // workOrderIdがある場合はDBを更新
      if (workOrderId) {
        const { error } = await supabase
          .from('work_orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', workOrderId);

        if (error) {
          console.error('Error cancelling process:', error);
          // DBエラーでも中断状態にする（ローカル状態のみ）
        }
      }

      // workOrderIdが無い場合でもローカル状態を中断状態にする
      setProcessState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          status: 'cancelled',
          currentStep: '処理がキャンセルされました',
          canCancel: false,
        };
      });

      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.error('Unexpected error cancelling process:', error);
    }
  }, []);

  // 処理再試行
  const retryProcess = useCallback(async () => {
    const workOrderId = currentWorkOrderIdRef.current;
    if (!workOrderId || !processState) return;

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'processing',
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workOrderId);

      if (error) {
        console.error('Error retrying process:', error);
        return;
      }

      // 処理を再開
      setProcessState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          status: 'waiting',
          currentStep: '処理を再開中...',
          errorDetail: undefined,
          startTime: new Date(),
          canCancel: true,
        };
      });

      setIsPolling(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(pollStatus, pollingInterval);
      pollStatus();
    } catch (error) {
      console.error('Unexpected error retrying process:', error);
    }
  }, [processState, pollStatus, pollingInterval]);

  // workOrderId無しで処理開始
  const startProcessWithoutId = useCallback(() => {
    // 既存のポーリングを停止
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const initialState: ProcessState = {
      status: 'ocr_processing',
      currentStep: getStepDescription('ocr_processing'),
      startTime: new Date(),
      canCancel: true,
    };

    setProcessState(initialState);
    setIsPolling(false); // workOrderIdが無いのでポーリングは開始しない
    currentWorkOrderIdRef.current = null;
  }, [getStepDescription]);

  // workOrderIdを後から設定（ポーリングは開始しない）
  const updateWorkOrderId = useCallback(
    (workOrderId: string) => {
      currentWorkOrderIdRef.current = workOrderId;

      setProcessState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          workOrderId,
          status: 'document_creating',
          currentStep: getStepDescription('document_creating'),
        };
      });

      // ポーリングは開始しない（古いDBステータスを取得する問題を回避）
    },
    [getStepDescription]
  );

  // 手配書作成中状態を強制設定
  const setDocumentCreating = useCallback(() => {
    documentCreatingStartTimeRef.current = new Date();

    setProcessState((prevState) => {
      if (!prevState) return null;
      return {
        ...prevState,
        status: 'document_creating',
        currentStep: getStepDescription('document_creating'),
        canCancel: true,
      };
    });
  }, [getStepDescription]);

  // 最小表示時間を保証して完了状態にする
  const completeProcess = useCallback(() => {
    const completeFn = () => {
      setProcessState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          status: 'completed',
          currentStep: '処理完了',
          canCancel: false,
        };
      });

      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // 完了通知
      const workOrderId = currentWorkOrderIdRef.current;
      if (workOrderId) {
        onProcessComplete?.(workOrderId);
      }
    };

    // 手配書作成中の最小表示時間を保証（2秒）
    const minDisplayTime = 2000;
    const documentCreatingStartTime = documentCreatingStartTimeRef.current;

    if (documentCreatingStartTime) {
      const elapsed = Date.now() - documentCreatingStartTime.getTime();
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      if (remainingTime > 0) {
        setTimeout(completeFn, remainingTime);
      } else {
        completeFn();
      }
    } else {
      completeFn();
    }
  }, [onProcessComplete]);

  // エラー状態に設定
  const setErrorState = useCallback(
    (errorMessage: string) => {
      setProcessState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          status: 'error',
          currentStep: 'エラーが発生しました',
          errorDetail: errorMessage,
          canCancel: false,
        };
      });

      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // エラー通知
      const workOrderId = currentWorkOrderIdRef.current;
      if (workOrderId) {
        onProcessError?.(workOrderId, errorMessage);
      }
    },
    [onProcessError]
  );

  // 処理状態をクリア
  const clearProcess = useCallback(() => {
    setProcessState(null);
    setIsPolling(false);
    currentWorkOrderIdRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    processState,
    startProcess,
    startProcessWithoutId,
    updateWorkOrderId,
    setDocumentCreating,
    completeProcess,
    setErrorState,
    cancelProcess,
    retryProcess,
    clearProcess,
    isPolling,
  };
};
