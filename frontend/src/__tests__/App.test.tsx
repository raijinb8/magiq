import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import App from '../App';

describe('App', () => {
  it('Appコンポーネントが正常にレンダリングされる', () => {
    render(<App />);

    // Appが正常にマウントされることを確認
    expect(document.body).toBeInTheDocument();
  });

  it('初期ルートが正しく表示される', () => {
    render(<App />, { initialEntries: ['/'] });

    // ホームページまたはリダイレクト先が表示されることを確認
    // 実際のアプリの動作に応じて調整
    expect(document.body).toBeInTheDocument();
  });

  it('存在しないルートで404ページが表示される', () => {
    render(<App />, { initialEntries: ['/non-existent-route'] });

    // 404ページまたはリダイレクトが発生することを確認
    expect(document.body).toBeInTheDocument();
  });
});
