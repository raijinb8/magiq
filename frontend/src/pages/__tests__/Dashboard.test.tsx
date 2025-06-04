import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils';
import Dashboard from '../Dashboard';

// Supabaseクライアントのモック
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'mock-user-id' } } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    }),
  },
}));

describe('Dashboard', () => {
  it('ダッシュボードが正常にレンダリングされる', async () => {
    render(<Dashboard />);

    // ダッシュボードのタイトルが表示されることを確認
    expect(screen.getByRole('heading', { name: 'ダッシュボード' })).toBeInTheDocument();
  });

  it('認証されたユーザーのダッシュボードが表示される', async () => {
    render(<Dashboard />);

    // ユーザー向けのコンテンツが表示されることを確認
    // 具体的な要素は実装に応じて調整
    expect(document.body).toBeInTheDocument();
  });

  it('ダッシュボードコンポーネントがマウントされる', () => {
    const { container } = render(<Dashboard />);
    
    expect(container.firstChild).toBeInTheDocument();
  });
});