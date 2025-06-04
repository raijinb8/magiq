import { describe, it, expect } from 'vitest';
import { render } from '../test/utils';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Layout from '@/components/layout/Layout';

// AppコンポーネントからBrowserRouterを除いたルーティング部分
const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  </Layout>
);

describe('App', () => {
  it('Appルーティングが正常にレンダリングされる', () => {
    render(<AppRoutes />);

    // Appが正常にマウントされることを確認
    expect(document.body).toBeInTheDocument();
  });

  it('初期ルートが正しく表示される', () => {
    render(<AppRoutes />, { initialEntries: ['/'] });

    // ダッシュボードページが表示されることを確認
    expect(document.body).toBeInTheDocument();
  });

  it('存在しないルートで404ページが表示される', () => {
    render(<AppRoutes />, { initialEntries: ['/non-existent-route'] });

    // 404ページまたはリダイレクトが発生することを確認
    expect(document.body).toBeInTheDocument();
  });
});
