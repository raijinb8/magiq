// src/test/CompanyAutoDetectToggle.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyAutoDetectToggle } from '@/components/workOrderTool/CompanyAutoDetectToggle';
import type { CompanyDetectionResult } from '@/types';

describe('CompanyAutoDetectToggle', () => {
  let mockOnToggle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnToggle = vi.fn();
  });

  describe('基本表示', () => {
    it('自動判定が無効の場合の表示が正しい', () => {
      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={false}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('会社自動判定')).toBeInTheDocument();
      expect(screen.getByText('無効')).toBeInTheDocument();
      expect(
        screen.queryByText('PDFの内容から会社を自動判定します')
      ).not.toBeInTheDocument();
    });

    it('自動判定が有効の場合の表示が正しい', () => {
      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByText('会社自動判定')).toBeInTheDocument();
      expect(screen.getByText('有効')).toBeInTheDocument();
      expect(
        screen.getByText(
          'PDFの内容から会社を自動判定します。判定できない場合は手動選択が必要です。'
        )
      ).toBeInTheDocument();
    });

    it('ローディング中はボタンが無効化される', () => {
      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
          isLoading={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('判定結果の表示', () => {
    it('成功した判定結果が正しく表示される', () => {
      const detectionResult: CompanyDetectionResult = {
        detectedCompanyId: 'NOHARA_G',
        confidence: 0.95,
        method: 'ocr_gemini',
        details: {
          foundKeywords: ['野原グループ株式会社'],
          geminiReasoning: '確定キーワードを検出しました',
        },
      };

      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
          detectionResult={detectionResult}
        />
      );

      expect(screen.getByText('判定結果:')).toBeInTheDocument();
      expect(screen.getByText('NOHARA_G')).toBeInTheDocument();
      expect(screen.getByText('高信頼度 95%')).toBeInTheDocument();
      expect(
        screen.getByText('検出キーワード: 野原グループ株式会社')
      ).toBeInTheDocument();
      expect(
        screen.getByText('理由: 確定キーワードを検出しました')
      ).toBeInTheDocument();
    });

    it('判定失敗の場合が正しく表示される', () => {
      const detectionResult: CompanyDetectionResult = {
        detectedCompanyId: null,
        confidence: 0.2,
        method: 'ocr_gemini',
        details: {
          geminiReasoning: '判定可能なキーワードが見つかりませんでした',
        },
      };

      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
          detectionResult={detectionResult}
        />
      );

      expect(screen.getByText('判定結果:')).toBeInTheDocument();
      expect(screen.getByText('判定できませんでした')).toBeInTheDocument();
      expect(
        screen.getByText('理由: 判定可能なキーワードが見つかりませんでした')
      ).toBeInTheDocument();
    });

    it('中信頼度の判定結果が正しく表示される', () => {
      const detectionResult: CompanyDetectionResult = {
        detectedCompanyId: 'KATOUBENIYA_MISAWA',
        confidence: 0.75,
        method: 'ocr_gemini',
        details: {
          foundKeywords: ['加藤ベニヤ'],
          geminiReasoning: '部分的なキーワードを検出',
        },
      };

      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
          detectionResult={detectionResult}
        />
      );

      expect(screen.getByText('KATOUBENIYA_MISAWA')).toBeInTheDocument();
      expect(screen.getByText('中信頼度 75%')).toBeInTheDocument();
      expect(
        screen.getByText('検出キーワード: 加藤ベニヤ')
      ).toBeInTheDocument();
    });

    it('低信頼度の判定結果が正しく表示される', () => {
      const detectionResult: CompanyDetectionResult = {
        detectedCompanyId: 'NOHARA_G',
        confidence: 0.45,
        method: 'rule_based',
        details: {
          foundKeywords: ['野原'],
          geminiReasoning: '曖昧なキーワードのみ検出',
        },
      };

      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
          detectionResult={detectionResult}
        />
      );

      expect(screen.getByText('NOHARA_G')).toBeInTheDocument();
      expect(screen.getByText('低信頼度 45%')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('トグルボタンクリックで正しくイベントが発火する', () => {
      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={false}
          onToggle={mockOnToggle}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('ローディング中はトグルが無効化される', () => {
      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={false}
          onToggle={mockOnToggle}
          isLoading={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });
  });

  describe('信頼度バッジ', () => {
    it('信頼度に応じて適切なバッジが表示される', () => {
      const testCases = [
        {
          confidence: 0.95,
          expectedText: '高信頼度 95%',
          expectedClass: 'default',
        },
        {
          confidence: 0.85,
          expectedText: '高信頼度 85%',
          expectedClass: 'default',
        },
        {
          confidence: 0.75,
          expectedText: '中信頼度 75%',
          expectedClass: 'secondary',
        },
        {
          confidence: 0.6,
          expectedText: '中信頼度 60%',
          expectedClass: 'secondary',
        },
        {
          confidence: 0.45,
          expectedText: '低信頼度 45%',
          expectedClass: 'outline',
        },
        {
          confidence: 0.25,
          expectedText: '低信頼度 25%',
          expectedClass: 'outline',
        },
      ];

      testCases.forEach(({ confidence, expectedText }) => {
        const detectionResult: CompanyDetectionResult = {
          detectedCompanyId: 'NOHARA_G',
          confidence,
          method: 'ocr_gemini',
          details: {},
        };

        const { unmount } = render(
          <CompanyAutoDetectToggle
            autoDetectEnabled={true}
            onToggle={mockOnToggle}
            detectionResult={detectionResult}
          />
        );

        expect(screen.getByText(expectedText)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('条件表示', () => {
    it('自動判定が無効の場合は判定結果が表示されない', () => {
      const detectionResult: CompanyDetectionResult = {
        detectedCompanyId: 'NOHARA_G',
        confidence: 0.95,
        method: 'ocr_gemini',
        details: {},
      };

      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={false}
          onToggle={mockOnToggle}
          detectionResult={detectionResult}
        />
      );

      expect(screen.queryByText('判定結果:')).not.toBeInTheDocument();
      expect(screen.queryByText('NOHARA_G')).not.toBeInTheDocument();
    });

    it('判定結果がない場合は結果セクションが表示されない', () => {
      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.queryByText('判定結果:')).not.toBeInTheDocument();
    });

    it('キーワードがない場合はキーワード行が表示されない', () => {
      const detectionResult: CompanyDetectionResult = {
        detectedCompanyId: 'NOHARA_G',
        confidence: 0.95,
        method: 'ocr_gemini',
        details: {
          geminiReasoning: 'テスト理由',
        },
      };

      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
          detectionResult={detectionResult}
        />
      );

      expect(screen.queryByText(/検出キーワード:/)).not.toBeInTheDocument();
    });

    it('理由がない場合は理由行が表示されない', () => {
      const detectionResult: CompanyDetectionResult = {
        detectedCompanyId: 'NOHARA_G',
        confidence: 0.95,
        method: 'ocr_gemini',
        details: {
          foundKeywords: ['野原グループ株式会社'],
        },
      };

      render(
        <CompanyAutoDetectToggle
          autoDetectEnabled={true}
          onToggle={mockOnToggle}
          detectionResult={detectionResult}
        />
      );

      expect(screen.queryByText(/理由:/)).not.toBeInTheDocument();
    });
  });
});
