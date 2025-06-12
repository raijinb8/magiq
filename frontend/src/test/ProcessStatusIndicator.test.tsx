import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProcessStatusIndicator } from '@/components/workOrderTool/ProcessStatusIndicator'
import type { ProcessState } from '@/types'

describe('ProcessStatusIndicator', () => {
  const mockOnCancel = vi.fn()

  const createMockProcessState = (
    status: ProcessState['status'],
    canCancel: boolean = false,
    errorDetail?: string
  ): ProcessState => ({
    status,
    currentStep: `${status} step`,
    startTime: new Date('2025-01-01T00:00:00Z'),
    canCancel,
    errorDetail,
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllTimers()
    mockOnCancel.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基本レンダリング', () => {
    it('待機中ステータスが正しく表示される', () => {
      const processState = createMockProcessState('waiting')
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.getByText('⏳')).toBeInTheDocument()
      expect(screen.getByText('waiting step')).toBeInTheDocument()
    })

    it('OCR処理中ステータスが正しく表示される', () => {
      const processState = createMockProcessState('ocr_processing')
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.getByText('🔍')).toBeInTheDocument()
      expect(screen.getByText('ocr_processing step')).toBeInTheDocument()
    })

    it('文書作成中ステータスが正しく表示される', () => {
      const processState = createMockProcessState('document_creating')
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.getByText('📝')).toBeInTheDocument()
      expect(screen.getByText('document_creating step')).toBeInTheDocument()
    })

    it('完了ステータスが正しく表示される', () => {
      const processState = createMockProcessState('completed')
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.getByText('✅')).toBeInTheDocument()
      expect(screen.getByText('completed step')).toBeInTheDocument()
    })

    it('エラーステータスが正しく表示される', () => {
      const processState = createMockProcessState('error', false, 'Something went wrong')
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.getByText('❌')).toBeInTheDocument()
      expect(screen.getByText('error step')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('キャンセルステータスが正しく表示される', () => {
      const processState = createMockProcessState('cancelled')
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.getByText('⏹️')).toBeInTheDocument()
      expect(screen.getByText('cancelled step')).toBeInTheDocument()
    })
  })

  describe('タイマー機能', () => {
    it('タイマー要素が表示される', () => {
      const processState = createMockProcessState('ocr_processing')
      const { container } = render(<ProcessStatusIndicator processState={processState} />)

      // タイマー表示用のspan要素が存在することを確認
      const timerElement = container.querySelector('.text-xs.font-mono')
      expect(timerElement).toBeInTheDocument()
      expect(timerElement).toHaveTextContent(/\d+:\d{2}/)
    })

    it('処理中以外の状態でもタイマーが表示される', () => {
      const processState = createMockProcessState('completed')
      const { container } = render(<ProcessStatusIndicator processState={processState} />)

      const timerElement = container.querySelector('.text-xs.font-mono')
      expect(timerElement).toBeInTheDocument()
    })
  })

  describe('キャンセルボタン', () => {
    it('キャンセル可能な状態でボタンが表示される', () => {
      const processState = createMockProcessState('ocr_processing', true)
      render(
        <ProcessStatusIndicator 
          processState={processState} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByText('中断')).toBeInTheDocument()
    })

    it('キャンセル不可能な状態でボタンが表示されない', () => {
      const processState = createMockProcessState('ocr_processing', false)
      render(
        <ProcessStatusIndicator 
          processState={processState} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.queryByText('中断')).not.toBeInTheDocument()
    })

    it('完了状態でボタンが表示されない', () => {
      const processState = createMockProcessState('completed', true)
      render(
        <ProcessStatusIndicator 
          processState={processState} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.queryByText('中断')).not.toBeInTheDocument()
    })

    it('キャンセルボタンクリック時にonCancelが呼ばれる', () => {
      const processState = createMockProcessState('ocr_processing', true)
      render(
        <ProcessStatusIndicator 
          processState={processState} 
          onCancel={mockOnCancel} 
        />
      )

      fireEvent.click(screen.getByText('中断'))
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('onCancelが未定義でもエラーが発生しない', () => {
      const processState = createMockProcessState('ocr_processing', true)
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.queryByText('中断')).not.toBeInTheDocument()
    })
  })

  describe('ステップドット表示', () => {
    it('正常な処理状態でドットが表示される', () => {
      const processState = createMockProcessState('ocr_processing')
      const { container } = render(<ProcessStatusIndicator processState={processState} />)

      // ドットコンテナが存在することを確認
      const dotContainer = container.querySelector('.flex.items-center.justify-between.flex-1.mx-2')
      expect(dotContainer).toBeInTheDocument()
    })

    it('エラー状態でドットが表示されない', () => {
      const processState = createMockProcessState('error')
      const { container } = render(<ProcessStatusIndicator processState={processState} />)

      const dotContainer = container.querySelector('.flex.items-center.justify-between.flex-1.mx-2')
      expect(dotContainer).not.toBeInTheDocument()
    })

    it('キャンセル状態でドットが表示されない', () => {
      const processState = createMockProcessState('cancelled')
      const { container } = render(<ProcessStatusIndicator processState={processState} />)

      const dotContainer = container.querySelector('.flex.items-center.justify-between.flex-1.mx-2')
      expect(dotContainer).not.toBeInTheDocument()
    })
  })

  describe('カスタムクラス', () => {
    it('カスタムクラスが正しく適用される', () => {
      const processState = createMockProcessState('waiting')
      const { container } = render(
        <ProcessStatusIndicator 
          processState={processState} 
          className="custom-class" 
        />
      )

      const rootElement = container.firstChild as HTMLElement
      expect(rootElement).toHaveClass('custom-class')
    })
  })

  describe('エラー詳細表示', () => {
    it('エラー詳細が存在する場合に表示される', () => {
      const processState = createMockProcessState('error', false, 'Detailed error message')
      render(<ProcessStatusIndicator processState={processState} />)

      expect(screen.getByText('Detailed error message')).toBeInTheDocument()
    })

    it('エラー詳細が存在しない場合は表示されない', () => {
      const processState = createMockProcessState('error')
      const { container } = render(<ProcessStatusIndicator processState={processState} />)

      const errorDetail = container.querySelector('.text-xs.text-red-700')
      expect(errorDetail).not.toBeInTheDocument()
    })

    it('エラー状態以外ではエラー詳細が表示されない', () => {
      const processState = createMockProcessState('completed', false, 'Some detail')
      const { container } = render(<ProcessStatusIndicator processState={processState} />)

      const errorDetail = container.querySelector('.text-xs.text-red-700')
      expect(errorDetail).not.toBeInTheDocument()
    })
  })
})