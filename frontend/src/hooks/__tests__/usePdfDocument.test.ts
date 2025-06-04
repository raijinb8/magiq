import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '../../test/utils';
import { usePdfDocument } from '../usePdfDocument';

describe('usePdfDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => usePdfDocument());

    expect(result.current.numPages).toBeNull();
    expect(typeof result.current.setNumPages).toBe('function');
    expect(typeof result.current.onDocumentLoadSuccess).toBe('function');
  });

  it('onDocumentLoadSuccess関数が正しく動作する', () => {
    const { result } = renderHook(() => usePdfDocument());

    act(() => {
      result.current.onDocumentLoadSuccess({ numPages: 5 });
    });

    expect(result.current.numPages).toBe(5);
  });

  it('onNewDocumentLoadedコールバックが呼び出される', () => {
    const onNewDocumentLoaded = vi.fn();
    const { result } = renderHook(() => usePdfDocument(onNewDocumentLoaded));

    act(() => {
      result.current.onDocumentLoadSuccess({ numPages: 3 });
    });

    expect(result.current.numPages).toBe(3);
    expect(onNewDocumentLoaded).toHaveBeenCalledTimes(1);
  });

  it('setNumPagesで直接ページ数を設定できる', () => {
    const { result } = renderHook(() => usePdfDocument());

    act(() => {
      result.current.setNumPages(10);
    });

    expect(result.current.numPages).toBe(10);
  });

  it('numPagesをnullにリセットできる', () => {
    const { result } = renderHook(() => usePdfDocument());

    // 最初にページ数を設定
    act(() => {
      result.current.setNumPages(5);
    });
    expect(result.current.numPages).toBe(5);

    // nullにリセット
    act(() => {
      result.current.setNumPages(null);
    });
    expect(result.current.numPages).toBeNull();
  });
});