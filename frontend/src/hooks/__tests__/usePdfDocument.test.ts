import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '../../../test/utils';
import { usePdfDocument } from '../usePdfDocument';

// PDF.jsのモック
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn().mockResolvedValue({
    promise: Promise.resolve({
      numPages: 3,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 595, height: 842 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
      }),
    }),
  }),
}));

describe('usePdfDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => usePdfDocument());

    expect(result.current.pdfDoc).toBeNull();
    expect(result.current.numPages).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('PDFファイルの読み込み関数が提供される', () => {
    const { result } = renderHook(() => usePdfDocument());

    expect(typeof result.current.loadPdf).toBe('function');
  });

  it('PDF読み込み中にローディング状態が更新される', async () => {
    const { result } = renderHook(() => usePdfDocument());
    const mockFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.loadPdf(mockFile);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('無効なファイルでエラーが設定される', async () => {
    const { result } = renderHook(() => usePdfDocument());
    const mockFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.loadPdf(mockFile);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });

  it('PDFドキュメントをクリアできる', () => {
    const { result } = renderHook(() => usePdfDocument());

    act(() => {
      result.current.clearPdf();
    });

    expect(result.current.pdfDoc).toBeNull();
    expect(result.current.numPages).toBe(0);
    expect(result.current.error).toBeNull();
  });
});