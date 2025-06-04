// shiftHelpers.ts のテスト
import { describe, it, expect } from 'vitest';
import { getWeekdayLabel, getShiftTypeLabel } from './shiftHelpers';

describe('getWeekdayLabel', () => {
  it('正しい曜日ラベルを返す', () => {
    expect(getWeekdayLabel('2024-01-01')).toBe('月'); // 2024年1月1日は月曜日
    expect(getWeekdayLabel('2024-01-02')).toBe('火');
    expect(getWeekdayLabel('2024-01-03')).toBe('水');
    expect(getWeekdayLabel('2024-01-04')).toBe('木');
    expect(getWeekdayLabel('2024-01-05')).toBe('金');
    expect(getWeekdayLabel('2024-01-06')).toBe('土');
    expect(getWeekdayLabel('2024-01-07')).toBe('日');
  });

  it('異なる年月の日付でも正しく動作する', () => {
    expect(getWeekdayLabel('2023-12-25')).toBe('月'); // 2023年のクリスマス
    expect(getWeekdayLabel('2025-01-01')).toBe('水'); // 2025年の元旦
  });

  it('ISO形式の日付文字列を処理できる', () => {
    expect(getWeekdayLabel('2024-01-01T00:00:00Z')).toBe('月');
    expect(getWeekdayLabel('2024-01-01T12:30:45.123Z')).toBe('月');
  });
});

describe('getShiftTypeLabel', () => {
  it('フルシフトのラベルを返す', () => {
    expect(getShiftTypeLabel('full')).toBe('フル（終日）');
    expect(getShiftTypeLabel('full', '任意の時間')).toBe('フル（終日）'); // 時間は無視される
  });

  it('午後シフトのラベルを返す', () => {
    expect(getShiftTypeLabel('pm')).toBe('午後のみ');
    expect(getShiftTypeLabel('pm', '13:00')).toBe('午後のみ（13:00）');
    expect(getShiftTypeLabel('pm', '14:30')).toBe('午後のみ（14:30）');
  });

  it('カスタムシフトのラベルを返す', () => {
    expect(getShiftTypeLabel('custom')).toBe('時間指定（未指定）');
    expect(getShiftTypeLabel('custom', '10:00-15:00')).toBe('時間指定（10:00-15:00）');
    expect(getShiftTypeLabel('custom', '9:30-17:30')).toBe('時間指定（9:30-17:30）');
  });

  it('休みのラベルを返す', () => {
    expect(getShiftTypeLabel('off')).toBe('休み');
    expect(getShiftTypeLabel('off', '任意の時間')).toBe('休み'); // 時間は無視される
  });

  it('未知のタイプの場合は未選択を返す', () => {
    expect(getShiftTypeLabel('unknown')).toBe('未選択');
    expect(getShiftTypeLabel('')).toBe('未選択');
    expect(getShiftTypeLabel('invalid-type')).toBe('未選択');
  });

  it('null/undefinedの時間を適切に処理する', () => {
    expect(getShiftTypeLabel('custom', undefined)).toBe('時間指定（未指定）');
    expect(getShiftTypeLabel('custom', null as string | null)).toBe('時間指定（未指定）');
    expect(getShiftTypeLabel('custom', '')).toBe('時間指定（）'); // 空文字の場合
  });
});