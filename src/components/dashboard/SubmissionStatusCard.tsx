// components/dashboard/SubmissionStatusCard.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SubmissionStatusCard() {
  // 仮データ（複数現場の例）
  const todayProjects = [
    { name: '現場A', client: '住友林業', reported_by: null, ky_reported_by: null },
    { name: '現場B', client: '積水', reported_by: '金谷', ky_reported_by: '佐藤' },
    { name: '現場C', client: '大和', reported_by: null, ky_reported_by: null },
    { name: '現場D', client: '積水', reported_by: null, ky_reported_by: null },
  ]

  const sekisuiProjects = todayProjects.filter(p => p.client === '積水')
  const todayHasAdvanceRequest = false
  const hasSubmittedShift = true

  return (
    <div className="space-y-4">
      {/* 🗓 シフト提出状況 */}
      <Card>
        <CardHeader>
          <p className="text-sm font-medium">🗓 シフト提出状況</p>
        </CardHeader>
        <CardContent>
          {hasSubmittedShift ? (
            <p className="text-sm">
              今週分のシフトは <span className="font-bold text-green-600">提出済み</span> です。
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                今週分のシフトが未提出です。
              </p>
              <Button variant="outline" size="sm">シフトを提出する</Button>
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
            <p className="text-sm text-muted-foreground">
              以下の積水案件に対して、KY画像の提出が必要です。
            </p>
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
                    <Button size="sm" variant="default">提出する</Button>
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
            <p className="text-sm text-muted-foreground">
              本日はすでに内金申請済みです。
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                必要な場合のみ、内金申請を行ってください。
              </p>
              <Button size="sm" variant="outline">内金を申請する</Button>
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
                  <Button size="sm" variant="default">報告する</Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}