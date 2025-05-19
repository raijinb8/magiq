// App.tsx または Layout.tsx の例
import { Header } from '@/components/layout/Header';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" duration={5000} />
      {/* ここにフッターなどの共通レイアウト要素 */}
    </div>
  );
}

export default AppLayout;
