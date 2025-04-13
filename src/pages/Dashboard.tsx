import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Button onClick={handleLogout} variant="outline">
          ログアウト
        </Button>
      </div>

      {/* 他の表示内容 */}
      <p>ここに会社情報や提出フォームなどを追加していく</p>
    </div>
  )
}
