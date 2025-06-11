// hooks/useProcessStatus.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { getWorkOrderStatus } from '@/lib/api';
import {
  getProcessStatusInfo,
  formatElapsedTime,
  type ProcessStatus,
  type ProcessStatusInfo,
  type ProcessStatusResponse,
} from '@/types';

export interface UseProcessStatusOptions {
  /** ポーリング間隔（ミリ秒）デフォルト: 3000ms */
  pollingInterval?: number;
  /** ステータス変化時のコールバック */
  onStatusChange?: (
    status: ProcessStatus,
    response: ProcessStatusResponse
  ) => void;
  /** エラー発生時のコールバック */
  onError?: (error: Error) => void;
  /** 処理完了時のコールバック */
  onComplete?: (response: ProcessStatusResponse) => void;
  /** 自動停止条件のカスタマイズ */
  shouldStopPolling?: (status: ProcessStatus) => boolean;
}

export interface UseProcessStatusReturn {
  /** 現在のステータス情報 */
  statusInfo: ProcessStatusInfo | null;
  /** 最新のAPIレスポンス */
  currentResponse: ProcessStatusResponse | null;
  /** ポーリング中かどうか */
  isPolling: boolean;
  /** 開始時間 */
  startTime: Date | null;
  /** 経過時間（秒） */
  elapsedTime: number;
  /** フォーマット済み経過時間 */
  formattedElapsedTime: string;
  /** エラー状態 */
  error: Error | null;
  /** ポーリング開始 */
  startPolling: (recordId: string) => void;
  /** ポーリング停止 */
  stopPolling: () => void;
  /** ステータスリセット */
  resetStatus: () => void;
  /** 手動更新 */
  refreshStatus: () => Promise<void>;
}

const DEFAULT_POLLING_INTERVAL = 3000; // 3秒

export const useProcessStatus = (
  options: UseProcessStatusOptions = {}
): UseProcessStatusReturn => {
  const {
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    onStatusChange,
    onError,
    onComplete,
    shouldStopPolling,
  } = options;

  // 状態管理
  const [statusInfo, setStatusInfo] = useState<ProcessStatusInfo | null>(null);
  const [currentResponse, setCurrentResponse] =
    useState<ProcessStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  // Refs for stable references
  const recordIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<ProcessStatus | null>(null);

  // 経過時間の更新
  useEffect(() => {
    if (!startTime || !isPolling) return;

    const updateElapsedTime = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    };

    // 即座に更新
    updateElapsedTime();

    // 1秒ごとに更新
    const timer = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(timer);
  }, [startTime, isPolling]);

  // ステータス取得関数
  const fetchStatus = useCallback(async (): Promise<void> => {
    if (!recordIdRef.current) return;

    try {
      const response = await getWorkOrderStatus(recordIdRef.current);

      setCurrentResponse(response);
      setError(null);

      // ステータス情報を更新
      const newStatusInfo = getProcessStatusInfo(response.status);
      setStatusInfo(newStatusInfo);

      // ステータス変化をチェック
      if (previousStatusRef.current !== response.status) {
        onStatusChange?.(response.status, response);
        previousStatusRef.current = response.status;
      }

      // 自動停止条件をチェック
      const shouldStop = shouldStopPolling
        ? shouldStopPolling(response.status)
        : response.status === 'completed' || response.status === 'error';

      if (shouldStop) {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // 完了時のコールバック
        if (response.status === 'completed' || response.status === 'error') {
          onComplete?.(response);
        }
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('ステータス取得に失敗しました');
      setError(error);
      onError?.(error);

      // エラー時もポーリングを停止
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [onStatusChange, onError, onComplete, shouldStopPolling]);

  // ポーリング開始
  const startPolling = useCallback(
    (recordId: string) => {
      // 既存のポーリングを停止
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      recordIdRef.current = recordId;
      setIsPolling(true);
      setStartTime(new Date());
      setError(null);
      previousStatusRef.current = null;

      // 即座に1回実行
      fetchStatus();

      // 定期的にポーリング
      intervalRef.current = setInterval(fetchStatus, pollingInterval);
    },
    [fetchStatus, pollingInterval]
  );

  // ポーリング停止
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ステータスリセット
  const resetStatus = useCallback(() => {
    stopPolling();
    setStatusInfo(null);
    setCurrentResponse(null);
    setStartTime(null);
    setElapsedTime(0);
    setError(null);
    recordIdRef.current = null;
    previousStatusRef.current = null;
  }, [stopPolling]);

  // 手動更新
  const refreshStatus = useCallback(async (): Promise<void> => {
    if (recordIdRef.current) {
      await fetchStatus();
    }
  }, [fetchStatus]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    statusInfo,
    currentResponse,
    isPolling,
    startTime,
    elapsedTime,
    formattedElapsedTime: formatElapsedTime(elapsedTime),
    error,
    startPolling,
    stopPolling,
    resetStatus,
    refreshStatus,
  };
};
