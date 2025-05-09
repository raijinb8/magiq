// lib/api.ts
import { supabase } from './supabase'
import { getTargetShiftWeek } from '@/utils/getTargetShiftWeek'

export async function getSubmittedShiftsForCurrentUser(userId: string) {
  const dates = getTargetShiftWeek()

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .in('date', dates)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Supabase取得エラー:', error)
    return []
  }

  // 配列に any 型の明示を加える
  const uniqueByDate: any[] = Object.values(
    (data || []).reduce(
      (acc, curr) => {
        acc[curr.date] = acc[curr.date] || curr
        return acc
      },
      {} as Record<string, any>
    )
  )

  // date 昇順にソート
  uniqueByDate.sort((a, b) => a.date.localeCompare(b.date))

  return uniqueByDate
}
