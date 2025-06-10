// src/components/workOrderTool/CompanyAutoDetectToggle.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import type { CompanyDetectionResult } from '@/types';

interface CompanyAutoDetectToggleProps {
  autoDetectEnabled: boolean;
  onToggle: () => void;
  detectionResult?: CompanyDetectionResult | null;
  isLoading?: boolean;
}

export const CompanyAutoDetectToggle: React.FC<
  CompanyAutoDetectToggleProps
> = ({ autoDetectEnabled, onToggle, detectionResult, isLoading = false }) => {
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.85) {
      return (
        <Badge variant="default">
          高信頼度 {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    } else if (confidence >= 0.6) {
      return (
        <Badge variant="secondary">
          中信頼度 {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          低信頼度 {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          会社自動判定
        </label>
        <Button
          size="sm"
          variant={autoDetectEnabled ? 'default' : 'outline'}
          onClick={onToggle}
          disabled={isLoading}
        >
          {autoDetectEnabled ? '有効' : '無効'}
        </Button>
      </div>

      {autoDetectEnabled && (
        <div className="text-xs text-gray-500 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            PDFの内容から会社を自動判定します。判定できない場合は手動選択が必要です。
          </span>
        </div>
      )}

      {detectionResult && autoDetectEnabled && (
        <div className="mt-2 p-2 bg-gray-50 rounded-md space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">判定結果:</span>
            {detectionResult.detectedCompanyId ? (
              <>
                <span className="text-xs">
                  {detectionResult.detectedCompanyId}
                </span>
                {getConfidenceBadge(detectionResult.confidence)}
              </>
            ) : (
              <span className="text-xs text-gray-500">
                判定できませんでした
              </span>
            )}
          </div>

          {detectionResult.details?.foundKeywords &&
            detectionResult.details.foundKeywords.length > 0 && (
              <div className="text-xs text-gray-600">
                検出キーワード:{' '}
                {detectionResult.details.foundKeywords.join(', ')}
              </div>
            )}

          {detectionResult.details?.geminiReasoning && (
            <div className="text-xs text-gray-600 line-clamp-2">
              理由: {detectionResult.details.geminiReasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
