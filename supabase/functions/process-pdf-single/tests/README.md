# Denoテスト

このディレクトリには、process-pdf-single Edge Function用のDenoテストが含まれています。

## テストの実行方法

### フロントエンドディレクトリから実行
```bash
cd frontend
npm run test:deno
```

### supabaseディレクトリから直接実行
```bash
cd supabase
deno test --allow-net=supabase.co,googleapis.com --allow-env --allow-read
```

## テストファイル

- `promptRegistry_test.ts` - プロンプトレジストリの単体テスト
- `index_test.ts` - PDF処理のエラーハンドリングテスト
- `prompts_test.ts` - 個別プロンプト関数のテスト
- `integration_test.ts` - 統合テスト

## 型チェック

型チェックを有効にしてテストを実行するには、`--no-check`フラグを使用しないでください：

```bash
deno test  # 型チェックあり（推奨）
deno test --no-check  # 型チェックなし（高速）
```