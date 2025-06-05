// カバレッジ設定の詳細設定
export default {
  // 除外するファイルパターン
  exclude: [
    // テストファイル
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}',
    '**/test/**',
    '**/tests/**',
    '**/__tests__/**',
    
    // 設定ファイル
    '**/*.config.{js,jsx,ts,tsx}',
    '**/vite.config.{js,ts}',
    '**/vitest.config.{js,ts}',
    '**/tailwind.config.{js,ts}',
    '**/postcss.config.{js,ts}',
    
    // 型定義ファイル
    '**/*.d.ts',
    '**/types/**',
    
    // エントリーポイント
    '**/main.{js,jsx,ts,tsx}',
    '**/index.{js,jsx,ts,tsx}',
    
    // アセットとスタイル
    '**/assets/**',
    '**/*.css',
    '**/*.scss',
    '**/*.sass',
    '**/*.less',
    
    // 依存関係
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    
    // 開発用ファイル
    '**/*.stories.{js,jsx,ts,tsx}',
    '**/storybook/**',
    '**/.storybook/**',
    
    // モックファイル
    '**/__mocks__/**',
    '**/mocks/**',
    '**/mockData/**',
    
    // 環境固有
    '**/public/**',
    '**/.env*',
    '**/.git/**',
  ],
  
  // カバレッジを取得するファイルパターン
  include: [
    'src/**/*.{js,jsx,ts,tsx}',
  ],
  
  // 複数のレポート形式を生成
  reporters: [
    'text',           // コンソール出力
    'text-summary',   // 簡潔なサマリー
    'html',          // HTMLレポート
    'json',          // JSON形式
    'json-summary',  // JSON簡潔版
    'lcov',          // LCOV形式（外部ツール用）
    'clover',        // Clover XML（CI用）
    'cobertura',     // Cobertura XML（CI用）
  ],
  
  // 閾値設定
  thresholds: {
    // プロジェクト全体の閾値
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // ファイル毎の閾値（global値より低く設定）
    perFile: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // カバレッジ表示の色分け設定
  watermarks: {
    statements: [70, 80], // 70%未満:赤、70-80%:黄、80%以上:緑
    functions: [70, 80],
    branches: [70, 80],
    lines: [70, 80],
  },
};