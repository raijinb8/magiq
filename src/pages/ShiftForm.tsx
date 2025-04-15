import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'

const shiftTypes = [
  { value: 'full', label: 'フル（終日）' },
  { value: 'pm', label: '午後のみ' },
  { value: 'custom', label: '時間指定' },
  { value: 'off', label: '休み' },
]

const getNextWeekDates = () => {
  const today = new Date()
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7))
  const days = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(nextMonday)
    date.setDate(nextMonday.getDate() + i)
    return date
  })
  return days
}

export default function ShiftForm() {
  const [user, setUser] = useState<User | null>(null)
  const [shifts, setShifts] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    fetchUser()
  }, [])

  const handleChange = (dateStr: string, field: string, value: string) => {
    setShifts(prev => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!user) return
    const entries = Object.entries(shifts).map(([dateStr, data]) => ({
      user_id: user.id,
      date: dateStr,
      shift_type: data.shift_type,
      custom_end_time: ['custom', 'pm'].includes(data.shift_type) ? data.custom_end_time : null,
      note: data.note || null,
    }))
    const { error } = await supabase.from('shifts').insert(entries)
    if (error) alert('申請に失敗しました')
    else alert('申請完了！')
  }

  const dates = getNextWeekDates()

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center">来週のシフト申請</h2>
      {dates.map(date => {
        const dateStr = date.toISOString().split('T')[0]
        const shift = shifts[dateStr] || {}
        const selectedLabel = shiftTypes.find(s => s.value === shift.shift_type)?.label || ''

        return (
          <div
            key={dateStr}
            className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-3 relative z-0"
          >
            <div className="font-semibold text-gray-700 text-sm">{dateStr}</div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedLabel || 'シフト種別を選択'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full z-50">
                <DropdownMenuRadioGroup
                  value={shift.shift_type}
                  onValueChange={val => handleChange(dateStr, 'shift_type', val)}
                >
                  {shiftTypes.map(s => (
                    <DropdownMenuRadioItem key={s.value} value={s.value}>
                      {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {['custom', 'pm'].includes(shift.shift_type) && (
              <Input
                type="time"
                value={shift.custom_end_time || ''}
                onChange={e => handleChange(dateStr, 'custom_end_time', e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-sm"
              />
            )}

            <Textarea
              placeholder="備考（任意）"
              value={shift.note || ''}
              onChange={e => handleChange(dateStr, 'note', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-sm"
            />
          </div>
        )
      })}
      <Button onClick={handleSubmit} className="w-full text-sm mt-4">
        申請する
      </Button>
    </div>
  )
}
