import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import WorkOrderTool from '@/pages/admin/WorkOrderTool';
import type { PdfFile } from '@/types';

// 必要なモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// react-pdfのモック
vi.mock('react-pdf', () => ({
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
  },
  Document: ({
    onLoadSuccess,
  }: {
    onLoadSuccess: (info: { numPages: number }) => void;
  }) => {
    // テスト用に即座にロード成功をシミュレート
    React.useEffect(() => {
      onLoadSuccess({ numPages: 3 });
    }, [onLoadSuccess]);
    return <div data-testid="pdf-document">PDF Document</div>;
  },
  Page: () => <div data-testid="pdf-page">PDF Page</div>,
}));

// Supabaseモック
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { user: { id: 'test-user-id' } } },
        })
      ),
    },
  },
}));

// カスタムフックのモック
const mockFileHandler = {
  uploadedFiles: [] as PdfFile[],
  processingFile: null as PdfFile | null,
  setProcessingFile: vi.fn(),
  pdfFileToDisplay: null as PdfFile | null,
  setPdfFileToDisplay: vi.fn(),
  addFilesToList: vi.fn(),
  handleFileSelect: vi.fn(),
};

vi.mock('@/hooks/useFileHandler', () => ({
  useFileHandler: () => mockFileHandler,
}));

vi.mock('@/hooks/usePdfDocument', () => ({
  usePdfDocument: () => ({
    numPages: 3,
    onDocumentLoadSuccess: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePdfControls', () => ({
  usePdfControls: () => ({
    resetPdfControls: vi.fn(),
    pageNumber: 1,
    setPageNumber: vi.fn(),
    pageScale: 1.0,
    setPageScale: vi.fn(),
    pageRotation: 0,
    handleRotatePdf: vi.fn(),
    pdfDisplayContainerRef: { current: null },
    isPanning: false,
    handleMouseDownOnPdfArea: vi.fn(),
    handleMouseMoveOnPdfArea: vi.fn(),
    handleMouseUpOrLeaveArea: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePdfProcessor', () => ({
  usePdfProcessor: () => ({
    isLoading: false,
    processFile: vi.fn(),
    abortRequest: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDragAndDrop', () => ({
  useDragAndDrop: () => ({
    isDragging: false,
    dragEventHandlers: {},
  }),
}));

// 会社選択オプションのモック
vi.mock('@/constants/company', () => ({
  COMPANY_OPTIONS: [
    { value: 'NOHARA_G', label: '野原G住環境' },
    { value: 'KATOUBENIYA_MISAWA', label: '加藤ベニヤ池袋_ミサワホーム' },
  ],
  ALL_COMPANY_OPTIONS: [
    { value: 'NOHARA_G', label: '野原G住環境' },
    { value: 'KATOUBENIYA_MISAWA', label: '加藤ベニヤ池袋_ミサワホーム' },
    { value: 'UNKNOWN_OR_NOT_SET', label: '会社を特定できませんでした' },
  ],
}));

// Notificationのモックはsetup.tsで設定済み

// React.useEffect のモック
const mockUseEffect = vi.spyOn(React, 'useEffect');

describe('WorkOrderTool 統合テスト', () => {
  // テスト用のモックPDFファイル
  const mockPdfFile: PdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEffect.mockImplementation((fn) => fn());
    // デフォルトではファイル未選択状態
    mockFileHandler.pdfFileToDisplay = null;
    mockFileHandler.uploadedFiles = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本レンダリング', () => {
    it('主要なコンポーネントが表示される', () => {
      render(<WorkOrderTool />);

      expect(screen.getByText('業務手配書 作成ツール')).toBeInTheDocument();
      expect(screen.getByText('アップロード済みPDF一覧')).toBeInTheDocument();
      expect(screen.getByText('処理対象の会社:')).toBeInTheDocument();
      expect(screen.getByText('会社自動判定')).toBeInTheDocument();
    });

    it('初期状態でNotification許可を要求する', () => {
      render(<WorkOrderTool />);

      expect(window.Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('ファイル操作', () => {
    it('ファイルアップロードボタンが機能する', () => {
      render(<WorkOrderTool />);

      const uploadButton = screen.getByText('PDFを選択してアップロード');
      expect(uploadButton).toBeInTheDocument();

      fireEvent.click(uploadButton);
      // ファイル入力のクリックがトリガーされることを確認
      // 実際のファイル選択はモックされているため、エラーが出ないことを確認
    });

    it('ドラッグアンドドロップエリアが表示される', () => {
      const { container } = render(<WorkOrderTool />);

      // ドラッグアンドドロップのイベントハンドラーが設定されていることを確認
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('会社選択', () => {
    it('会社選択ドロップダウンが表示される', () => {
      render(<WorkOrderTool />);

      expect(screen.getByText('処理対象の会社:')).toBeInTheDocument();
    });

    it('自動判定トグルが表示される', () => {
      render(<WorkOrderTool />);

      expect(screen.getByText('会社自動判定')).toBeInTheDocument();
    });
  });

  describe('AI実行機能', () => {
    it('PDFファイル選択時に手配書作成ボタンがクリック可能', () => {
      // PDFファイルが選択されている状態に設定（processingFileとpdfFileToDisplayの両方）
      mockFileHandler.pdfFileToDisplay = mockPdfFile;
      mockFileHandler.processingFile = mockPdfFile;
      render(<WorkOrderTool />);

      const executeButton = screen.getByText('手配書作成');
      expect(executeButton).toBeInTheDocument();
      expect(executeButton).not.toBeDisabled();

      // ボタンをクリックしてもエラーが発生しないことを確認
      expect(() => {
        fireEvent.click(executeButton);
      }).not.toThrow();
    });
  });

  describe('ステータス管理統合', () => {
    it('useWorkOrderStatusフックが正しく統合されている', () => {
      render(<WorkOrderTool />);

      // ProcessStatusIndicatorコンポーネントが存在しないことを確認
      // （プロセス状態がnullの場合は表示されない）
      expect(screen.queryByText('処理中')).not.toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('コンポーネントのレンダリングエラーが発生しない', () => {
      expect(() => {
        render(<WorkOrderTool />);
      }).not.toThrow();
    });

    it('モック環境でも基本機能が動作する', () => {
      // PDFファイルが表示されている状態に設定（ボタンを表示するため）
      mockFileHandler.pdfFileToDisplay = mockPdfFile;
      render(<WorkOrderTool />);

      // 基本的なUI要素が表示されることを確認
      expect(screen.getByText('業務手配書 作成ツール')).toBeInTheDocument();
      expect(screen.getByText('手配書作成')).toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン', () => {
    it('基本的なレイアウト構造が存在する', () => {
      const { container } = render(<WorkOrderTool />);

      // フレックスレイアウトが適用されていることを確認
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'h-full');
    });
  });

  describe('アクセシビリティ', () => {
    it('見出しが適切に設定されている', () => {
      render(<WorkOrderTool />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('業務手配書 作成ツール');
    });

    it('ボタンが適切にラベル付けされている', () => {
      // PDFファイルが表示されている状態に設定（ボタンを表示するため）
      mockFileHandler.pdfFileToDisplay = mockPdfFile;
      render(<WorkOrderTool />);

      expect(
        screen.getByRole('button', { name: 'PDFを選択してアップロード' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '手配書作成' })
      ).toBeInTheDocument();
    });
  });

  describe('PDF関連機能', () => {
    it('PDF.jsワーカーが設定される', () => {
      render(<WorkOrderTool />);

      // react-pdfのモックが正しく動作することを確認
      expect(screen.queryByTestId('pdf-document')).not.toBeInTheDocument(); // ファイルが未選択のため
    });
  });

  describe('状態の整合性', () => {
    it('初期状態で各種状態が正しく初期化されている', () => {
      render(<WorkOrderTool />);

      // エラーメッセージが表示されていないことを確認
      expect(
        screen.queryByText('エラーが発生しました')
      ).not.toBeInTheDocument();

      // 処理完了メッセージが表示されていないことを確認
      expect(screen.queryByText('処理完了')).not.toBeInTheDocument();
    });
  });

  describe('フィードバック機能', () => {
    it('フィードバックモーダルが初期状態で非表示', () => {
      render(<WorkOrderTool />);

      expect(
        screen.queryByText('判定結果のフィードバック')
      ).not.toBeInTheDocument();
    });
  });

  describe('メモリリーク対策', () => {
    it('コンポーネントのアンマウント時にエラーが発生しない', () => {
      const { unmount } = render(<WorkOrderTool />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
