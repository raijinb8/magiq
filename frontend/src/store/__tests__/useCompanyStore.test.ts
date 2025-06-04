import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '../../test/utils';
import { useCompanyStore } from '../useCompanyStore';

describe('useCompanyStore', () => {
  beforeEach(() => {
    // ストアの状態をリセット
    const store = useCompanyStore.getState();
    act(() => {
      store.setCompanyId('');
      store.setCompanyData(null);
    });
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useCompanyStore());

    expect(result.current.companyId).toBe('');
    expect(result.current.companyData).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('会社IDを設定できる', () => {
    const { result } = renderHook(() => useCompanyStore());

    act(() => {
      result.current.setCompanyId('NOHARA_G');
    });

    expect(result.current.companyId).toBe('NOHARA_G');
  });

  it('会社データを設定できる', () => {
    const { result } = renderHook(() => useCompanyStore());
    const mockCompanyData = {
      id: 'NOHARA_G',
      name: '野原G住環境',
      logo: '/logo.png',
    };

    act(() => {
      result.current.setCompanyData(mockCompanyData);
    });

    expect(result.current.companyData).toEqual(mockCompanyData);
  });

  it('ローディング状態を設定できる', () => {
    const { result } = renderHook(() => useCompanyStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('複数のhookが同じ状態を共有する', () => {
    const { result: result1 } = renderHook(() => useCompanyStore());
    const { result: result2 } = renderHook(() => useCompanyStore());

    act(() => {
      result1.current.setCompanyId('TEST_COMPANY');
    });

    expect(result1.current.companyId).toBe('TEST_COMPANY');
    expect(result2.current.companyId).toBe('TEST_COMPANY');
  });
});