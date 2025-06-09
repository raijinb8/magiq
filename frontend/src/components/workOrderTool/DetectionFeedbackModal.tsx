// src/components/workOrderTool/DetectionFeedbackModal.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_COMPANY_OPTIONS } from '@/constants/company';
import type { CompanyDetectionResult, CompanyOptionValue } from '@/types';

interface DetectionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectionResult: CompanyDetectionResult;
  currentFileName: string;
  onSubmitFeedback: (
    correctedCompanyId: string,
    reason: string
  ) => Promise<void>;
}

export const DetectionFeedbackModal: React.FC<DetectionFeedbackModalProps> = ({
  isOpen,
  onClose,
  detectionResult,
  currentFileName,
  onSubmitFeedback,
}) => {
  const [correctedCompanyId, setCorrectedCompanyId] = useState<CompanyOptionValue>('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!correctedCompanyId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitFeedback(correctedCompanyId, correctionReason);
      // リセット
      setCorrectedCompanyId('');
      setCorrectionReason('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">会社判定の修正</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            ファイル: <span className="font-medium">{currentFileName}</span>
          </p>
          <p className="text-sm text-gray-600">
            自動判定結果: <span className="font-medium">
              {detectionResult.detectedCompanyId || '判定できませんでした'}
            </span>
            {detectionResult.confidence > 0 && (
              <span className="ml-1">
                (信頼度: {(detectionResult.confidence * 100).toFixed(0)}%)
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="correct-company">正しい会社を選択</Label>
            <Select
              value={correctedCompanyId}
              onValueChange={setCorrectedCompanyId}
            >
              <SelectTrigger id="correct-company">
                <SelectValue placeholder="会社を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COMPANY_OPTIONS.filter(
                  opt => opt.value !== 'UNKNOWN_OR_NOT_SET' && opt.value !== detectionResult.detectedCompanyId
                ).map(company => (
                  <SelectItem key={company.value} value={company.value}>
                    {company.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">修正理由（任意）</Label>
            <Textarea
              id="reason"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="なぜ判定が間違っていたか、どのような情報があれば正しく判定できるかなど"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!correctedCompanyId || isSubmitting}
          >
            {isSubmitting ? '送信中...' : '修正を送信'}
          </Button>
        </div>
      </div>
    </div>
  );
};