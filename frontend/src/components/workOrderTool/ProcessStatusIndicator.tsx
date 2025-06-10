// components/workOrderTool/ProcessStatusIndicator.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Search,
  Edit,
  Check,
  AlertCircle,
  HelpCircle,
  X,
  Loader2,
} from 'lucide-react';
import type { ProcessStatusInfo } from '@/types';

export interface ProcessStatusIndicatorProps {
  /** ステータス情報 */
  statusInfo: ProcessStatusInfo | null;
  /** 経過時間（フォーマット済み） */
  formattedElapsedTime?: string;
  /** エラーメッセージ */
  errorMessage?: string | null;
  /** ファイル名（表示用） */
  fileName?: string;
  /** 中断ボタンの表示 */
  showCancelButton?: boolean;
  /** 中断ボタンが無効化されているか */
  cancelDisabled?: boolean;
  /** 中断ボタンクリック時のハンドラ */
  onCancel?: () => void;
  /** コンパクト表示モード */
  compact?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// アイコンマッピング
const getStatusIcon = (status: string, isLoading: boolean) => {
  const iconProps = { size: 16, className: 'shrink-0' };

  if (isLoading) {
    return <Loader2 {...iconProps} className="animate-spin shrink-0" />;
  }

  switch (status) {
    case 'waiting':
      return <Clock {...iconProps} />;
    case 'ocr_processing':
      return <Search {...iconProps} />;
    case 'document_creating':
      return <Edit {...iconProps} />;
    case 'completed':
      return <Check {...iconProps} />;
    case 'error':
      return <AlertCircle {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
};

// バッジ色のマッピング
const getBadgeVariant = (color: string) => {
  switch (color) {
    case 'blue':
      return 'default';
    case 'yellow':
      return 'secondary';
    case 'green':
      return 'default';
    case 'red':
      return 'destructive';
    case 'gray':
    default:
      return 'outline';
  }
};

// バッジのカスタムスタイル
const getBadgeColorClasses = (color: string) => {
  switch (color) {
    case 'blue':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
    case 'yellow':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
    case 'green':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200';
    case 'red':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
    case 'gray':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200';
  }
};

// プログレスバーコンポーネント
const ProgressBar: React.FC<{
  status: string;
  isLoading: boolean;
  compact?: boolean;
}> = ({ status, isLoading, compact }) => {
  const steps = [
    { key: 'waiting', label: '待機', width: '25%' },
    { key: 'ocr_processing', label: '会社判定', width: '50%' },
    { key: 'document_creating', label: '手配書作成', width: '75%' },
    { key: 'completed', label: '完了', width: '100%' },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex((s) => s.key === stepKey);
    const currentIndex = steps.findIndex((s) => s.key === status);

    if (status === 'error') {
      return currentIndex >= stepIndex ? 'error' : 'pending';
    }

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return isLoading ? 'active' : 'completed';
    return 'pending';
  };

  if (compact) {
    // コンパクトモードでは簡単なプログレスバーのみ
    const currentStep = steps.findIndex((s) => s.key === status);
    const progress =
      currentStep >= 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            status === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {steps.map((step) => {
          const stepStatus = getStepStatus(step.key);
          return (
            <div
              key={step.key}
              className={`text-xs font-medium ${
                stepStatus === 'completed' || stepStatus === 'active'
                  ? 'text-blue-600 dark:text-blue-400'
                  : stepStatus === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="flex h-full rounded-full overflow-hidden">
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step.key);
            return (
              <div
                key={step.key}
                className={`flex-1 ${
                  stepStatus === 'completed'
                    ? 'bg-green-500'
                    : stepStatus === 'active'
                      ? 'bg-blue-500 animate-pulse'
                      : stepStatus === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-200'
                } ${index < steps.length - 1 ? 'border-r border-white' : ''}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ProcessStatusIndicator: React.FC<ProcessStatusIndicatorProps> = ({
  statusInfo,
  formattedElapsedTime,
  errorMessage,
  fileName,
  showCancelButton = false,
  cancelDisabled = false,
  onCancel,
  compact = false,
  className = '',
}) => {
  if (!statusInfo) {
    return null;
  }

  const { status, label, description, color, isLoading } = statusInfo;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 ${className}`}
      >
        {getStatusIcon(status, isLoading)}
        <span className="text-sm font-medium">{label}</span>
        {formattedElapsedTime && (
          <span className="text-xs text-gray-500">{formattedElapsedTime}</span>
        )}
        <ProgressBar status={status} isLoading={isLoading} compact />
        {showCancelButton && isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={cancelDisabled}
            className="h-6 w-6 p-0"
          >
            <X size={14} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status, isLoading)}
            <Badge
              variant={getBadgeVariant(color)}
              className={getBadgeColorClasses(color)}
            >
              {label}
            </Badge>
          </div>
          {formattedElapsedTime && (
            <span className="text-sm text-gray-500 font-mono">
              {formattedElapsedTime}
            </span>
          )}
        </div>

        {/* ファイル名 */}
        {fileName && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <strong>ファイル:</strong> {fileName}
          </div>
        )}

        {/* 説明 */}
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {description}
        </div>

        {/* プログレスバー */}
        <ProgressBar status={status} isLoading={isLoading} />

        {/* エラーメッセージ */}
        {status === 'error' && errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <div className="font-medium mb-1">エラーが発生しました</div>
                <div className="whitespace-pre-wrap">{errorMessage}</div>
              </div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        {showCancelButton && isLoading && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={cancelDisabled}
              className="flex items-center gap-2"
            >
              <X size={14} />
              処理を中断
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
