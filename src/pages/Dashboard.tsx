import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCompanyStore } from '@/store/useCompanyStore'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()
  const company = useCompanyStore(state => state.company)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!data.user) {
        navigate('/login')
      } else {
        setUser(data.user)
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  if (loading) return <div className="p-4">読み込み中...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">ようこそ、{user.email} さん</h1>
      <p>所属企業：{company?.name || '未設定'}</p>
      <p>企業ID：{company?.id}</p>
    </div>
  )
}
