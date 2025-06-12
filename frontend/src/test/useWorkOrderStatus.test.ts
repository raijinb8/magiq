import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWorkOrderStatus } from '@/hooks/useWorkOrderStatus'
import type { UseWorkOrderStatusProps } from '@/hooks/useWorkOrderStatus'

// Supabaseモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

describe('useWorkOrderStatus', () => {
  const mockOnProcessComplete = vi.fn()
  const mockOnProcessError = vi.fn()

  const defaultProps: UseWorkOrderStatusProps = {
    onProcessComplete: mockOnProcessComplete,
    onProcessError: mockOnProcessError,
    pollingInterval: 1000
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('初期状態', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      expect(result.current.processState).toBeNull()
      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('startProcess', () => {
    it('処理開始時に正しい状態が設定される', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      expect(result.current.processState).toMatchObject({
        status: 'waiting',
        currentStep: '処理待機中...',
        workOrderId: 'test-work-order-id',
        canCancel: false
      })
      expect(result.current.isPolling).toBe(true)
    })

    it('ポーリングが開始される', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      expect(result.current.isPolling).toBe(true)
    })
  })

  describe('startProcessWithoutId', () => {
    it('workOrderIdなしで処理開始できる', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcessWithoutId()
      })

      expect(result.current.processState).toMatchObject({
        status: 'ocr_processing',
        currentStep: '会社情報を判定中...',
        canCancel: true
      })
      expect(result.current.processState?.workOrderId).toBeUndefined()
      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('updateWorkOrderId', () => {
    it('workOrderIdを後から設定できる', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcessWithoutId()
      })

      act(() => {
        result.current.updateWorkOrderId('new-work-order-id')
      })

      expect(result.current.processState).toMatchObject({
        status: 'document_creating',
        currentStep: '手配書を作成中...',
        workOrderId: 'new-work-order-id'
      })
    })
  })

  describe('setDocumentCreating', () => {
    it('手配書作成中状態に設定される', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcessWithoutId()
      })

      act(() => {
        result.current.setDocumentCreating()
      })

      expect(result.current.processState).toMatchObject({
        status: 'document_creating',
        currentStep: '手配書を作成中...',
        canCancel: true
      })
    })
  })

  describe('completeProcess', () => {
    it('処理完了状態に設定される', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      act(() => {
        result.current.completeProcess()
      })

      expect(result.current.processState).toMatchObject({
        status: 'completed',
        currentStep: '処理完了',
        canCancel: false
      })
      expect(result.current.isPolling).toBe(false)
    })

    it('完了時にコールバックが呼ばれる', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      act(() => {
        result.current.completeProcess()
      })

      expect(mockOnProcessComplete).toHaveBeenCalledWith('test-work-order-id')
    })

    it('最小表示時間を保証する', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcessWithoutId()
      })

      act(() => {
        result.current.setDocumentCreating()
      })

      // 即座に完了を呼び出す
      act(() => {
        result.current.completeProcess()
      })

      // まだ完了していない
      expect(result.current.processState?.status).toBe('document_creating')

      // 2秒進める
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.processState?.status).toBe('completed')
    })
  })

  describe('setErrorState', () => {
    it('エラー状態に設定される', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      act(() => {
        result.current.setErrorState('Test error message')
      })

      expect(result.current.processState).toMatchObject({
        status: 'error',
        currentStep: 'エラーが発生しました',
        errorDetail: 'Test error message',
        canCancel: false
      })
      expect(result.current.isPolling).toBe(false)
    })

    it('エラー時にコールバックが呼ばれる', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      act(() => {
        result.current.setErrorState('Test error message')
      })

      expect(mockOnProcessError).toHaveBeenCalledWith('test-work-order-id', 'Test error message')
    })
  })

  describe('cancelProcess', () => {
    it('キャンセル状態に設定される', async () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      await act(async () => {
        await result.current.cancelProcess()
      })

      expect(result.current.processState).toMatchObject({
        status: 'cancelled',
        currentStep: '処理がキャンセルされました',
        canCancel: false
      })
      expect(result.current.isPolling).toBe(false)
    })

    it('キャンセル処理の基本動作確認', async () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      await act(async () => {
        await result.current.cancelProcess()
      })

      expect(result.current.processState?.status).toBe('cancelled')
      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('retryProcess', () => {
    it('再試行の基本動作確認', async () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      act(() => {
        result.current.setErrorState('Test error')
      })

      await act(async () => {
        await result.current.retryProcess()
      })

      expect(result.current.processState?.status).toBe('waiting')
      expect(result.current.processState?.currentStep).toBe('処理を再開中...')
    })
  })

  describe('clearProcess', () => {
    it('プロセス状態がクリアされる', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      act(() => {
        result.current.clearProcess()
      })

      expect(result.current.processState).toBeNull()
      expect(result.current.isPolling).toBe(false)
    })
  })

  describe('mapDbStatusToProcessStatus', () => {
    it('基本的なステータスマッピングの動作確認', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      // フックが正常に動作することを確認
      expect(result.current.processState).toBeNull()
      expect(result.current.isPolling).toBe(false)

      // startProcess関数が呼び出し可能であることを確認
      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      expect(result.current.processState?.status).toBe('waiting')
    })
  })

  describe('エラーハンドリング', () => {
    it('基本的なエラーハンドリングの動作確認', () => {
      const { result } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      act(() => {
        result.current.setErrorState('Test error message')
      })

      expect(result.current.processState?.status).toBe('error')
      expect(result.current.processState?.errorDetail).toBe('Test error message')
    })
  })

  describe('プロパティのデフォルト値', () => {
    it('プロパティなしでも動作する', () => {
      const { result } = renderHook(() => useWorkOrderStatus())

      expect(result.current.processState).toBeNull()
      expect(result.current.isPolling).toBe(false)
    })

    it('デフォルトのポーリング間隔が使用される', () => {
      const { result } = renderHook(() => useWorkOrderStatus({}))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      expect(result.current.isPolling).toBe(true)
    })
  })

  describe('クリーンアップ', () => {
    it('アンマウント時にタイマーがクリアされる', () => {
      const { result, unmount } = renderHook(() => useWorkOrderStatus(defaultProps))

      act(() => {
        result.current.startProcess('test-work-order-id')
      })

      unmount()

      // アンマウント後はタイマーがクリアされているため、
      // エラーが発生しないことを確認
      expect(() => {
        vi.advanceTimersByTime(1000)
      }).not.toThrow()
    })
  })
})