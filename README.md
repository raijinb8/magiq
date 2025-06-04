# MagIQ

建設業向けの作業指示書管理とシフトスケジューリングのためのフルスタックアプリケーション。AI を活用した PDF 処理により、作業指示書から必要な情報を自動抽出し、業務効率を大幅に改善します。

## 主な機能

### 🗂️ PDF 作業指示書管理
- ドラッグ&ドロップによる簡単なファイルアップロード
- リアルタイムPDFプレビュー
- ファイル処理ステータスの可視化

### 🤖 AI による情報抽出
- Google Gemini AI を活用した高精度なテキスト抽出
- 企業・帳票種別に応じたカスタマイズ可能なプロンプト
- 抽出結果の確認・編集機能

### 📅 シフト管理
- 直感的なシフト入力フォーム
- 次回シフトのダッシュボード表示
- シフト提出状況の一元管理

### 👤 ユーザー認証・管理
- Supabase Auth による安全な認証
- ロールベースのアクセス制御
- 管理者向け専用ダッシュボード

### 🏢 マルチカンパニー対応
- 企業ごとの動的設定
- 会社固有のPDF処理プロンプト
- カスタマイズ可能な UI/UX

## 技術スタック

### フロントエンド
- **React 19** + **TypeScript**
- **Vite 6.2** (@tailwindcss/vite plugin)
- **Tailwind CSS v4** (最新版)
- **React Router v7**
- **Zustand** (状態管理)
- **react-pdf** (PDFレンダリング)
- **shadcn/ui** (UIコンポーネント)
- **Sonner** (通知トースト)

### バックエンド
- **Supabase**
  - PostgreSQL 15
  - 認証 (Supabase Auth)
  - ストレージ (Supabase Storage)
  - Edge Functions (Deno v1 ランタイム)
- **Google Gemini AI API**
  - `gemini-2.5-flash-preview-04-17` モデル
  - PDF処理とテキスト抽出

### 開発環境
- **Docker** & **Docker Compose**
- **VS Code Dev Containers**
- **Supabase CLI**

## クイックスタート

### 前提条件

- Docker Desktop
- Node.js 18+ (LTS推奨)
- Supabase CLI
- Google Gemini API キー

### セットアップ手順

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd magiq
   ```

2. **環境変数の設定**

   フロントエンド用 (`frontend/.env`):
   ```env
   VITE_PUBLIC_SUPABASE_URL=http://localhost:54321
   VITE_PUBLIC_SUPABASE_ANON_KEY=<supabase startで表示される値>
   ```

   バックエンド用 (`supabase/functions/process-pdf-single/.env`):
   ```env
   GEMINI_API_KEY=<あなたのGemini APIキー>
   ```

3. **Supabase起動とデータベースセットアップ**
   ```bash
   supabase start
   supabase db reset
   ```

4. **フロントエンド起動**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **アクセス**
   - アプリケーション: http://localhost:5173
   - Supabase Studio: http://localhost:54323

## 開発コマンド

### フロントエンド
```bash
cd frontend
npm run dev        # 開発サーバー起動（ポート5173）
npm run build      # TypeScriptチェック + 本番ビルド
npm run lint       # ESLint実行
npm run preview    # 本番ビルドのプレビュー
```

### バックエンド
```bash
supabase start     # ローカルSupabase起動
supabase db reset  # データベースリセット
supabase functions serve process-pdf-single --env-file supabase/functions/process-pdf-single/.env
```

## プロジェクト構成

```
.
├── frontend/                 # React フロントエンド
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   ├── pages/          # ページコンポーネント  
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/            # API・Supabaseクライアント
│   │   ├── store/          # Zustand状態管理
│   │   └── types/          # TypeScript型定義
│   └── public/
│       └── config/         # 企業別設定
├── supabase/                # バックエンド
│   ├── functions/          # Edge Functions
│   │   └── process-pdf-single/
│   │       └── prompts/    # 企業別AIプロンプト
│   └── migrations/         # DBマイグレーション
└── docker-compose.yml      # Docker設定
```

## アーキテクチャ詳細

### PDF処理パイプライン

1. **アップロード**: WorkOrderToolでPDFをドラッグ&ドロップ
2. **処理**: Supabase Edge Function `process-pdf-single` が実行
   - PDFをBase64エンコード
   - Gemini AI APIでテキスト抽出
   - 企業別プロンプトで最適な結果を生成
3. **保存**: `work_orders` テーブルに結果を格納
4. **表示**: GeneratedTextPanelで確認・編集

### マルチカンパニー対応

- 企業IDは実行時に動的決定（`/public/config/active.json`）
- Zustandストアで企業コンテキストを管理
- 企業別AIプロンプトでカスタマイズ可能な情報抽出

### 認証フロー

1. Supabase Authでユーザー認証
2. JWTトークンをセッションストレージに保存
3. ProtectedRouteコンポーネントでアクセス制御
4. 管理者は `/admin/*` ルートにアクセス可能

## API リファレンス

### PDF処理エンドポイント

**POST** `/functions/v1/process-pdf-single`

```typescript
// リクエスト (FormData)
{
  file: File,           // PDFファイル
  companyId: string,    // 企業ID
  promptType: string    // プロンプト種別
}

// レスポンス
{
  generatedText: string,      // 抽出されたテキスト
  promptIdentifier: string,   // 使用したプロンプト
  geminiProcessedAt: string,  // 処理日時
  tokensUsed: number          // 使用トークン数
}
```

## データベーススキーマ

### work_orders テーブル
PDF処理結果を保存
- `id`, `file_name`, `uploaded_at`, `company_name`
- `prompt_identifier`, `generated_text`, `edited_text`
- `status`, `error_message`, `gemini_processed_at`

### shifts テーブル
シフト情報を管理
- `id`, `user_id`, `date`, `shift_type`
- `custom_end_time`, `note`

## 開発ガイドライン

- **TypeScript**: `any`型の使用禁止、厳格な型定義
- **コミット**: 日本語でのコミットメッセージ（例: `feat: ユーザー認証機能を追加`）
- **テスト**: TDD推奨、Vitest + React Testing Library
- **コード品質**: ESLint + Prettier でコード品質を維持

詳細な開発ガイドラインは [CLAUDE.md](./CLAUDE.md) を参照してください。

## ライセンス

© kanatani
