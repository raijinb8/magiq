import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { ProcessState } from '@/types';

interface ProcessStatusIndicatorProps {
  processState: ProcessState;
  onCancel?: () => void;
  className?: string;
}

export const ProcessStatusIndicator: React.FC<ProcessStatusIndicatorProps> = ({
  processState,
  onCancel,
  className = '',
}) => {
  const [displayTime, setDisplayTime] = useState<string>('0:00');

  // 1秒ごとに経過時間を更新（処理中のみ）
  useEffect(() => {
    // 処理が完了・エラー・キャンセルされた場合はタイマーを停止
    if (
      processState.status === 'completed' ||
      processState.status === 'error' ||
      processState.status === 'cancelled'
    ) {
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - processState.startTime.getTime();
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setDisplayTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer(); // 初回即座に実行
    const interval = setInterval(updateTimer, 1000); // 1秒ごと

    return () => clearInterval(interval);
  }, [processState.startTime, processState.status]); // statusも依存配列に追加

  // ステータスに応じたスタイルとアイコンを取得
  const getStatusConfig = () => {
    switch (processState.status) {
      case 'waiting':
        return {
          icon: '⏳',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
      case 'ocr_processing':
        return { icon: '🔍', color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'document_creating':
        return {
          icon: '📝',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        };
      case 'completed':
        return { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'error':
        return { icon: '❌', color: 'text-red-600', bgColor: 'bg-red-50' };
      case 'cancelled':
        return { icon: '⏹️', color: 'text-gray-600', bgColor: 'bg-gray-50' };
      default:
        return { icon: '❓', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const statusConfig = getStatusConfig();

  // 横幅いっぱいのステップドット表示
  const renderFullWidthStepDots = () => {
    const steps = ['ocr_processing', 'document_creating', 'completed'];

    return (
      <div className="flex items-center justify-between flex-1 mx-2">
        {steps.map((step, index) => {
          const isActive = processState.status === step;
          const isCompleted =
            processState.status === 'completed' ||
            (processState.status === 'document_creating' && index === 0);

          return (
            <React.Fragment key={step}>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted
                    ? 'bg-green-500'
                    : isActive
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                }`}
              />
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`${statusConfig.bgColor} border rounded p-1 text-xs ${className}`}
    >
      {/* 1行レイアウト: アイコン + ステータス + ドット + 時間 + ボタン */}
      <div className="flex items-center">
        <span className="text-sm mr-1">{statusConfig.icon}</span>
        <span className={`font-medium ${statusConfig.color} flex-shrink-0`}>
          {processState.currentStep}
        </span>

        {/* 正常処理時のみドット表示 */}
        {processState.status !== 'error' &&
          processState.status !== 'cancelled' &&
          renderFullWidthStepDots()}

        <span
          className={`text-xs font-mono ${statusConfig.color} ml-1 flex-shrink-0`}
        >
          {displayTime}
        </span>

        {/* ボタンを右端に配置 */}
        <div className="ml-1 flex space-x-1">
          {/* 処理中のキャンセルボタン */}
          {processState.canCancel &&
            processState.status !== 'completed' &&
            processState.status !== 'error' &&
            processState.status !== 'cancelled' &&
            onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="h-5 text-xs px-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                中断
              </Button>
            )}
        </div>
      </div>

      {/* エラー詳細（別行、必要時のみ） */}
      {processState.status === 'error' && processState.errorDetail && (
        <div className="mt-0.5">
          <div className="text-xs text-red-700 bg-red-100 px-1 py-0.5 rounded">
            {processState.errorDetail}
          </div>
        </div>
      )}
    </div>
  );
};
