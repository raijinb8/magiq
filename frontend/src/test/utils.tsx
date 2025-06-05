import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// カスタムプロバイダーを含むレンダーオプション
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

// アプリケーション全体のプロバイダーを含むカスタムレンダー関数
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialEntries = ['/'], ...renderOptions } = options;

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

// よく使用されるテストユーティリティをエクスポート
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// カスタムレンダーをデフォルトのrenderとして再エクスポート
export { customRender as render };