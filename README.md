# MagIQ - 建設業向け作業指示書管理システム

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e?logo=supabase)](https://supabase.io/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-gray)](LICENSE)

**建設現場の作業効率を革新するインテリジェントなドキュメント管理システム**

</div>

## 📋 概要

MagIQは、建設業界特有のニーズに応える次世代の作業指示書管理プラットフォームです。AI技術を活用したPDF解析により、紙ベースのワークフローをデジタル化し、現場作業の効率化と精度向上を実現します。

### 🎯 解決する課題

- **手作業によるデータ入力の削減** - PDF作業指示書から必要情報を自動抽出
- **シフト管理の効率化** - 直感的なインターフェースでスタッフのスケジュール管理を簡素化
- **マルチ企業対応** - 複数の建設会社に対応した柔軟な設定システム
- **リアルタイムな情報共有** - 管理者と現場スタッフ間での即時的な情報同期

## ✨ 主要機能

### 📄 PDF作業指示書管理
- **ドラッグ&ドロップアップロード** - 簡単なファイルアップロード
- **リアルタイムプレビュー** - アップロード前の内容確認
- **AI自動情報抽出** - Google Gemini APIによる高精度な文書解析
- **編集可能な抽出結果** - AIの結果を人間が確認・修正可能

### 📅 シフト管理
- **直感的なシフト入力** - カレンダーベースの使いやすいUI
- **柔軟な勤務体系対応** - 早番・遅番・カスタム時間設定
- **提出状況の可視化** - ダッシュボードでリアルタイム確認

### 👥 マルチカンパニー対応
- **企業別カスタマイズ** - ロゴ、テーマカラー、プロンプト設定
- **動的設定切り替え** - 実行時の企業ID判定による自動設定適用
- **独立したデータ管理** - 企業間のデータ分離とセキュリティ確保

### 🔐 認証・権限管理
- **Supabase Auth統合** - セキュアな認証システム
- **ロールベースアクセス制御** - 管理者/一般ユーザーの権限分離
- **保護されたルーティング** - 認証状態に基づく自動リダイレクト

## 🧪 テスト環境

### 🎯 TDD (Test-Driven Development) 対応
本プロジェクトは、**テスト駆動開発**を採用しており、高品質なコードの継続的な開発をサポートします。

**主要なテストツール:**
- **Vitest 3.2.1** - 高速なユニット・統合テスト
- **React Testing Library 16.3.0** - ユーザー中心のコンポーネントテスト
- **MSW (Mock Service Worker) 2.8.6** - APIモックによる統合テスト
- **@vitest/coverage-v8** - 高精度なカバレッジ測定（80%閾値設定済み）
- **Happy DOM** - 軽量なブラウザ環境シミュレーション

### 📋 テスト実行方法

**開発中（推奨）:**
```bash
cd frontend
npm test  # ウォッチモード（ファイル変更時に自動実行）
```

**ワンタイム実行:**
```bash
npm run test:run      # 全テスト実行
npm run test:coverage # カバレッジ付きテスト
npm run test:ui       # ブラウザUIでテスト確認
```

**CI/CD統合:**
```bash
npm run ci            # lint + type-check + build + test
npm run test:ci       # CI環境用テスト（JUnit出力付き）
npm run test:coverage:ci # カバレッジレポート生成
```

**バックエンドテスト:**
```bash
cd supabase/functions
deno test             # Edge Functionsのテスト実行
```

### 📊 テストカバレッジ
- **目標**: 全体80%以上（branches、functions、lines、statements）
- **現在の状態**: 包括的なモック環境（130+のAPIモック）とMSW統合により、実際のAPIに依存しない高速で安定したテストが可能

**詳細なガイド:**
- [テストガイドライン](docs/TESTING.md) - TDD実践とベストプラクティス
- [TDD開発ガイド](frontend/docs/TDD_GUIDE.md) - 開発フローとベストプラクティス
- [テスト環境設定](frontend/src/test/README.md) - 技術的な設定詳細
- [MSW統合ガイド](frontend/src/test/mocks/MSW_INTEGRATION_GUIDE.md) - APIモックの使用方法

## 🛠️ 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|------------|------|
| **React** | 19.0 | UIフレームワーク |
| **TypeScript** | 5.7 | 型安全な開発 |
| **Vite** | 6.2 | 高速ビルドツール |
| **Tailwind CSS** | v4 | ユーティリティファーストCSS |
| **React Router** | v7 | クライアントサイドルーティング |
| **Zustand** | 5.0 | 状態管理 |
| **react-pdf** | 9.2 | PDFレンダリング |
| **shadcn/ui** | Latest | UIコンポーネントライブラリ |

### バックエンド
| 技術 | 説明 |
|------|------|
| **Supabase** | PostgreSQL、認証、ストレージ、Edge Functions |
| **Deno** | Edge Functionsランタイム |
| **PostgreSQL** | リレーショナルデータベース |
| **Google Gemini API** | AI文書解析 |

## 🚀 クイックスタート

### 前提条件
- Node.js 18+ および npm
- Docker Desktop
- Supabase CLI
- Google Gemini API キー

### セットアップ手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/raijinb8/magiq.git
cd magiq
```

2. **環境変数の設定**

`frontend/.env` を作成:
```env
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`supabase/functions/process-pdf-single/.env` を作成:
```env
GEMINI_API_KEY=your_gemini_api_key
```

3. **Supabaseの起動**
```bash
supabase start
supabase db reset
```

4. **フロントエンドの起動**
```bash
cd frontend
npm install
npm run dev
```

5. **アクセス**
- フロントエンド: http://localhost:5173
- Supabase Studio: http://localhost:54323

## 🏗️ プロジェクト構成

```
magiq/
├── frontend/                    # React フロントエンド
│   ├── public/
│   │   └── config/             # 企業別設定ファイル
│   ├── src/
│   │   ├── components/         # Reactコンポーネント
│   │   │   ├── auth/          # 認証関連
│   │   │   ├── dashboard/     # ダッシュボード
│   │   │   ├── layout/        # レイアウト
│   │   │   ├── ui/            # 共通UIコンポーネント
│   │   │   └── workOrderTool/ # PDF処理ツール
│   │   ├── hooks/             # カスタムフック
│   │   ├── lib/               # ユーティリティ
│   │   ├── pages/             # ページコンポーネント
│   │   ├── store/             # Zustand ストア
│   │   └── types/             # TypeScript型定義
│   └── package.json
│
├── supabase/                   # Supabase バックエンド
│   ├── functions/             # Edge Functions
│   │   └── process-pdf-single/
│   │       ├── index.ts       # メイン処理
│   │       ├── promptRegistry.ts
│   │       └── prompts/       # 企業別プロンプト
│   └── migrations/            # DBマイグレーション
│
├── docker-compose.yml         # Docker設定
└── README.md                  # このファイル
```

## 💻 開発コマンド

### フロントエンド
```bash
cd frontend
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド
npm run lint       # ESLint実行
npm run preview    # ビルドプレビュー
```

### バックエンド
```bash
supabase start     # ローカルSupabase起動
supabase db reset  # DBリセット&マイグレーション
supabase functions serve process-pdf-single --env-file .env
```

## 📡 API仕様

### PDF処理エンドポイント

**`POST /functions/v1/process-pdf-single`**

リクエスト (multipart/form-data):
```typescript
interface ProcessPdfRequest {
  file: File;           // PDFファイル
  companyId: string;    // 企業ID
  promptType?: string;  // プロンプトタイプ
}
```

レスポンス:
```typescript
interface ProcessPdfResponse {
  id: string;
  fileName: string;
  generatedText: string;
  status: 'success' | 'error';
  geminiProcessedAt: string;
  error?: string;
}
```

## 🗄️ データベーススキーマ

### work_orders テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| file_name | text | ファイル名 |
| uploaded_at | timestamp | アップロード日時 |
| company_name | text | 企業名 |
| generated_text | text | AI抽出結果 |
| edited_text | text | 編集済みテキスト |
| status | text | 処理ステータス |

### shifts テーブル
| カラム | 型 | 説明 |
|--------|-----|------|
| id | uuid | 主キー |
| user_id | uuid | ユーザーID |
| date | date | シフト日付 |
| shift_type | text | シフトタイプ |
| custom_end_time | time | カスタム終了時間 |
| note | text | 備考 |

## 🔧 設定とカスタマイズ

### 企業設定
企業別の設定は `frontend/public/config/active.json` で管理:
```json
{
  "companyId": "NOHARA_G",
  "theme": {
    "primaryColor": "#3B82F6",
    "logoUrl": "/logos/nohara-g.png"
  }
}
```

### AIプロンプト設定
企業・帳票別のプロンプトは `supabase/functions/process-pdf-single/prompts/` に配置。

## 🤝 貢献ガイド

### ブランチ戦略
- `main` - 本番環境
- `dev` - 開発統合
- `feature/*` - 新機能開発
- `fix/*` - バグ修正
- `hotfix/*` - 緊急修正

### コミット規約
```
<type>: <件名>

<本文>
```

タイプ:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

### プルリクエスト
1. `dev`ブランチから作業ブランチを作成
2. 変更を実装しテストを追加
3. `npm run lint` と `npm run build` が成功することを確認
4. PRを作成し、レビューを依頼

## 📝 ライセンス

Copyright © 2025 Kanatani. All rights reserved.

---

<div align="center">

**[ドキュメント](docs/README.md)** | **[Issues](https://github.com/raijinb8/magiq/issues)** | **[Discussions](https://github.com/raijinb8/magiq/discussions)**

</div>