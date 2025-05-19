// utils/getTargetShiftWeek.ts

export const getTargetShiftWeek = (): string[] => {
  const today = new Date();

  // 毎週金曜00:00 〜 木曜23:59 が提出可能期間
  const targetMonday = new Date(today);
  const dayOfWeek = today.getDay();

  if (dayOfWeek === 5 && today.getHours() === 0) {
    // 金曜00:00ぴったりならOK（木曜24:00）
  } else if (dayOfWeek > 4 || (dayOfWeek === 4 && today.getHours() >= 24)) {
    // 金曜以降なら +3日で月曜に合わせる
    targetMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7));
  } else {
    // 月〜木曜なら今週の月曜に合わせる
    targetMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7));
  }

  // 月〜土の6日間分の日付を生成（表示順で管理）
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(targetMonday);
    d.setDate(targetMonday.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return days;
};
