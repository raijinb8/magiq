import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// ブラウザ環境用のMSWワーカーを設定（開発環境でのデバッグなどで使用可能）
export const worker = setupWorker(...handlers);

// ブラウザでMSWを開始する関数
export async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Service Workerの登録とMSWの開始
  return worker.start({
    onUnhandledRequest: 'bypass', // 未処理のリクエストはそのまま通す
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
}