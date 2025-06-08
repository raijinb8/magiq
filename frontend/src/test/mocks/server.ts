import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { handlers } from './handlers';

// テスト環境用のMSWサーバーを設定
export const server = setupServer(...handlers);

// テストのライフサイクルイベントを設定
export function setupMSW() {
  // すべてのテストの前にサーバーを起動
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: 'warn', // 未処理のリクエストを警告として表示
    });
  });

  // 各テストの後にハンドラーをリセット
  afterEach(() => {
    server.resetHandlers();
  });

  // すべてのテストの後にサーバーを停止
  afterAll(() => {
    server.close();
  });
}

// テスト内で一時的にハンドラーを追加/上書きするヘルパー関数
export function mockApiResponse(handler: Parameters<typeof server.use>[0]) {
  server.use(handler);
}