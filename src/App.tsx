// 実際の画面本体（ルーティングやUIなど）
// 建物の中身や内装、設計
// ページのルーティング
// コンポーネントの表示
// 状態の取得・表示
// shadcn/ui や Tailwind で見た目を作る
// アプリを作るうえで一番手を入れるファイル

import { useCompanyStore } from './store/useCompanyStore'
import './App.css'

function App() {
  const company = useCompanyStore((state) => state.company)

  return (
    <div className="min-h-screen bg-purple-100 p-6">
      <h1 className="text-3xl font-bold text-purple-900">
        ようこそ、{company?.name ?? '未選択'}！
      </h1>
      <p className="mt-4 text-lg">会社ID: {company?.id}</p>
      {company?.showShiftForm && (
        <p className="mt-2 text-green-700">✅ この会社ではシフト申請が必要です</p>
      )}
    </div>
  )
}

export default App
