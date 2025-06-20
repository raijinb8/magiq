# Gemini API モック実装ガイド

このディレクトリには、Supabase Edge Functions のテストで使用する Gemini API のモック実装が含まれています。

## 概要

Gemini API モックは、実際の Google Gemini AI API を呼び出すことなく、Edge Functions のテストを実行できるようにします。これにより、以下の利点があります：

- **高速なテスト実行**: ネットワーク通信なしでテストが完了
- **確定的な結果**: 常に同じレスポンスを返すため、テストが安定
- **コスト削減**: API 使用料金が発生しない
- **オフライン実行**: インターネット接続なしでテスト可能

## 基本的な使用方法

### 1. シンプルなモックの作成

```typescript
import { createMockGeminiAI } from '../test-helpers.ts'

const mockGeminiAI = createMockGeminiAI()

// カスタムレスポンスを設定
mockGeminiAI.setCustomResponse({
  text: 'テスト用の生成テキスト',
  usageMetadata: {
    promptTokenCount: 100,
    candidatesTokenCount: 50,
    totalTokenCount: 150,
  },
})

// API を呼び出し
const response = await mockGeminiAI.models.generateContent({
  model: 'gemini-2.5-flash-preview-04-17',
  contents: [{ role: 'user', parts: [{ text: 'テストプロンプト' }] }],
})
```

### 2. エラーケースのテスト

```typescript
// エラーレスポンスを設定
mockGeminiAI.setErrorResponse(new Error('Rate limit exceeded'))

try {
  await mockGeminiAI.models.generateContent({/* ... */})
} catch (error) {
  console.log(error.message) // "Rate limit exceeded"
}
```

### 3. 条件付きレスポンス

```typescript
// 特定の条件でカスタムレスポンスを返す
mockGeminiAI.setConditionalResponse(
  (request) => {
    const requestStr = JSON.stringify(request)
    return requestStr.includes('NOHARA_G_MISAWA')
  },
  { text: '野原G専用のレスポンス', usageMetadata: { totalTokenCount: 1000 } },
)
```

## プリセットレスポンス

よく使用するレスポンスがプリセットとして用意されています：

```typescript
import { GEMINI_MOCK_RESPONSES } from '../test-helpers.ts'

// 野原G用のレスポンス
mockGeminiAI.setCustomResponse(GEMINI_MOCK_RESPONSES.NOHARA_G_MISAWA)

// ミサワホーム用のレスポンス
mockGeminiAI.setCustomResponse(GEMINI_MOCK_RESPONSES.KATOUBENIYA_IKEBUKURO_MISAWA)

// エラーケース
mockGeminiAI.setErrorResponse(GEMINI_MOCK_RESPONSES.ERROR_RATE_LIMIT)
```

## トラッキング機能

API 呼び出しの回数や内容を追跡できます：

```typescript
import { createTrackingMockGeminiAI } from '../test-helpers.ts'

const trackingMock = createTrackingMockGeminiAI()

// API を複数回呼び出し
await trackingMock.models.generateContent({/* ... */})
await trackingMock.models.generateContent({/* ... */})

console.log(trackingMock.callCount) // 2
console.log(trackingMock.lastRequest) // 最後のリクエスト内容

// トラッキングをリセット
trackingMock.resetTracking()
```

## Edge Function でのモック使用

### 方法1: Import Map を使用（推奨）

`import_map.test.json` を使用して、テスト時に実際の Gemini API をモックに置き換えます：

```bash
deno test --import-map=import_map.test.json
```

### 方法2: テストファイル内でモックを設定

```typescript
import { afterEach, beforeEach } from '@std/testing/mod'
import { cleanupTestEnv, createMockGeminiAI, setupTestEnv } from '../test-helpers.ts'

describe('Edge Function テスト', () => {
  let mockGeminiAI

  beforeEach(() => {
    setupTestEnv() // 環境変数を設定
    mockGeminiAI = createMockGeminiAI()
  })

  afterEach(() => {
    cleanupTestEnv() // 環境変数をクリーンアップ
    mockGeminiAI.reset() // モックをリセット
  })

  it('PDF処理が正常に動作する', async () => {
    // テストコード
  })
})
```

## 高度な使用例

### 動的レスポンス生成

```typescript
mockGeminiAI.setConditionalResponse(
  (request) => {
    const parts = request.contents[0].parts
    const hasFile = parts.some((p) => p.inlineData)
    const textContent = parts.find((p) => p.text)?.text || ''

    // ファイルがあり、かつ特定のキーワードを含む場合
    return hasFile && textContent.includes('urgent')
  },
  {
    text: '緊急対応が必要な案件です',
    usageMetadata: { totalTokenCount: 999 },
  },
)
```

### トークン使用量のシミュレーション

```typescript
const responses = [
  { promptTokens: 1000, outputTokens: 200 },
  { promptTokens: 2000, outputTokens: 300 },
]

for (const { promptTokens, outputTokens } of responses) {
  mockGeminiAI.setCustomResponse({
    text: `Response with ${promptTokens} prompt tokens`,
    usageMetadata: {
      promptTokenCount: promptTokens,
      candidatesTokenCount: outputTokens,
      totalTokenCount: promptTokens + outputTokens,
    },
  })

  const response = await mockGeminiAI.models.generateContent({/* ... */})
  // トークン使用量を集計
}
```

## テストコマンド

```bash
# 通常のテスト実行
deno test --allow-env --allow-read supabase/functions/

# モックを使用したテスト実行
deno test --allow-env --allow-read --import-map=supabase/import_map.test.json supabase/functions/

# 特定のテストファイルのみ実行
deno test --allow-env --allow-read supabase/functions/process-pdf-single/index.test.ts
```

## トラブルシューティング

### モックが正しく動作しない場合

1. 環境変数が正しく設定されているか確認
2. モックのリセットが適切に行われているか確認
3. import map が正しく設定されているか確認

### エラーが発生する場合

1. Deno のバージョンを確認（1.38 以上推奨）
2. 依存関係が正しくインポートされているか確認
3. 権限フラグが適切に設定されているか確認
