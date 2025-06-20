# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のClaude Code (claude.ai/code) への指示を提供します。

## プロジェクト概要

MagIQは、建設業の作業指示書管理とシフトスケジューリングのためのフルスタックアプリケーションです。ReactフロントエンドとSupabaseバックエンド（AIを使用したPDF処理用のEdge Functions付き）で構成されています。

**プロジェクト構成:**
- `/app/frontend` - React TypeScriptフロントエンド
- `/app/supabase` - バックエンド（Edge Functions、マイグレーション、設定）

**主要技術:**

フロントエンド:
- React 19 with TypeScript
- Vite 6.2 with @tailwindcss/vite plugin
- Tailwind CSS v4
- React Router v7
- Zustand（状態管理）
- react-pdf（PDFレンダリング）
- shadcn/uiコンポーネント

バックエンド:
- Supabase (PostgreSQL、認証、ストレージ、Edge Functions)
- Denoランタイム（Edge Functions用）
- Google Gemini AI API（PDF処理用）
- TypeScript

## 共通開発コマンド

### フロントエンドコマンド
```bash
cd /app/frontend
npm run dev        # 開発サーバー起動（ポート5173）
npm run build      # TypeScriptチェック + 本番ビルド
npm run lint       # ESLint実行
npm run preview    # 本番ビルドのプレビュー
```

### バックエンドコマンド
```bash
cd /app
supabase start     # ローカルSupabase起動（Docker必須）
supabase db reset  # データベースリセットとマイグレーション適用
supabase functions serve process-pdf-single --env-file supabase/functions/process-pdf-single/.env
```

**環境設定:**
- フロントエンド: `/app/frontend/.env` にSupabase URLとanon keyを設定
- バックエンド: `/app/supabase/functions/process-pdf-single/.env` に `GEMINI_API_KEY` を設定

### テストコマンド
```bash
cd /app/frontend
npm test              # ウォッチモード（開発中に常時実行推奨）
npm run test:run      # 全テスト実行
npm run test:coverage # カバレッジ付きテスト実行
npm run test:ui       # ブラウザUIでテスト確認
npm run ci           # CI相当チェック（lint + type-check + build + test）
```

**TDD開発フロー:**
1. 🔴 失敗するテストを書く
2. 🟢 テストを通す最小限のコードを書く
3. 🔵 コードをリファクタリングする
4. 詳細は `/app/frontend/docs/TDD_GUIDE.md` を参照

**テスト環境:**
- **Vitest**: 高速テストランナー
- **React Testing Library**: ユーザー中心のコンポーネントテスト
- **@vitest/coverage-v8**: 高精度カバレッジ測定
- **包括的モック**: localStorage, fetch, Canvas, WebGL等130+のAPIをモック
- **カスタムマッチャー**: プロジェクト固有のアサーション
- **CI/CD統合**: GitHub Actions対応、JUnitレポート生成

## 高レベルアーキテクチャ

### マルチカンパニーアーキテクチャ
アプリケーションは動的設定により複数の建設会社をサポートします：
- カンパニーIDは実行時に決定され、Zustandストア（`useCompanyStore`）に格納
- 設定は `/public/config/active.json` から読み込み
- バックエンドでのPDF処理用の会社固有プロンプト

### 認証フロー
- Supabase Authがユーザー認証を処理
- `ProtectedRoute` コンポーネントが認証済みページをラップ
- ログイン後、ユーザーは `/admin`（管理ダッシュボード）にリダイレクト
- ユーザーセッションはSupabaseクライアントで管理

### PDF処理パイプライン
1. **フロントエンドアップロード**: `WorkOrderTool`でドラッグ&ドロップまたはファイル入力でアップロード
2. **バックエンド処理**: Supabase Edge Function `process-pdf-single` がGoogle Gemini APIを使用してテキスト抽出
   - Gemini API用にPDFをBase64に変換
   - `gemini-2.5-flash-preview-04-17` モデルを使用
   - トークン使用量と処理時間を追跡
3. **会社固有プロンプト**: `companyId`に基づく異なるプロンプト
   - `NOHARA_G`: 野原G住環境
   - `KATOUBENIYA_IKEBUKURO_MISAWA`: 加藤ベニヤ池袋_ミサワホーム
   - プロンプトは厳密なフォーマット（全角/半角）を強制
4. **データベース保存**: 結果は `work_orders` テーブルに保存
5. **結果表示**: 抽出されたテキストは `GeneratedTextPanel` でレビュー/編集用に表示

### 状態管理パターン
- **グローバル状態**: 会社設定用のZustand
- **コンポーネント状態**: UIインタラクション用のローカルReact状態
- **サーバー状態**: データ取得用のSupabaseクエリ
- **PDF状態**: PDFビューア状態用のカスタムフック（`usePdfDocument`、`usePdfControls`）

### ルーティングアーキテクチャ
```
/ (Home)
/login
/admin/* (Protected)
  - /admin (Dashboard)
  - /admin/projects/* (Project management)
  - /admin/work-order-tool (PDF processing)
/dashboard (User dashboard)
/shift-form (Shift submission)
```

## バックエンドアーキテクチャ

### データベーススキーマ

**work_ordersテーブル:**
- PDF処理結果を保存
- フィールド: `id`, `file_name`, `uploaded_at`, `company_name`, `prompt_identifier`, `generated_text`, `edited_text`, `status`, `error_message`, `gemini_processed_at`

**shiftsテーブル:**
- スタッフのシフトスケジューリングを管理
- フィールド: `id`, `user_id`, `date`, `shift_type`, `custom_end_time`, `note`

### Edge Functions

**process-pdf-single:**
- エンドポイント: `/functions/v1/process-pdf-single`
- メソッド: POST (multipart/form-data)
- 必須: PDFファイル、カンパニーID
- 戻り値: 生成されたテキストとメタデータ

## 主要な実装詳細

### 環境変数

Frontend (`/app/frontend/.env`):
```env
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Backend (`/app/supabase/functions/process-pdf-single/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
```

### フロントエンド実装詳細

**パスエイリアス:**
- TypeScriptで `@/*` → `./src/*` の設定でクリーンなインポート

**PDFワーカー設定:**
- PDFレンダリング用にPDF.jsワーカーファイルを `public/pdfjs-dist/` にコピー必須

**会社固有機能:**
1. 現在の会社コンテキストは `useCompanyStore` で確認
2. 会社定数は `frontend/src/constants/company.ts` を参照
3. 会社固有プロンプトは `supabase/functions/process-pdf-single/prompts/` に配置

**Supabase統合:**
- クライアントは `frontend/lib/supabase.ts` で初期化
- API呼び出しは `frontend/lib/api.ts` に集約
- データベース型は `frontend/types/index.ts` で定義

### バックエンド実装詳細

**プロンプトレジストリ:**
- マッピングは `supabase/functions/process-pdf-single/promptRegistry.ts` で管理
- 各会社はバージョン付きプロンプトを持つ（例："V20250526"）
- 日本語テキスト処理用の厳密なフォーマットルール

**セキュリティ:**
- データベースアクセスにはSupabaseサービスロールを使用
- クロスオリジンリクエスト用のCORSヘッダー設定済み
- API障害に対する適切なエラーハンドリング

## 🚨 作業開始前の必須チェックリスト

**重要: 新しいタスクを開始する前に、必ず以下のチェックリストを確認してください。**

### 1. ブランチ確認
```bash
# 現在のブランチを確認
git branch --show-current

# 作業内容に応じて適切なブランチを作成
# ❌ 間違い: 既存のfeatureブランチで別の修正を行う
# ✅ 正解: 作業内容に応じた新しいブランチを作成
```

### 2. 作業内容の分類
作業を開始する前に、タスクの種類を判断：
- **新機能** → `feature/機能名` ブランチを作成
- **バグ修正** → `fix/バグ内容` ブランチを作成
- **緊急修正** → `hotfix/問題内容` ブランチを作成
- **CI/CD設定** → `fix/ci-設定内容` または `chore/ci-設定内容` ブランチを作成
- **ドキュメント** → `docs/内容` ブランチを作成

### 3. コミットの計画
**1つのコミットには1つの論理的な変更のみ**を含める：
- ❌ 「CI設定修正とlintエラー修正」を1つのコミットに
- ✅ 「fix: CI設定でworking-directoryを修正」と「fix: TypeScriptのany型エラーを修正」を別々に

### 4. 自動確認スクリプト
作業開始時に以下を実行して、適切なブランチにいることを確認：
```bash
# 現在のブランチとタスクの一致を確認
current_branch=$(git branch --show-current)
echo "現在のブランチ: $current_branch"
echo "これから行う作業内容と一致していますか？"
```

### 5. TodoWriteツールの活用
複雑なタスクは必ずTodoWriteツールで分解：
1. 各タスクを論理的な単位に分割
2. 1つのTodoが1つのコミットに対応するように計画
3. 異なる種類の修正は別々のブランチで実施

### 6. devブランチでの直接作業禁止
- **絶対にdevブランチで直接作業しない**
- 必ず作業内容に応じた専用ブランチを作成
- devブランチはマージ先としてのみ使用

## Gitブランチ戦略

このプロジェクトはGit-Flowの原則に従ったブランチ管理を行います：

### ブランチ構造
```
main (production-ready)
├── dev (development/integration)
├── feature/* (new features)
├── fix/* (bug fixes)
├── hotfix/* (urgent production fixes)
└── release/* (release preparation)
```

### ブランチタイプと使用法

1. **機能ブランチ** (`feature/*`)
   - 作成元: `dev`
   - マージ先: `dev`
   - 例: `feature/add-export-pdf`, `feature/multi-language-support`
   - 用途: 新機能、機能拡張

2. **修正ブランチ** (`fix/*`)
   - 作成元: `dev`
   - マージ先: `dev`
   - 例: `fix/pdf-viewer-crash`, `fix/auth-redirect-loop`
   - 用途: 開発環境での緊急でないバグ修正

3. **ホットフィックスブランチ** (`hotfix/*`)
   - 作成元: `main`
   - マージ先: `main` および `dev`
   - 例: `hotfix/critical-security-patch`, `hotfix/payment-processing`
   - 用途: 即座の修正が必要な本番環境の重大な問題

4. **リリースブランチ** (`release/*`)
   - 作成元: `dev`
   - マージ先: `main` および `dev`
   - 例: `release/1.2.0`, `release/2.0.0-beta`
   - 用途: リリース準備、最終テスト、バージョン更新

### ブランチ選択ガイドライン

どのブランチを作成するか決定する際：

- **新機能や機能拡張** → `feature/*`
- **開発環境のバグ** → `fix/*`
- **本番環境の重大なバグ** → `hotfix/*`
- **デプロイメント準備** → `release/*`
- **小さなドキュメント更新** → `dev` で直接作業可能

### 並列作業とGit Worktree

抽象的な依頼や複数の関連タスクを処理する際は、**git worktree**を使用して効率的に作業します：

#### Git Worktree の利点
- 複数ブランチの同時作業が可能
- ビルドキャッシュとnode_modulesを各worktreeで独立管理
- コンテキストスイッチのコストを削減
- 異なる機能の並列開発が容易

#### 使用する場面
1. **複数の独立した機能を同時開発**
   - 例：「認証システムの改善とPDF処理の最適化を行って」
   
2. **実験的な実装の比較検討**
   - 異なるアプローチを別々のworktreeで試行

3. **バグ修正と機能開発の並行作業**
   - mainからのhotfixとfeature開発を同時進行

#### Worktree 運用ルール
```bash
# メインリポジトリ構造
/app                          # メインworktree (通常はdev)
/app-worktrees/
  ├── feature-auth/          # 認証機能用worktree
  ├── feature-pdf/           # PDF機能用worktree
  └── hotfix-critical/       # 緊急修正用worktree

# 新しいworktreeの作成例
git worktree add ../app-worktrees/feature-auth feature/improve-auth-system

# 作業完了後の削除
git worktree remove ../app-worktrees/feature-auth
```

#### 自動Worktree管理
複雑なタスクを依頼された場合、以下のように自動判断します：

1. **タスクの分析**: 独立した作業単位を識別
2. **並列化の判断**: 2つ以上の独立タスクがある場合はworktree使用
3. **自動セットアップ**: 必要なworktreeを作成し、並列作業を開始
4. **進捗の同期**: 各worktreeでの作業状況を適切に管理

### ベストプラクティス

- **分かりやすい名前**: 変更内容を説明する明確なケバブケースの名前を使用
- **小さく焦点を絞った変更**: ブランチは単一の問題や機能に焦点を当てる
- **定期的な更新**: コンフリクトを避けるため定期的に `dev` と同期
- **テスト**: PR作成前に必ず `npm run build` と `npm run lint` を実行
- **クリーンな履歴**: 意味のあるコミットメッセージを使用

## テスト駆動開発（TDD）

このプロジェクトはテスト駆動開発の原則に従います。すべての新機能とバグ修正はTDDサイクルを使用して開発してください：

### TDDワークフロー

1. **レッドフェーズ**: 最初に失敗するテストを書く
   - 期待される動作を定義
   - テストを実行して失敗することを確認

2. **グリーンフェーズ**: テストをパスする最小限のコードを書く
   - テストをパスすることだけに集中
   - まだ最適化については心配しない

3. **リファクタフェーズ**: コードを改善する
   - 実装をクリーンアップ
   - すべてのテストがまだパスすることを確認

### テストガイドライン

**推奨テストフレームワーク:**

フロントエンド（React + TypeScript + Vite）:
- **Vitest**: Viteネイティブで高速、設定が簡単
- **React Testing Library**: ユーザー視点のコンポーネントテスト
- **MSW (Mock Service Worker)**: APIモックの業界標準
- **@vitest/ui**: テスト結果のビジュアル確認

バックエンド（Supabase Edge Functions）:
- **Deno Test**: Deno組み込みテストランナー（追加インストール不要）

**フロントエンドテストのセットアップ:**
```bash
cd /app/frontend
npm install --save-dev vitest @vitest/ui happy-dom
npm install --save-dev @testing-library/react @testing-library/user-event
npm install --save-dev @testing-library/jest-dom
npm install --save-dev msw

# package.jsonにテストスクリプトを追加
# "test": "vitest",
# "test:ui": "vitest --ui",
# "test:coverage": "vitest --coverage"
```

**Vitest設定（vite.config.ts）:**
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
```

**Test Structure:**
```typescript
describe('コンポーネント/関数名', () => {
  it('期待される動作を処理する', () => {
    // 準備
    // 実行
    // 検証
  });
  
  it('エッジケースを処理する', () => {
    // エッジケースのテスト
  });
});
```

**テストの優先順位:**
1. ビジネスロジックのユニットテスト
2. APIエンドポイントの統合テスト
3. 重要なUI要素のコンポーネントテスト
4. 重要なユーザーフローのE2Eテスト

**テストカバレッジ目標:**
- 80%のコードカバレッジを目指す
- 重要なビジネスロジックは100%カバレッジ
- 実装の詳細ではなく動作に焦点を当てる

## 自動コミットとPR作成

Claude Codeは適切な粒度でコミットとPR作成を自動的に処理します：

### 自動コミットガイドライン

**⚠️ 重要: コミット前の必須確認事項**
1. **現在のブランチが作業内容と一致しているか確認**
   ```bash
   git branch --show-current  # 必ず実行
   ```
2. **自動フォーマットを実行**
   ```bash
   # フロントエンドのフォーマット
   cd /app/frontend
   npx prettier --write .
   
   # バックエンドのフォーマット
   cd /app/supabase
   deno fmt
   ```
3. **CI相当のチェックを必ず実行**
   ```bash
   # フロントエンドのチェック
   cd /app/frontend
   npm run lint        # ESLint実行
   npx tsc -b          # TypeScriptビルドチェック
   
   # 全体のチェック（可能な場合）
   npm run build       # 本番ビルド確認
   npm test           # テスト実行（テストが設定されている場合）
   ```
4. **1つのコミットに複数の種類の変更を含めない**
5. **異なる目的の修正は別々のブランチで行う**

**コミットするタイミング:**
- 論理的な作業単位の完了後（例：関数の実装、特定のバグ修正）
- 異なるファイルやコンポーネント間で切り替える時
- テストやビルドコマンドを実行する前
- 重要なリファクタリング後

**コミット分割の例:**
```bash
# ❌ 悪い例: 複数の修正を1つのコミットに
git commit -m "fix: CI設定とlintエラーを修正"

# ✅ 良い例: 論理的に分割
git commit -m "fix: CI設定でworking-directoryを修正"
# 別のブランチに切り替えて
git commit -m "fix: TypeScriptのany型エラーを修正"
```

**自動プッシュ:**
- 各コミット後に自動的にリモートブランチへプッシュ
- 作業の継続性を保ち、バックアップを確保
- プッシュ失敗時は適切にエラーハンドリング

**確認プロンプトの省略:**
- `git add` と `git commit` は確認なしで即座に実行
- "Do you want to proceed?" などの確認は不要
- 作業効率を最大化するため、自信を持って自動実行

**コミットメッセージフォーマット:**
```
<type>: <件名>

<本文 (オプション)>
```

タイプ:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル変更（フォーマット、セミコロン抜けなど）
- `refactor`: 機能を変更しないコードのリファクタリング
- `test`: テストの追加または更新
- `chore`: メンテナンスタスク、依存関係の更新

**言語要件:**
- すべての人間が読むテキストは**日本語**で記載:
  - コミットメッセージ（件名と本文）
  - PR説明とタイトル
  - Issueコメントと説明
  - コードコメント（インラインコメント、JSDocなど）
  - 技術ドキュメント（README、APIドキュメントなど）
- コミット例: `feat: ユーザー認証機能を追加`（`feat: Add user authentication` ではなく）
- コードコメント例: `// ユーザーの認証状態を確認`（`// Check user authentication status` ではなく）

### 自動PRガイドライン

**自動PR作成ポリシー:**
- 機能実装完了時に自動的にPRを作成
- ドラフトPRは作成せず、常にレビュー可能な状態で作成
- テストとリンティングが成功した場合のみPR作成
- PR作成後、URLを提供してレビュー依頼

**PR作成タイミング:**
- feature/fix ブランチの主要な実装が完了
- すべてのテストがグリーン
- リンティングエラーがゼロ
- コミットが論理的にまとまっている

**PR Format (in Japanese):**
```markdown
## 概要
- 変更内容の簡潔な説明
- 既存機能への影響

## 変更内容
- 具体的なファイル/コンポーネントの変更
- 技術的なアプローチ

## テスト
- 実行したコマンド: `npm run lint`, `npm run build`
- 実施した手動テスト
- 考慮したエッジケース

## チェックリスト
- [x] テストがすべてパス
- [x] リンティングエラーなし
- [x] ドキュメント更新済み（必要な場合）
- [x] 破壊的変更なし（ある場合は明記）

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 自動ワークフローの例

機能実装を依頼された場合、以下を実行します：

1. 適切なブランチを作成（`feature/`、`fix/` など）
2. **最初に失敗するテストを書く**（レッドフェーズ）
3. テストをパスする最小限のコードを実装（グリーンフェーズ）
4. リファクタリングと最適化（リファクタフェーズ）
5. 各TDDサイクルで論理的なコミットを作成し、自動プッシュ
6. すべてのテストとリンティングを実行
7. 作業完了時にPRを作成
8. PR URLを提供

いつでも以下を指示できます：
- レビューを先に行いたい場合は「コミットを保留」
- 作業中のものをマージしたい場合は「今すぐPR作成」
- よりクリーンな履歴を好む場合は「コミットをスカッシュ」
- PRを作成したくない場合は「PRは不要」

**デフォルト動作:**
- 機能完成時は自動的にPRを作成
- ベストプラクティスに従い、レビュー可能な状態を維持
- PR説明文は実装内容を詳細に記載

### セッションコスト追跡

タスク完了後、現在のセッションコストを表示:
```bash
npx ccusage@latest session --json | jq -r '.sessions[] | select(.sessionId == "-app") | .totalCost'
```

これにより開発作業のAI使用コストを追跡できます。

### ワークフローの例
```bash
# For a new feature
git checkout dev
git pull origin dev
git checkout -b feature/add-email-notifications

# Make changes and test...
npm run lint
npm run build

# コミットと自動プッシュ（日本語メッセージ）
git add .
git commit -m "feat: カスタマイズ可能なテンプレートを使用したメール通知システムを追加"
git push origin feature/add-email-notifications  # 自動的に実行

# PR作成（日本語）
gh pr create --base dev --title "メール通知システムの追加" --body "..."

# For a hotfix
git checkout main
git pull origin main
git checkout -b hotfix/fix-auth-token-expiry

# Fix, test, and push...
# Create PRs to both main and dev
```

## コード品質基準

すべてのコードは、すでに複数のリファクタリングサイクルを経たかのように書いてください。最初から本番環境対応のクリーンなコードを書く：

### クリーンコードの原則

1. **Single Responsibility Principle (SRP)**
   - 各関数・クラスは1つの責任のみを持つ
   - 1つの関数は1つのことだけを行う

2. **DRY (Don't Repeat Yourself)**
   - 重複コードを避け、再利用可能な関数・コンポーネントを作成
   - 共通ロジックは適切に抽出する

3. **KISS (Keep It Simple, Stupid)**
   - シンプルで理解しやすいコードを書く
   - 過度に複雑な実装を避ける

4. **YAGNI (You Aren't Gonna Need It)**
   - 現在必要な機能のみを実装
   - 将来の仮定に基づいた過剰な実装を避ける

### リファクタリングガイドライン

**命名規則:**
- 変数名・関数名は意図が明確にわかる名前にする
- `data`, `temp`, `item` などの曖昧な名前を避ける
- 日本語のコメントがなくても理解できる名前を使う

**関数の設計:**
```typescript
// ❌ 悪い例
function processUserData(u: any) {
  // 複数の責任を持つ長い関数
  const d = u.data;
  // 処理...
}

// ✅ 良い例
function validateUserEmail(email: string): boolean {
  // 単一責任で明確な関数
  return EMAIL_REGEX.test(email);
}
```

**エラーハンドリング:**
- 適切なエラー処理を最初から実装
- カスタムエラークラスを活用
- エラーメッセージは具体的で actionable に

**型安全性:**
- TypeScript の型を最大限活用
- `any` 型の使用を避ける
- 型推論に頼らず明示的な型定義を行う

**パフォーマンス考慮:**
- 不要な再レンダリングを避ける（React.memo, useMemo, useCallback）
- 大量データは仮想スクロールやページネーションを使用
- 重い処理は Web Worker や遅延読み込みを検討

### コードレビューチェックリスト

コードを書く際は以下を自己チェック:
- [ ] 関数は10行以内に収まっているか
- [ ] 複雑度（Cyclomatic Complexity）は低いか
- [ ] 適切な抽象化レベルか
- [ ] テストしやすい設計か
- [ ] エッジケースを考慮しているか
- [ ] パフォーマンスのボトルネックはないか

## エラーハンドリングとロギング

### エラーハンドリング原則
- すべてのエラーは適切にキャッチし、ユーザーフレンドリーなメッセージを表示
- エラー境界（Error Boundary）を使用してReactコンポーネントのクラッシュを防ぐ
- APIエラーは統一されたフォーマットで処理
- カスタムエラークラスで詳細な情報を保持

### ロギング戦略
- 開発環境：console.log使用可（本番では自動削除）
- エラーログ：Supabaseのログ機能を活用
- 重要なユーザーアクション（PDF処理、認証など）はトラッキング
- 構造化ログで検索・分析を容易に

## パフォーマンス最適化

### フロントエンド最適化
- React.lazy()とSuspenseによる遅延読み込み
- 画像の最適化（WebP形式、適切なサイズ、lazy loading）
- Bundle分割（vendor、app、pages）
- Service Workerによるキャッシュ戦略

### PDF処理の最適化
- 大きなPDFは分割処理（10MB以上）
- Web Workerでの重い処理実行
- プログレスバーでユーザーフィードバック
- メモリリークを防ぐための適切なクリーンアップ

## セキュリティガイドライン

### 認証・認可
- Supabase RLS（Row Level Security）の厳格な適用
- JWTトークンの適切な管理（HttpOnly Cookie推奨）
- セッションタイムアウトの設定（30分）
- 多要素認証（MFA）の実装検討

### データ保護
- 個人情報は最小限の保存（データ最小化原則）
- PDFアップロード時のファイルタイプ検証
- XSS対策（React自動エスケープ活用）
- CSRFトークンの実装

## デバッグとトラブルシューティング

### よくある問題と解決策
1. **Supabase接続エラー**
   - 環境変数確認（VITE_PUBLIC_SUPABASE_URL、VITE_PUBLIC_SUPABASE_ANON_KEY）
   - ネットワーク接続確認
   - Supabaseプロジェクトの状態確認

2. **PDF処理タイムアウト**
   - ファイルサイズ制限確認（デフォルト5MB）
   - Edge Function実行時間制限（最大10秒）
   - Gemini APIレート制限確認

3. **ビルドエラー**
   - node_modules削除して再インストール
   - TypeScriptバージョン互換性確認
   - Viteキャッシュクリア

### デバッグツール
- React Developer Tools（コンポーネント階層確認）
- Supabase Dashboard（データベース状態、ログ確認）
- Chrome DevTools Network タブ（API通信確認）
- Vite DevTools（ビルド分析）

## CI/CDと自動化

### GitHub Actions設定
```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, dev]
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci
      - name: Run frontend lint
        working-directory: ./frontend
        run: npm run lint
      - name: Run frontend build
        working-directory: ./frontend
        run: npm run build
      # テストが設定されている場合のみ有効化
      # - name: Run frontend tests
      #   working-directory: ./frontend
      #   run: npm test
```

### 品質ゲート
- テストカバレッジ80%以上
- TypeScriptエラー0
- ESLintエラー0
- ビルドサイズ監視（増加率10%以内）

### デプロイメント戦略
- main → 本番環境（Vercel）
- dev → ステージング環境
- feature/* → プレビュー環境

## データベース管理

### マイグレーション戦略
- すべての変更はマイグレーションファイルで管理
- ロールバック可能な設計（down関数必須）
- 本番適用前にステージング環境でテスト
- マイグレーション実行履歴の管理

### 命名規則
- マイグレーション: `YYYYMMDDHHMMSS_description.sql`
- テーブル: 複数形（例：users, work_orders）
- カラム: スネークケース（例：created_at, user_id）
- インデックス: `idx_table_column`
- 外部キー: `fk_table_reference`

### バックアップ戦略
- 日次自動バックアップ（Supabase Pro）
- 重要な変更前の手動バックアップ
- ポイントインタイムリカバリの活用

## 重要な注意事項

- テストフレームワーク：Vitest（推奨）、現在は未設定
- Tailwind CSS v4をViteプラグインで使用（PostCSSではない）
- フロントエンドはVercelでSPAルーティング設定済み
- PDF処理にはバックエンドのGemini APIキー設定が必要
- データベースはSupabase経由でPostgreSQL 15を使用
- Edge FunctionsはDeno v1ランタイムを使用
- ローカル開発にはSupabaseサービス用のDockerが必要