# MSW API Mock Handlers ガイド

このガイドでは、MagIQアプリケーション用に作成した包括的なMSW APIモックハンドラーの使用方法を説明します。

## 🎯 作成された主要機能

### 1. Supabase認証API（authHandlers）
- **メール/パスワードログイン** - 複数のテストユーザー対応
- **OAuth認証** - Google, GitHub等の認証フロー
- **ユーザー登録** - バリデーション付き
- **メール確認** - 確認トークンの処理
- **パスワードリセット** - セキュアなフロー
- **トークンリフレッシュ** - セッション管理
- **ユーザー情報更新** - プロフィール変更

### 2. Supabase Storage（storageHandlers）
- **ファイルアップロード** - 認証・サイズ制限・タイプチェック
- **ファイルダウンロード** - アクセス制御付き
- **ファイル削除** - 権限チェック
- **ファイル一覧** - フィルタリング・ページネーション
- **バケット管理** - public/private制御
- **署名付きURL** - セキュアアクセス

### 3. Edge Functions（edgeFunctionHandlers）
- **PDF処理** - 会社別プロンプト対応
- **バッチ処理** - 複数ファイル同時処理
- **ヘルスチェック** - システム状態監視
- **処理状況確認** - リアルタイム進捗

### 4. データベース操作（databaseHandlers）
- **work_orders CRUD** - 作業指示書管理
- **shifts CRUD** - シフト管理
- **高度なクエリ** - フィルタ・ソート・ページネーション
- **リレーション** - 関連データ取得

## 🚀 使用方法

### 基本的なテスト
```typescript
import { mockApi } from '@/test/mocks/api-helpers';

// 認証済みユーザーをモック
mockApi.mockAuthenticatedUser();

// PDF処理をモック
mockApi.mockPdfProcessing(true);
```

### エラーシナリオ
```typescript
import { testScenarios } from '@/test/mocks/api-helpers';

// ネットワークエラー
testScenarios.networkErrors();

// 認証エラー  
testScenarios.authenticationErrors();
```

## 🔧 提供されるユーティリティ

### APIヘルパー（api-helpers.ts）
- `mockApi` - 動的なモック制御
- `testScenarios` - よくあるテストシナリオ
- `createMockResponse` - レスポンス作成ヘルパー

### データファクトリー（factories.ts）
- `createMockUser()` - ユーザーデータ生成
- `createMockWorkOrder()` - 作業指示書データ生成
- `createMockShift()` - シフトデータ生成

### モック管理ユーティリティ（handlers.ts）
- `mockUtils` - 認証状態管理
- `storageUtils` - ファイルストレージ管理
- `databaseUtils` - データベース操作

## 💡 実装の特徴

1. **リアルなAPI体験** - 実際のSupabase APIと同じレスポンス形式
2. **状態管理** - セッション・ファイル・データベース状態を適切に管理
3. **エラーハンドリング** - 本格的なエラーレスポンス
4. **セキュリティ** - 認証チェック・権限制御
5. **パフォーマンス** - 適切な遅延とバリデーション

これにより、実際のAPIサーバーなしで包括的なテストが可能になりました。