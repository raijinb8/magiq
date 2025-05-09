export function getWeekdayLabel(dateStr: string): string {
  const day = new Date(dateStr).getDay()
  return ['日', '月', '火', '水', '木', '金', '土'][day]
}

export function getShiftTypeLabel(type: string, time?: string): string {
  switch (type) {
    case 'full':
      return 'フル（終日）'
    case 'pm':
      return '午後のみ' + (time ? `（${time}）` : '')
    case 'custom':
      return `時間指定（${time ?? '未指定'}）`
    case 'off':
      return '休み'
    default:
      return '未選択'
  }
}
