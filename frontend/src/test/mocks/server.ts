// MSW サーバー設定（Node.js環境用）
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// モックサーバーのセットアップ
export const server = setupServer(...handlers);

// テスト実行前にサーバーを起動
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// 各テスト後にハンドラーをリセット
afterEach(() => server.resetHandlers());

// すべてのテスト完了後にサーバーを停止
afterAll(() => server.close());