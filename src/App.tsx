// 実際の画面本体（ルーティングやUIなど）
// 建物の中身や内装、設計
// ページのルーティング
// コンポーネントの表示
// 状態の取得・表示
// shadcn/ui や Tailwind で見た目を作る
// アプリを作るうえで一番手を入れるファイル

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
import ShiftForm from '@/pages/ShiftForm'
import Login from '@/pages/Login'
import Layout from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* その他のページは共通レイアウトに包む */}
        <Route path="/login" element={<Login />} />

        {/* 認証必須のルート */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shift" element={<ShiftForm />} />
            {/* 他ページ追加可能 */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
