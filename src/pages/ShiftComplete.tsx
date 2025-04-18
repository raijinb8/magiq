// src/pages/ShiftComplete.tsx
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function ShiftComplete() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
      <h1 className="text-2xl font-bold text-green-600">✅ シフト申請が完了しました！</h1>
      <Button onClick={() => navigate('/dashboard')}>ダッシュボードへ戻る</Button>
    </div>
  )
}
