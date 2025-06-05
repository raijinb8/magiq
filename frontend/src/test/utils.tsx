import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// カスタムプロバイダーを含むレンダーオプション
type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>;

// アプリケーション全体のプロバイダーを含むカスタムレンダー関数
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// テストで使用するカスタムマッチャー
export function expectElementToBeInTheDocument(element: HTMLElement | null) {
  expect(element).toBeInTheDocument();
}

export function expectElementToHaveClass(element: HTMLElement | null, className: string) {
  expect(element).toHaveClass(className);
}

export function expectElementToHaveTextContent(element: HTMLElement | null, text: string) {
  expect(element).toHaveTextContent(text);
}

// よく使用されるテストユーティリティを個別にエクスポート
export { 
  screen, 
  waitFor, 
  waitForElementToBeRemoved,
  fireEvent,
  act,
  cleanup,
  configure,
  getByRole,
  getByText,
  getByLabelText,
  getByTestId,
  queryByRole,
  queryByText,
  queryByLabelText,
  queryByTestId,
  findByRole,
  findByText,
  findByLabelText,
  findByTestId
} from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// カスタムレンダーをデフォルトのrenderとして再エクスポート
export { customRender as render };