// components/dashboard/SubmissionStatusCard.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getSubmittedShiftsForCurrentUser } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { getWeekdayLabel, getShiftTypeLabel } from '@/utils/shiftHelpers'

export function SubmissionStatusCard() {
  // 仮データ（複数現場の例）
  const todayProjects = [
    { name: '現場A', client: '住友林業', reported_by: null, ky_reported_by: null },
    { name: '現場B', client: '積水', reported_by: '金谷', ky_reported_by: '佐藤' },
    { name: '現場C', client: '大和', reported_by: null, ky_reported_by: null },
    { name: '現場D', client: '積水', reported_by: null, ky_reported_by: null },
  ]

  // hasSubmittedShift: 今週のシフトが提出されたか？ を表す 状態（変数）
  // setHasSubmittedShift: その状態を 更新するための関数
  // useState(false): 初期値は「false（＝未提出）」ってこと
  const [hasSubmittedShift, setHasSubmittedShift] = useState(false)
  const [submittedShifts, setSubmittedShifts] = useState<any[]>([])

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return

      const shifts = await getSubmittedShiftsForCurrentUser(data.user.id)

      setHasSubmittedShift(shifts.length === 6)
      setSubmittedShifts(shifts)
    }

    fetchStatus()
  }, [])

  const sekisuiProjects = todayProjects.filter(p => p.client === '積水')
  const todayHasAdvanceRequest = false

  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      {/* 🗓 シフト提出状況 */}
      <Card>
        <CardHeader>
          <p className="text-sm font-medium">🗓 シフト提出状況</p>
        </CardHeader>
        <CardContent>
          {hasSubmittedShift ? (
            <>
              <p className="text-sm">
                今週分のシフトは <span className="font-bold text-green-600">提出済み</span> です。
              </p>
              {submittedShifts.length > 0 && (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-medium">🗓 今週提出したシフト内容</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {submittedShifts.map((shift, i) => (
                      <li key={i}>
                        {shift.date}（{getWeekdayLabel(shift.date)}）：
                        {getShiftTypeLabel(shift.shift_type, shift.custom_end_time)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">今週分のシフトが未提出です。</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/shift')}>
                シフトを提出する
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* 📸 KY画像提出（積水のみ） */}
      {sekisuiProjects.length > 0 && (
        <Card>
          <CardHeader>
            <p className="text-sm font-medium">📸 KY画像提出が必要な現場</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">以下の積水案件に対して、KY画像の提出が必要です。</p>
            <ul className="text-sm space-y-1">
              {sekisuiProjects.map((p, i) => (
                <li key={i} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    {p.ky_reported_by ? (
                      <span className="ml-2 text-xs text-green-600">（{p.ky_reported_by} が提出済）</span>
                    ) : (
                      <span className="ml-2 text-xs text-red-500">（未提出）</span>
                    )}
                  </div>
                  {!p.ky_reported_by && (
                    <Button size="sm" variant="default">
                      提出する
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 💰 内金申請 */}
      <Card>
        <CardHeader>
          <p className="text-sm font-medium">💰 内金申請</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayHasAdvanceRequest ? (
            <p className="text-sm text-muted-foreground">本日はすでに内金申請済みです。</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">必要な場合のみ、内金申請を行ってください。</p>
              <Button size="sm" variant="outline">
                内金を申請する
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* 📋 現場終了報告 */}
      <Card>
        <CardHeader>
          <p className="text-sm font-medium">📋 現場終了報告</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="text-sm space-y-1">
            {todayProjects.map((p, i) => (
              <li key={i} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{p.name}</span>
                  {p.reported_by ? (
                    <span className="ml-2 text-xs text-green-600">（{p.reported_by} が報告済）</span>
                  ) : (
                    <span className="ml-2 text-xs text-red-500">（未報告）</span>
                  )}
                </div>
                {!p.reported_by && (
                  <Button size="sm" variant="default">
                    報告する
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
