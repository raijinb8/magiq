import { expect } from 'vitest';

// カスタムマッチャーを追加
expect.extend({
  toBeEmptyDOMElement(received: HTMLElement) {
    const pass = received.innerHTML === '';
    return {
      message: () => 
        pass 
          ? `Expected element not to be empty, but it was`
          : `Expected element to be empty, but it contained: ${received.innerHTML}`,
      pass,
    };
  },

  toHaveErrorMessage(received: HTMLElement, expectedMessage: string) {
    const errorElement = received.querySelector('[role="alert"], .error-message, [data-testid="error"]');
    const pass = errorElement?.textContent?.includes(expectedMessage) ?? false;
    
    return {
      message: () =>
        pass
          ? `Expected element not to have error message "${expectedMessage}"`
          : `Expected element to have error message "${expectedMessage}", but got: ${errorElement?.textContent || 'no error message'}`,
      pass,
    };
  },

  toBeLoadingState(received: HTMLElement) {
    const loadingIndicators = [
      '[data-testid="loading"]',
      '.loading',
      '[aria-busy="true"]',
      '.spinner'
    ];
    
    const hasLoadingIndicator = loadingIndicators.some(selector => 
      received.querySelector(selector) !== null
    );
    
    return {
      message: () =>
        hasLoadingIndicator
          ? `Expected element not to be in loading state`
          : `Expected element to be in loading state`,
      pass: hasLoadingIndicator,
    };
  }
});

// TypeScript型定義の拡張（型の競合を避けるため、条件付きで拡張）
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeEmptyDOMElement(): T;
      toHaveErrorMessage(message: string): T;
      toBeLoadingState(): T;
    }
  }
}