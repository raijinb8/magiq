// App.tsx または Layout.tsx の例
import { Header } from '@/components/layout/Header'
import { Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
