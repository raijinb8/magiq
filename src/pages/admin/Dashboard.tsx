// pages/admin/dashboard.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    todayProjects: 0,
    unassignedProjects: 0,
    pendingNotifications: 0,
  })

  useEffect(() => {
    const fetchSummary = async () => {
      const today = new Date().toISOString().split('T')[0]

      const [{ count: total }, { count: unassigned }, { count: unnotified }] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('date', today),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('date', today).is('assigned', null),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('date', today).eq('notified', false),
      ])

      setSummary({
        todayProjects: total || 0,
        unassignedProjects: unassigned || 0,
        pendingNotifications: unnotified || 0,
      })
    }
    fetchSummary()
  }, [])

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">管理者ダッシュボード</h1>

      <Card>
        <CardHeader>本日の現場数</CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{summary.todayProjects}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>未アサインの現場</CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-orange-500">{summary.unassignedProjects}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>未通知の現場</CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">{summary.pendingNotifications}</p>
        </CardContent>
      </Card>
    </div>
  )
}
