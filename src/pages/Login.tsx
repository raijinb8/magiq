// src/pages/Login.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCompanyStore } from '@/store/useCompanyStore'
import activeConfig from '@/config/active.json' // 仮：ログイン後これを使う

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setCompany = useCompanyStore((s) => s.setCompany)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
    } else if (data.session) {
      // 仮：ログイン成功 → アクティブ社をセット（あとで自動化）
      setCompany(activeConfig)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">ログイン</h2>
        <Input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? 'ログイン中…' : 'ログイン'}
        </Button>
      </div>
    </div>
  )
}
