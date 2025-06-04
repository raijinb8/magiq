// テスト環境のセットアップ
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import './mocks/server';

// jest-domのマッチャーを拡張
expect.extend(matchers);

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

// グローバルなモック設定
// window.matchMediaのモック（react-pdfで必要）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // 廃止予定
    removeListener: vi.fn(), // 廃止予定
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserverのモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// PDFワーカーのモック（react-pdf）
vi.mock('pdfjs-dist/build/pdf.worker.entry', () => ({
  default: vi.fn(),
}));

// 環境変数のモック
vi.stubEnv('VITE_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');