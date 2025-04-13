// 実際の画面本体（ルーティングやUIなど）
// 建物の中身や内装、設計
// ページのルーティング
// コンポーネントの表示
// 状態の取得・表示
// shadcn/ui や Tailwind で見た目を作る
// アプリを作るうえで一番手を入れるファイル

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
