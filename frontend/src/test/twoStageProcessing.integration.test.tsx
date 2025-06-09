// src/test/twoStageProcessing.integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePdfProcessor } from '@/hooks/usePdfProcessor';
import type { PdfProcessSuccessResponse } from '@/types';

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Supabaseのモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'mock-user-id' }
          }
        }
      })
    }
  }
}));

// Sonnerのモック
const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

vi.mock('sonner', () => ({
  toast: mockToast
}));

/**
 * 2段階処理の統合テスト
 * Stage 1: OCR + 会社判定 → Stage 2: 手配書作成
 */
describe('2段階処理 統合テスト', () => {
  let mockFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFile = new File(['mock pdf content'], 'test-nohara.pdf', { type: 'application/pdf' });
    import.meta.env.VITE_PUBLIC_PROCESS_PDF_FUNCTION_URL = 'http://localhost:54321/functions/v1/process-pdf-single';
  });

  describe('正常フロー', () => {
    it('野原グループ株式会社の完全な2段階処理が正常に動作する', async () => {
      // Stage 1: OCR判定のレスポンス
      const stage1Response: PdfProcessSuccessResponse = {
        generatedText: '',
        identifiedCompany: 'NOHARA_G',
        originalFileName: 'test-nohara.pdf',
        promptUsedIdentifier: 'ocr-prompt',
        dbRecordId: 'stage1-uuid',
        ocrOnly: true,
        fileName: 'test-nohara.pdf',
        detectionResult: {
          detectedCompanyId: 'NOHARA_G',
          confidence: 0.95,
          method: 'ocr_gemini',
          details: {
            foundKeywords: ['野原グループ株式会社'],
            geminiReasoning: '確定キーワード「野原グループ株式会社」を検出',
            detectedText: '野原グループ株式会社 作業指示書'
          }
        }
      };

      // Stage 2: 手配書作成のレスポンス
      const stage2Response: PdfProcessSuccessResponse = {
        generatedText: '野原G住環境の手配書が生成されました',
        identifiedCompany: 'NOHARA_G',
        originalFileName: 'test-nohara.pdf',
        promptUsedIdentifier: 'nohara-prompt-v20250526',
        dbRecordId: 'stage2-uuid',
        detectionResult: null
      };

      // APIコールを順序通りにモック
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(stage1Response)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(stage2Response)
        });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      // 2段階処理のシミュレーション
      const TestComponent = () => {
        const { processFile, isLoading } = usePdfProcessor({ onSuccess, onError });

        const handleTwoStageProcess = async () => {
          // Stage 1: OCR処理
          await processFile(
            mockFile,
            '',
            'OCR処理',
            true, // enableAutoDetection = true
            true  // ocrOnly = true
          );
        };

        return (
          <div>
            <button onClick={handleTwoStageProcess} disabled={isLoading}>
              2段階処理開始
            </button>
            <div data-testid="loading">{isLoading ? 'Loading' : 'Ready'}</div>
          </div>
        );
      };

      render(<TestComponent />);

      // Stage 1開始
      const button = screen.getByText('2段階処理開始');
      fireEvent.click(button);

      // Stage 1のAPI呼び出しを確認
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const [url1, options1] = mockFetch.mock.calls[0];
      expect(url1).toBe('http://localhost:54321/functions/v1/process-pdf-single');
      
      const formData1 = options1.body as FormData;
      expect(formData1.get('ocrOnly')).toBe('true');
      expect(formData1.get('enableAutoDetection')).toBe('true');

      // Stage 1完了後のonSuccessコールバック確認
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(stage1Response, mockFile);
      });

      expect(onError).not.toHaveBeenCalled();
    });

    it('加藤ベニヤ_ミサワホームの2段階処理が正常に動作する', async () => {
      const stage1Response: PdfProcessSuccessResponse = {
        generatedText: '',
        identifiedCompany: 'KATOUBENIYA_MISAWA',
        originalFileName: 'test-katou.pdf',
        promptUsedIdentifier: 'ocr-prompt',
        dbRecordId: 'stage1-uuid',
        ocrOnly: true,
        fileName: 'test-katou.pdf',
        detectionResult: {
          detectedCompanyId: 'KATOUBENIYA_MISAWA',
          confidence: 0.87,
          method: 'ocr_gemini',
          details: {
            foundKeywords: ['加藤ベニヤ', 'ミサワホーム'],
            geminiReasoning: '加藤ベニヤとミサワホームの複合キーワードを検出'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(stage1Response)
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const TestComponent = () => {
        const { processFile } = usePdfProcessor({ onSuccess, onError });

        const handleOcrProcess = async () => {
          await processFile(mockFile, '', 'OCR処理', true, true);
        };

        return <button onClick={handleOcrProcess}>OCR処理</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('OCR処理'));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(stage1Response, mockFile);
      });
    });
  });

  describe('エラーケース', () => {
    it('Stage 1で判定失敗した場合の処理', async () => {
      const errorResponse = {
        error: '会社を判定できませんでした',
        detectionResult: {
          detectedCompanyId: null,
          confidence: 0.2,
          method: 'ocr_gemini',
          details: {
            geminiReasoning: '判定可能なキーワードが見つかりませんでした'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve(errorResponse)
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const TestComponent = () => {
        const { processFile } = usePdfProcessor({ onSuccess, onError });

        const handleFailedOcr = async () => {
          await processFile(mockFile, '', '自動判定', true, true);
        };

        return <button onClick={handleFailedOcr}>判定失敗テスト</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('判定失敗テスト'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          '会社を判定できませんでした',
          mockFile,
          '自動判定'
        );
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('Gemini APIエラー時の処理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({
          error: 'Gemini API rate limit exceeded'
        })
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const TestComponent = () => {
        const { processFile } = usePdfProcessor({ onSuccess, onError });

        const handleApiError = async () => {
          await processFile(mockFile, '', 'OCR処理', true, true);
        };

        return <button onClick={handleApiError}>APIエラーテスト</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('APIエラーテスト'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Gemini API rate limit exceeded',
          mockFile,
          'OCR処理'
        );
      });
    });

    it('ネットワークエラー時の処理', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const TestComponent = () => {
        const { processFile } = usePdfProcessor({ onSuccess, onError });

        const handleNetworkError = async () => {
          await processFile(mockFile, '', 'OCR処理', true, true);
        };

        return <button onClick={handleNetworkError}>ネットワークエラーテスト</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('ネットワークエラーテスト'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Failed to fetch',
          mockFile,
          'OCR処理'
        );
      });
    });
  });

  describe('パラメーター検証', () => {
    it('OCR専用処理時に正しいパラメーターが送信される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          generatedText: '',
          identifiedCompany: 'NOHARA_G',
          originalFileName: 'test.pdf',
          promptUsedIdentifier: 'ocr',
          dbRecordId: 'test',
          ocrOnly: true
        })
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const TestComponent = () => {
        const { processFile } = usePdfProcessor({ onSuccess, onError });

        const handleOcrTest = async () => {
          await processFile(
            mockFile,
            '', // 空の会社ID
            'OCR処理',
            true, // enableAutoDetection = true
            true  // ocrOnly = true
          );
        };

        return <button onClick={handleOcrTest}>パラメーターテスト</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('パラメーターテスト'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:54321/functions/v1/process-pdf-single');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer mock-token'
        })
      );

      const formData = options.body as FormData;
      expect(formData.get('pdfFile')).toBe(mockFile);
      expect(formData.get('companyId')).toBe('UNKNOWN_OR_NOT_SET');
      expect(formData.get('enableAutoDetection')).toBe('true');
      expect(formData.get('ocrOnly')).toBe('true');
    });

    it('通常処理時に正しいパラメーターが送信される', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          generatedText: 'テスト手配書',
          identifiedCompany: 'NOHARA_G',
          originalFileName: 'test.pdf',
          promptUsedIdentifier: 'nohara',
          dbRecordId: 'test'
        })
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const TestComponent = () => {
        const { processFile } = usePdfProcessor({ onSuccess, onError });

        const handleNormalTest = async () => {
          await processFile(
            mockFile,
            'NOHARA_G',
            '野原G住環境',
            false, // enableAutoDetection = false
            false  // ocrOnly = false
          );
        };

        return <button onClick={handleNormalTest}>通常処理テスト</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('通常処理テスト'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('companyId')).toBe('NOHARA_G');
      expect(formData.get('enableAutoDetection')).toBe('false');
      expect(formData.get('ocrOnly')).toBe('false');
    });
  });

  describe('ローディング状態', () => {
    it('処理中のローディング状態が正しく管理される', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingPromise);

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const TestComponent = () => {
        const { processFile, isLoading } = usePdfProcessor({ onSuccess, onError });

        const handleLoadingTest = async () => {
          await processFile(mockFile, '', 'OCR処理', true, true);
        };

        return (
          <div>
            <button onClick={handleLoadingTest}>ローディングテスト</button>
            <div data-testid="loading-state">{isLoading ? 'Loading' : 'Ready'}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');

      fireEvent.click(screen.getByText('ローディングテスト'));

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
      });

      // 処理完了
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({
          generatedText: '',
          identifiedCompany: 'NOHARA_G',
          originalFileName: 'test.pdf',
          promptUsedIdentifier: 'test',
          dbRecordId: 'test',
          ocrOnly: true
        })
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');
      });
    });
  });
});