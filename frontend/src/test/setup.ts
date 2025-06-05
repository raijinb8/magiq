import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import './matchers';

// React Testing Libraryの設定
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 10000,
  computedStyleSupportsPseudoElements: false,
  defaultHidden: true,
  showOriginalStackTrace: true,
});

// React Testing Libraryの自動クリーンアップ
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// グローバル変数とAPIのモック設定
beforeAll(() => {
  // Vitestのグローバル設定（FakeTimersは必要に応じて有効化）
  // vi.useFakeTimers(); // コメントアウト：デフォルトでは実時間を使用
  
  // Node.jsのグローバル変数をブラウザ環境用にモック
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
  
  // Fetch APIのモック
  global.fetch = vi.fn();
  
  // Local Storage のモック
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Session Storage のモック
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });

  // Location のモック
  const locationMock = {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    reload: vi.fn(),
    replace: vi.fn(),
  };
  Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
  });

  // History API のモック
  const historyMock = {
    length: 1,
    state: null,
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    pushState: vi.fn(),
    replaceState: vi.fn(),
  };
  Object.defineProperty(window, 'history', {
    value: historyMock,
    writable: true,
  });

  // matchMedia のモック（レスポンシブデザインのテスト用）
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // IntersectionObserver のモック（遅延読み込みコンポーネントのテスト用）
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));

  // ResizeObserver のモック（レイアウト変更検知のテスト用）
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // MutationObserver のモック
  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
  }));

  // URL API のモック（ファイルアップロードのテスト用）
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // File API のモック
  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    abort: vi.fn(),
    result: null,
    error: null,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    readyState: 0,
  }));

  // Geolocation API のモック
  const geolocationMock = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };
  Object.defineProperty(navigator, 'geolocation', {
    value: geolocationMock,
    writable: true,
  });

  // Clipboard API のモック（user-eventとの競合を避ける）
  if (!navigator.clipboard) {
    const clipboardMock = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
      write: vi.fn().mockResolvedValue(undefined),
      read: vi.fn().mockResolvedValue([]),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardMock,
      writable: true,
      configurable: true,
    });
  }

  // Service Worker のモック
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue({}),
      ready: Promise.resolve({}),
      controller: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
  });

  // Notification API のモック
  global.Notification = vi.fn().mockImplementation(() => ({
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Object.defineProperty(Notification, 'permission', {
    value: 'default',
    writable: true,
  });
  Object.defineProperty(Notification, 'requestPermission', {
    value: vi.fn().mockResolvedValue('granted'),
    writable: true,
  });

  // Performance API のモック
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      navigation: {
        type: 0,
        redirectCount: 0,
      },
      timing: {
        navigationStart: Date.now(),
        loadEventEnd: Date.now(),
      },
    },
    writable: true,
  });

  // Web Audio API のモック
  global.AudioContext = vi.fn().mockImplementation(() => ({
    createOscillator: vi.fn(),
    createGain: vi.fn(),
    createBuffer: vi.fn(),
    decodeAudioData: vi.fn(),
    close: vi.fn(),
    suspend: vi.fn(),
    resume: vi.fn(),
    state: 'suspended',
    sampleRate: 44100,
    currentTime: 0,
    destination: {},
  }));

  // Canvas API のモック（既存のモックがない場合のみ）
  if (!HTMLCanvasElement.prototype.getContext.mockImplementation) {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType) => {
      if (contextType === 'webgl' || contextType === 'webgl2') {
        return {
          getExtension: vi.fn(),
          getParameter: vi.fn(),
          createShader: vi.fn(),
          shaderSource: vi.fn(),
          compileShader: vi.fn(),
          createProgram: vi.fn(),
          attachShader: vi.fn(),
          linkProgram: vi.fn(),
          useProgram: vi.fn(),
          createBuffer: vi.fn(),
          bindBuffer: vi.fn(),
          bufferData: vi.fn(),
          enable: vi.fn(),
          disable: vi.fn(),
          clear: vi.fn(),
          drawArrays: vi.fn(),
          drawElements: vi.fn(),
          viewport: vi.fn(),
        };
      }
      // 2D Canvas Context
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray() })),
        putImageData: vi.fn(),
        createImageData: vi.fn(),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        canvas: {},
      };
    });
  }
});

// コンソール出力の管理
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // React の既知の警告を抑制
  console.error = (...args: unknown[]) => {
    const message = String(args[0]);
    
    // 抑制する警告のパターン
    const suppressedWarnings = [
      'Warning: ReactDOM.render',
      'Warning: React.createElement',
      'Warning: componentWillMount',
      'Warning: componentWillReceiveProps',
      'Warning: componentWillUpdate',
      'Warning: findDOMNode',
      'Warning: Unsafe lifecycle methods',
    ];

    if (suppressedWarnings.some(warning => message.includes(warning))) {
      return;
    }

    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0]);
    
    // 抑制する警告のパターン
    const suppressedWarnings = [
      'Warning: React.createFactory',
      'Warning: Legacy context API',
    ];

    if (suppressedWarnings.some(warning => message.includes(warning))) {
      return;
    }

    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  // vi.useRealTimers(); // FakeTimersを使用していない場合は不要
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});