import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function ProjectForm() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('現場情報を入力してください')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)
    const { error } = await supabase.from('projects').insert({ text })
    setLoading(false)
    if (error) {
      setError('登録に失敗しました')
    } else {
      setText('')
      setSuccess(true)
    }
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">現場情報を登録</h2>
      <Textarea value={text} onChange={e => setText(e.target.value)} rows={10} placeholder="ここにコピペしてください" />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">登録が完了しました！</p>}
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? '登録中...' : '登録する'}
      </Button>
    </div>
  )
}
