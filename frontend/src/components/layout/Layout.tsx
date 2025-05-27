// App.tsx または Layout.tsx の例
import { Header } from '@/components/layout/Header';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-muted/40">
      {/* bg-muted/40 はWorkOrderToolから移動または共通化 */}
      <Header />
      <main className="flex-1 overflow-hidden">
        {' '}
        {/* メインコンテンツが残りの高さを占有し、内部スクロールは各コンポーネントに委ねる */}
        <Outlet />{' '}
        {/* ここにWorkOrderToolなどのページコンポーネントがレンダリングされる */}
      </main>
      <Toaster richColors position="top-right" duration={5000} />
      {/* ここにフッターなどの共通レイアウト要素 */}
    </div>
  );
}

export default AppLayout;
