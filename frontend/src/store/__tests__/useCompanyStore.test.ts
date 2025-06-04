import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '../../test/utils';
import { useCompanyStore } from '../useCompanyStore';

describe('useCompanyStore', () => {
  beforeEach(() => {
    // ストアの状態をリセット
    const store = useCompanyStore.getState();
    act(() => {
      store.setCompany(null);
    });
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useCompanyStore());

    expect(result.current.company).toBeNull();
  });

  it('会社情報を設定できる', () => {
    const { result } = renderHook(() => useCompanyStore());
    const mockCompany = {
      id: 'NOHARA_G',
      name: '野原G住環境',
      themeColor: '#3B82F6',
      showShiftForm: true,
    };

    act(() => {
      result.current.setCompany(mockCompany);
    });

    expect(result.current.company).toEqual(mockCompany);
  });

  it('会社情報をnullに設定できる', () => {
    const { result } = renderHook(() => useCompanyStore());
    const mockCompany = {
      id: 'NOHARA_G',
      name: '野原G住環境',
      themeColor: '#3B82F6',
      showShiftForm: true,
    };

    // 最初に会社情報を設定
    act(() => {
      result.current.setCompany(mockCompany);
    });

    expect(result.current.company).toEqual(mockCompany);

    // nullにリセット
    act(() => {
      result.current.setCompany(null);
    });

    expect(result.current.company).toBeNull();
  });

  it('複数のhookが同じ状態を共有する', () => {
    const { result: result1 } = renderHook(() => useCompanyStore());
    const { result: result2 } = renderHook(() => useCompanyStore());
    const mockCompany = {
      id: 'TEST_COMPANY',
      name: 'テスト会社',
      themeColor: '#10B981',
      showShiftForm: false,
    };

    act(() => {
      result1.current.setCompany(mockCompany);
    });

    expect(result1.current.company).toEqual(mockCompany);
    expect(result2.current.company).toEqual(mockCompany);
  });
});