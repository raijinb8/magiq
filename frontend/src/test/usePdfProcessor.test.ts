// src/test/usePdfProcessor.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  usePdfProcessor,
  type UsePdfProcessorProps,
} from '@/hooks/usePdfProcessor';
import type { CompanyOptionValue, PdfProcessSuccessResponse } from '@/types';
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
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      }),
    },
  },
}));

// Sonnerのモック
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('usePdfProcessor Hook', () => {
  let onSuccess: ReturnType<typeof vi.fn>;
  let onError: ReturnType<typeof vi.fn>;
  let mockFile: File;

  beforeEach(() => {
    vi.clearAllMocks();
    onSuccess = vi.fn();
    onError = vi.fn();
    mockFile = new File(['mock pdf content'], 'test.pdf', {
      type: 'application/pdf',
    });

    // モックファイルの作成
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  describe('基本機能', () => {
    it('正常にフックが初期化される', () => {
      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.processFile).toBe('function');
      expect(typeof result.current.setIsLoading).toBe('function');
    });

    it('会社IDが未選択で自動判定が無効の場合エラーになる', async () => {
      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      await result.current.processFile(
        mockFile,
        '' as CompanyOptionValue,
        'テスト会社',
        false, // enableAutoDetection = false
        false // ocrOnly = false
      );

      expect(onError).toHaveBeenCalledWith(
        '会社未選択',
        mockFile,
        'テスト会社'
      );
    });

    it('自動判定が有効な場合は会社未選択でも処理が継続される', async () => {
      const mockResponse: PdfProcessSuccessResponse = {
        generatedText: 'テスト手配書',
        identifiedCompany: 'NOHARA_G',
        originalFileName: 'test.pdf',
        promptUsedIdentifier: 'test-prompt',
        dbRecordId: 'test-uuid',
        detectionResult: {
          detectedCompanyId: 'NOHARA_G',
          confidence: 0.95,
          method: 'ocr_gemini',
          details: {
            foundKeywords: ['野原グループ株式会社'],
            geminiReasoning: 'テスト判定理由',
          },
        },
      };

      // 既存のハンドラーをリセットして新しいハンドラーを追加
      server.resetHandlers();
      server.use(
        http.post(
          'http://localhost:54321/functions/v1/process-pdf-single',
          ({ request }) => {
            console.log('MSW intercepted request:', request.url);
            console.log(
              'Authorization header:',
              request.headers.get('Authorization')
            );
            return HttpResponse.json(mockResponse);
          }
        )
      );

      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      await act(async () => {
        await result.current.processFile(
          mockFile,
          '' as CompanyOptionValue,
          'テスト会社',
          true, // enableAutoDetection = true
          false // ocrOnly = false
        );
      });

      await waitFor(
        () => {
          if (onError.mock.calls.length > 0) {
            console.log('onError was called with:', onError.mock.calls);
            throw new Error(
              `onError was called instead of onSuccess: ${JSON.stringify(onError.mock.calls)}`
            );
          }
          expect(onSuccess).toHaveBeenCalledWith(mockResponse, mockFile);
        },
        { timeout: 15000 }
      );
    });
  });

  describe('2段階処理（OCR専用）', () => {
    it('ocrOnly=trueの場合、適切なパラメーターでAPIを呼び出す', async () => {
      const mockOcrResponse: PdfProcessSuccessResponse = {
        generatedText: '',
        identifiedCompany: 'NOHARA_G',
        originalFileName: 'test.pdf',
        promptUsedIdentifier: 'ocr-prompt',
        dbRecordId: 'test-uuid',
        ocrOnly: true,
        fileName: 'test.pdf',
        detectionResult: {
          detectedCompanyId: 'NOHARA_G',
          confidence: 0.95,
          method: 'ocr_gemini',
          details: {
            foundKeywords: ['野原グループ株式会社'],
            geminiReasoning: 'OCR判定結果',
          },
        },
      };

      let capturedRequest: unknown = null;
      server.use(
        http.post('*/functions/v1/process-pdf-single', async ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json(mockOcrResponse);
        })
      );

      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      await act(async () => {
        await result.current.processFile(
          mockFile,
          '' as CompanyOptionValue,
          'OCR処理',
          true, // enableAutoDetection = true
          true // ocrOnly = true
        );
      });

      // リクエストの確認
      expect(capturedRequest).not.toBeNull();
      if (
        capturedRequest &&
        typeof capturedRequest === 'object' &&
        'formData' in capturedRequest
      ) {
        const request = capturedRequest as Request;
        const formData = await request.formData();
        expect(formData.get('ocrOnly')).toBe('true');
        expect(formData.get('enableAutoDetection')).toBe('true');
        expect(formData.get('companyId')).toBe('UNKNOWN_OR_NOT_SET');
      }

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockOcrResponse, mockFile);
      });
    });

    it('OCR処理の結果が適切に処理される', async () => {
      const mockOcrResponse: PdfProcessSuccessResponse = {
        generatedText: '',
        identifiedCompany: 'KATOUBENIYA_MISAWA',
        originalFileName: 'test.pdf',
        promptUsedIdentifier: 'ocr-prompt',
        dbRecordId: 'test-uuid',
        ocrOnly: true,
        fileName: 'test.pdf',
        detectionResult: {
          detectedCompanyId: 'KATOUBENIYA_MISAWA',
          confidence: 0.87,
          method: 'ocr_gemini',
          details: {
            foundKeywords: ['加藤ベニヤ', 'ミサワホーム'],
            geminiReasoning: '加藤ベニヤとミサワホームのキーワードを検出',
          },
        },
      };

      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.json(mockOcrResponse);
        })
      );

      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      await act(async () => {
        await result.current.processFile(
          mockFile,
          '' as CompanyOptionValue,
          'OCR処理',
          true,
          true
        );
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockOcrResponse, mockFile);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('APIエラー時に適切にエラーハンドリングする', async () => {
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.json(
            { error: 'Gemini API エラー' },
            { status: 500 }
          );
        })
      );

      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      await act(async () => {
        await result.current.processFile(
          mockFile,
          'NOHARA_G',
          '野原G住環境',
          false,
          false
        );
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          'Gemini API エラー',
          mockFile,
          '野原G住環境'
        );
      });
    });

    it('ネットワークエラー時に適切にエラーハンドリングする', async () => {
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.error();
        })
      );

      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      await act(async () => {
        await result.current.processFile(
          mockFile,
          'NOHARA_G',
          '野原G住環境',
          false,
          false
        );
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch'),
          mockFile,
          '野原G住環境'
        );
      });
    });

    it('自動判定失敗時の特別処理が動作する', async () => {
      server.use(
        http.post('*/functions/v1/process-pdf-single', () => {
          return HttpResponse.json(
            {
              error: '会社を判定できませんでした',
              detectionResult: {
                detectedCompanyId: null,
                confidence: 0.3,
                method: 'ocr_gemini',
                details: {
                  geminiReasoning: '判定可能なキーワードが見つかりませんでした',
                },
              },
            },
            { status: 400 }
          );
        })
      );

      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      await act(async () => {
        await result.current.processFile(
          mockFile,
          '' as CompanyOptionValue,
          '自動判定',
          true,
          true
        );
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          '会社を判定できませんでした',
          mockFile,
          '自動判定'
        );
      });
    });
  });

  describe('ローディング状態管理', () => {
    it('処理中はローディング状態が正しく管理される', async () => {
      let resolveHandler: (() => void) | null = null;

      server.use(
        http.post('*/functions/v1/process-pdf-single', async () => {
          await new Promise<void>((resolve) => {
            resolveHandler = resolve;
          });
          return HttpResponse.json({
            generatedText: 'テスト',
            identifiedCompany: 'NOHARA_G',
            originalFileName: 'test.pdf',
            promptUsedIdentifier: 'test',
            dbRecordId: 'test',
          });
        })
      );

      const props: UsePdfProcessorProps = { onSuccess, onError };
      const { result } = renderHook(() => usePdfProcessor(props));

      expect(result.current.isLoading).toBe(false);

      // 処理開始
      let processPromise: Promise<{ success: boolean; errorMessage?: string }>;
      await act(async () => {
        processPromise = result.current.processFile(
          mockFile,
          'NOHARA_G',
          '野原G住環境',
          false,
          false
        );
      });

      // ローディング状態になることを確認
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // 処理完了
      await act(async () => {
        resolveHandler?.();
        await processPromise!;
      });

      // ローディング状態が解除されることを確認
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
