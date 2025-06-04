// utils.ts のテスト
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className merge utility)', () => {
  it('単一のクラス名を処理する', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('複数のクラス名を結合する', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('条件付きクラス名を処理する', () => {
    expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
    expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
  });

  it('配列形式のクラス名を処理する', () => {
    expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
  });

  it('オブジェクト形式のクラス名を処理する', () => {
    expect(cn({ 'text-red-500': true, 'bg-blue-500': false })).toBe('text-red-500');
  });

  it('Tailwindの競合するクラスを適切にマージする', () => {
    // twMergeの機能：後から指定されたクラスが優先される
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('nullやundefinedを適切に処理する', () => {
    expect(cn('base-class', null, undefined, 'another-class')).toBe('base-class another-class');
  });

  it('空文字列を適切に処理する', () => {
    expect(cn('', 'valid-class', '')).toBe('valid-class');
  });

  it('複雑な組み合わせを処理する', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-class': true },
      true && 'conditional',
      null,
      undefined,
      ''
    );
    expect(result).toBe('base array-class object-class conditional');
  });
});