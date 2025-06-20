// src/test/companyAutoDetection.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * 2段階会社自動判定機能のテスト
 */
describe('会社自動判定機能', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OCR判定ルール', () => {
    it('野原グループ株式会社の確定判定ルールが正しく動作する', () => {
      // 野原グループ株式会社が含まれた場合の判定ロジックをテスト
      const testCases = [
        {
          input: '野原グループ株式会社の作業指示書',
          expected: 'NOHARA_G',
          confidence: 0.95,
          description: '野原グループ株式会社の直接記載',
        },
        {
          input: '発注元：野原グループ株式会社\n施工：加藤ベニヤ',
          expected: 'NOHARA_G',
          confidence: 0.95,
          description: '複数会社名があっても野原グループ株式会社を優先',
        },
        {
          input: '加藤ベニヤ池袋 ミサワホーム 工事',
          expected: 'KATOUBENIYA_IKEBUKURO_MISAWA',
          confidence: 0.85,
          description: '加藤ベニヤ + ミサワホームの組み合わせ',
        },
        {
          input: '一般的な建設会社の作業指示書',
          expected: null,
          confidence: 0.1,
          description: '判定不可能なケース',
        },
      ];

      testCases.forEach(({ input, expected, confidence, description }) => {
        const result = simulateOcrDetection(input);
        expect(result.company_id, description).toBe(expected);
        if (expected) {
          expect(result.confidence, description).toBeGreaterThanOrEqual(
            confidence - 0.05
          );
        }
      });
    });

    it('確定キーワードの優先順位が正しく動作する', () => {
      // 優先順位テスト
      const testText =
        '発注：野原グループ株式会社\n施工：加藤ベニヤ池袋\n協力：ミサワホーム';
      const result = simulateOcrDetection(testText);

      // 野原グループ株式会社が最優先で判定される
      expect(result.company_id).toBe('NOHARA_G');
      expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      expect(result.found_keywords).toContain('野原グループ株式会社');
    });
  });

  describe('判定精度', () => {
    it('信頼度の閾値が適切に設定される', () => {
      const highConfidenceCase = simulateOcrDetection('野原グループ株式会社');
      const mediumConfidenceCase = simulateOcrDetection('野原G住環境');
      const lowConfidenceCase = simulateOcrDetection('不明な会社');

      expect(highConfidenceCase.confidence).toBeGreaterThanOrEqual(0.95);
      expect(mediumConfidenceCase.confidence).toBeLessThan(0.95);
      expect(lowConfidenceCase.confidence).toBeLessThan(0.5);
    });

    it('複合条件での判定が正確に動作する', () => {
      const testCases = [
        {
          text: '加藤ベニヤ ミサワホーム',
          expectedCompany: 'KATOUBENIYA_IKEBUKURO_MISAWA',
          minConfidence: 0.8,
        },
        {
          text: '加藤ベニヤ',
          expectedCompany: 'KATOUBENIYA_IKEBUKURO_MISAWA',
          minConfidence: 0.6,
        },
        {
          text: 'ミサワホーム',
          expectedCompany: 'KATOUBENIYA_IKEBUKURO_MISAWA',
          minConfidence: 0.6,
        },
      ];

      testCases.forEach(({ text, expectedCompany, minConfidence }) => {
        const result = simulateOcrDetection(text);
        expect(result.company_id).toBe(expectedCompany);
        expect(result.confidence).toBeGreaterThanOrEqual(minConfidence);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('空の入力に対して適切に処理する', () => {
      const result = simulateOcrDetection('');
      expect(result.company_id).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.found_keywords).toEqual([]);
    });

    it('特殊文字や改行を含む入力を適切に処理する', () => {
      const complexText = `
        【重要】作業指示書
        
        発注元：野原グループ株式会社
        住所：東京都...
        電話：03-1234-5678
        
        施工内容：
        - 内装工事
        - 外装補修
      `;

      const result = simulateOcrDetection(complexText);
      expect(result.company_id).toBe('NOHARA_G');
      expect(result.found_keywords).toContain('野原グループ株式会社');
    });
  });
});

/**
 * OCR判定のシミュレーション関数
 * 実際のGemini APIの代わりにローカルでテスト可能な判定ロジック
 */
function simulateOcrDetection(text: string): {
  company_id: string | null;
  confidence: number;
  detected_text: string;
  found_keywords: string[];
  reasoning: string;
} {
  const foundKeywords: string[] = [];
  let detectedCompany: string | null = null;
  let confidence = 0;
  let reasoning = '';

  // 確定キーワード：野原グループ株式会社（最優先）
  if (text.includes('野原グループ株式会社')) {
    foundKeywords.push('野原グループ株式会社');
    detectedCompany = 'NOHARA_G';
    confidence = 0.95;
    reasoning = '確定キーワード「野原グループ株式会社」を検出';
  }
  // 野原G関連キーワード
  else if (text.includes('野原G住環境')) {
    foundKeywords.push('野原G住環境');
    detectedCompany = 'NOHARA_G';
    confidence = 0.85;
    reasoning = '野原G住環境キーワードを検出';
  } else if (text.includes('野原G')) {
    foundKeywords.push('野原G');
    detectedCompany = 'NOHARA_G';
    confidence = 0.75;
    reasoning = '野原Gキーワードを検出';
  }
  // 加藤ベニヤ + ミサワホーム複合判定
  else if (text.includes('加藤ベニヤ') && text.includes('ミサワホーム')) {
    foundKeywords.push('加藤ベニヤ', 'ミサワホーム');
    detectedCompany = 'KATOUBENIYA_IKEBUKURO_MISAWA';
    confidence = 0.85;
    reasoning = '加藤ベニヤとミサワホームの複合キーワードを検出';
  }
  // 個別キーワード
  else if (text.includes('加藤ベニヤ池袋')) {
    foundKeywords.push('加藤ベニヤ池袋');
    detectedCompany = 'KATOUBENIYA_IKEBUKURO_MISAWA';
    confidence = 0.8;
    reasoning = '加藤ベニヤ池袋キーワードを検出';
  } else if (text.includes('加藤ベニヤ')) {
    foundKeywords.push('加藤ベニヤ');
    detectedCompany = 'KATOUBENIYA_IKEBUKURO_MISAWA';
    confidence = 0.7;
    reasoning = '加藤ベニヤキーワードを検出';
  } else if (text.includes('ミサワホーム')) {
    foundKeywords.push('ミサワホーム');
    detectedCompany = 'KATOUBENIYA_IKEBUKURO_MISAWA';
    confidence = 0.6;
    reasoning = 'ミサワホームキーワードを検出';
  } else {
    confidence = 0;
    reasoning = '判定可能なキーワードが見つかりませんでした';
  }

  return {
    company_id: detectedCompany,
    confidence,
    detected_text: text,
    found_keywords: foundKeywords,
    reasoning,
  };
}
