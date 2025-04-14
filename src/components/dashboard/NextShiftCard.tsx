// components/dashboard/NextShiftCard.tsx
import { Card, CardContent } from '@/components/ui/card'

export function NextShiftCard() {
  // 仮データ（本番はSupabaseから）
  const shift = {
    date: '2025-04-15',
    time: '13:00〜',
    site: '江口 環 邸（住友林業）',
    address: '千葉県流山市江戸川台西2-14'
  }

  return (
    <Card>
      <CardContent className="space-y-1 py-4">
        <p className="text-sm text-muted-foreground">明日の予定</p>
        <p className="text-base font-medium">{shift.date}（{shift.time}）</p>
        <p className="text-sm">{shift.site}</p>
        <p className="text-xs text-gray-500">{shift.address}</p>
      </CardContent>
    </Card>
  )
}
