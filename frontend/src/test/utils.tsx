// テストユーティリティ
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

// カスタムプロバイダー
interface AllTheProvidersProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <BrowserRouter>
      {children}
      <Toaster />
    </BrowserRouter>
  );
}

// カスタムrender関数
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';
export { customRender as render };

// モックユーザー
export const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  role: 'authenticated',
};

// モックシフトデータ
export const mockShift = {
  id: '1',
  user_id: 'mock-user-id',
  date: '2024-01-01',
  shift_type: 'morning' as const,
  note: 'テストシフト',
};

// モック作業指示書データ
export const mockWorkOrder = {
  id: '1',
  file_name: 'test.pdf',
  uploaded_at: '2024-01-01T00:00:00Z',
  company_name: '野原G住環境',
  status: 'completed' as const,
  generated_text: 'モックで生成されたテキスト',
  edited_text: null,
  error_message: null,
  gemini_processed_at: '2024-01-01T00:01:00Z',
};