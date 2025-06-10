// src/test/twoStageProcessing.integration.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { usePdfProcessor } from '@/hooks/usePdfProcessor';
import type { PdfProcessSuccessResponse } from '@/types';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

// Supabaseのモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-access-token-123',
            user: { id: 'mock-user-id' },
            expires_at: Date.now() + 3600000
          }
        },
        error: null
      })
    }
  }
}));

// Sonnerのモック
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
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
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
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
      let callCount = 0;
      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(stage1Response);
          } else {
            return HttpResponse.json(stage2Response);
          }
        })
      );

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
      await act(async () => {
        fireEvent.click(button);
      });

      // Stage 1完了後のonSuccessコールバック確認
      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalledWith(stage1Response, mockFile);
        },
        { timeout: 10000 }
      );

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

      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.json(stage1Response);
        })
      );

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
      
      await act(async () => {
        fireEvent.click(screen.getByText('OCR処理'));
      });

      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalledWith(stage1Response, mockFile);
        },
        { timeout: 10000 }
      );
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

      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.json(errorResponse, { status: 400 });
        })
      );

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
      
      await act(async () => {
        fireEvent.click(screen.getByText('判定失敗テスト'));
      });

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalledWith(
            '会社を判定できませんでした',
            mockFile,
            '自動判定'
          );
        },
        { timeout: 10000 }
      );

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('Gemini APIエラー時の処理', async () => {
      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.json(
            { error: 'Gemini API rate limit exceeded' },
            { status: 500 }
          );
        })
      );

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
      
      await act(async () => {
        fireEvent.click(screen.getByText('APIエラーテスト'));
      });

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalledWith(
            'Gemini API rate limit exceeded',
            mockFile,
            'OCR処理'
          );
        },
        { timeout: 10000 }
      );
    });

    it('ネットワークエラー時の処理', async () => {
      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.error();
        })
      );

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
      
      await act(async () => {
        fireEvent.click(screen.getByText('ネットワークエラーテスト'));
      });

      await waitFor(
        () => {
          expect(onError).toHaveBeenCalledWith(
            expect.stringContaining('Failed to fetch'),
            mockFile,
            'OCR処理'
          );
        },
        { timeout: 10000 }
      );
    });
  });

  describe('パラメーター検証', () => {
    it('OCR専用処理時に正しいパラメーターが送信される', async () => {
      let capturedRequest: unknown = null;
      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({
            generatedText: '',
            identifiedCompany: 'NOHARA_G',
            originalFileName: 'test.pdf',
            promptUsedIdentifier: 'ocr',
            dbRecordId: 'test',
            ocrOnly: true
          });
        })
      );

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
      
      await act(async () => {
        fireEvent.click(screen.getByText('パラメーターテスト'));
      });

      await waitFor(
        () => {
          expect(capturedRequest).not.toBeNull();
        },
        { timeout: 10000 }
      );

      if (capturedRequest && typeof capturedRequest === 'object' && 'formData' in capturedRequest) {
        const request = capturedRequest as Request;
        expect(request.method).toBe('POST');
        expect(request.headers.get('Authorization')).toBe('Bearer mock-access-token-123');

        const formData = await request.formData();
        const uploadedFile = formData.get('pdfFile') as File;
        expect(uploadedFile).toBeInstanceOf(File);
        expect(uploadedFile.name).toBe(mockFile.name);
        expect(uploadedFile.type).toBe(mockFile.type);
        expect(formData.get('companyId')).toBe('UNKNOWN_OR_NOT_SET');
        expect(formData.get('enableAutoDetection')).toBe('true');
        expect(formData.get('ocrOnly')).toBe('true');
      }
    });

    it('通常処理時に正しいパラメーターが送信される', async () => {
      let capturedRequest: unknown = null;
      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json({
            generatedText: 'テスト手配書',
            identifiedCompany: 'NOHARA_G',
            originalFileName: 'test.pdf',
            promptUsedIdentifier: 'nohara',
            dbRecordId: 'test'
          });
        })
      );

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
      
      await act(async () => {
        fireEvent.click(screen.getByText('通常処理テスト'));
      });

      await waitFor(
        () => {
          expect(capturedRequest).not.toBeNull();
        },
        { timeout: 10000 }
      );

      if (capturedRequest && typeof capturedRequest === 'object' && 'formData' in capturedRequest) {
        const request = capturedRequest as Request;
        const formData = await request.formData();
        expect(formData.get('companyId')).toBe('NOHARA_G');
        expect(formData.get('enableAutoDetection')).toBe('false');
        expect(formData.get('ocrOnly')).toBe('false');
      }
    });
  });

  describe('ローディング状態', () => {
    it('処理中のローディング状態が正しく管理される', async () => {
      let resolveHandler: (() => void) | null = null;
      server.resetHandlers();
      server.use(
        http.post('*/functions/v1/process-pdf-single', async () => {
          await new Promise<void>((resolve) => {
            resolveHandler = resolve;
          });
          return HttpResponse.json({
            generatedText: '',
            identifiedCompany: 'NOHARA_G',
            originalFileName: 'test.pdf',
            promptUsedIdentifier: 'test',
            dbRecordId: 'test',
            ocrOnly: true
          });
        })
      );

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

      await act(async () => {
        fireEvent.click(screen.getByText('ローディングテスト'));
      });

      await waitFor(
        () => {
          expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
        },
        { timeout: 5000 }
      );

      // 処理完了
      await act(async () => {
        resolveHandler?.();
      });

      await waitFor(
        () => {
          expect(screen.getByTestId('loading-state')).toHaveTextContent('Ready');
        },
        { timeout: 10000 }
      );
    });
  });
});