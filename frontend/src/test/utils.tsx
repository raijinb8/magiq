// テストユーティリティ
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import userEvent from '@testing-library/user-event';

// カスタムプロバイダー
interface AllTheProvidersProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

function AllTheProviders({ children, initialEntries }: AllTheProvidersProps) {
  const Router = initialEntries ? MemoryRouter : BrowserRouter;
  const routerProps = initialEntries ? { initialEntries } : {};

  return (
    <Router {...routerProps}>
      {children}
      <Toaster />
    </Router>
  );
}

// カスタムrender関数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialEntries, ...renderOptions } = options || {};
  
  return render(ui, { 
    wrapper: ({ children }) => (
      <AllTheProviders initialEntries={initialEntries}>
        {children}
      </AllTheProviders>
    ), 
    ...renderOptions 
  });
};

// re-export everything
export * from '@testing-library/react';
export { customRender as render };

// ユーザーイベントのセットアップ
export const setupUser = () => userEvent.setup();

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