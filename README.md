````markdown
# Magiq (仮称)

## 概要

Magiq は、PDF 作業指示書のアップロード、AI による情報抽出、およびシフト管理機能を提供する Web アプリケーションです。管理者はプロジェクトの管理や作業指示書の処理状況の確認が可能です。企業ごとの設定に対応し、柔軟な運用を実現します。

_(ここにプロジェクトの目的、解決する課題、主要なターゲットユーザーについてさらに詳細を記述してください)_

## 主な機能

- **PDF 作業指示書の管理**:
  - PDF ファイルのアップロード、プレビュー機能 ([`frontend/src/components/workOrderTool/FileManagementPanel.tsx`](frontend/src/components/workOrderTool/FileManagementPanel.tsx), [`PdfPreviewPanel.tsx`](frontend/src/components/workOrderTool/PdfPreviewPanel.tsx))
  - ファイルごとの処理ステータスの管理
- **AI による情報抽出**:
  - アップロードされた PDF から、Google Gemini API を利用して関連情報を自動抽出 ([`supabase/functions/process-pdf-single/index.ts`](supabase/functions/process-pdf-single/index.ts) を参照)
  - 企業や帳票の種類に応じたプロンプトによる柔軟な情報抽出 ([`supabase/functions/process-pdf-single/promptRegistry.ts`](supabase/functions/process-pdf-single/promptRegistry.ts) および関連プロンプトファイル [`supabase/functions/process-pdf-single/prompts/`](supabase/functions/process-pdf-single/prompts/) を参照)
  - 抽出されたテキストの表示と編集 ([`frontend/src/components/workOrderTool/GeneratedTextPanel.tsx`](frontend/src/components/workOrderTool/GeneratedTextPanel.tsx))
- **シフト管理**:
  - シフトの作成、編集、提出機能 ([`frontend/src/pages/ShiftForm.tsx`](frontend/src/pages/ShiftForm.tsx) を参照)
  - 次回のシフト情報表示 ([`frontend/src/components/dashboard/NextShiftCard.tsx`](frontend/src/components/dashboard/NextShiftCard.tsx) を参照)
  - シフト提出完了画面 ([`frontend/src/pages/ShiftComplete.tsx`](frontend/src/pages/ShiftComplete.tsx) を参照)
- **ダッシュボード**:
  - ユーザー向けダッシュボード ([`frontend/src/pages/Dashboard.tsx`](frontend/src/pages/Dashboard.tsx) を参照)
  - 提出状況の確認 ([`frontend/src/components/dashboard/SubmissionStatusCard.tsx`](frontend/src/components/dashboard/SubmissionStatusCard.tsx) を参照)
  - クイックアクション ([`frontend/src/components/dashboard/QuickActions.tsx`](frontend/src/components/dashboard/QuickActions.tsx))
- **管理者機能**:
  - 管理者向けダッシュボード ([`frontend/src/pages/admin/AdminDashboard.tsx`](frontend/src/pages/admin/AdminDashboard.tsx) を参照)
  - プロジェクト作成・一覧表示・割当 ([`frontend/src/pages/admin/ProjectForm.tsx`](frontend/src/pages/admin/ProjectForm.tsx), [`ProjectList.tsx`](frontend/src/pages/admin/ProjectList.tsx), [`ProjectAssign.tsx`](frontend/src/pages/admin/ProjectAssign.tsx), [`AssignedProjectList.tsx`](frontend/src/pages/admin/AssignedProjectList.tsx) を参照)
  - 作業指示書ツール (PDF 処理のインターフェース) ([`frontend/src/pages/admin/WorkOrderTool.tsx`](frontend/src/pages/admin/WorkOrderTool.tsx) を参照)
- **ユーザー認証**:
  - Supabase Auth を利用したログイン機能 ([`frontend/src/pages/Login.tsx`](frontend/src/pages/Login.tsx) を参照)
  - 保護されたルートによるアクセス制御 ([`frontend/src/components/auth/ProtectedRoute.tsx`](frontend/src/components/auth/ProtectedRoute.tsx) を参照)
- **企業別設定**:
  - 企業 ID に基づいた動的な設定の適用 ([`frontend/src/setCompanyId.ts`](frontend/src/setCompanyId.ts), [`frontend/src/store/useCompanyStore.ts`](frontend/src/store/useCompanyStore.ts) を参照)
  - 設定ファイルによるカスタマイズ ([`frontend/public/config/active.json`](frontend/public/config/active.json), [`frontend/src/config/default.json`](frontend/src/config/default.json) を参照)

## 技術スタック

### フロントエンド

- **フレームワーク/ライブラリ**: React, Vite, React Router
- **言語**: TypeScript
- **UI コンポーネント**: Shadcn/ui (これは [`frontend/components.json`](frontend/components.json) 及び [`frontend/src/components/ui/`](frontend/src/components/ui/) ディレクトリ構造から強く推測されます)
- **スタイリング**: Tailwind CSS (Shadcn/ui の依存関係として一般的です。[`frontend/src/global.css`](frontend/src/global.css), [`frontend/src/index.css`](frontend/src/index.css) も参照)
- **状態管理**: Zustand ([`frontend/src/store/useCompanyStore.ts`](frontend/src/store/useCompanyStore.ts) から推測)
- **PDF 表示**: `react-pdf` (PDF プレビュー関連のフック [`usePdfDocument.ts`](frontend/src/hooks/usePdfDocument.ts), [`usePdfControls.ts`](frontend/src/hooks/usePdfControls.ts) やコンポーネント [`PdfPreviewPanel.tsx`](frontend/src/components/workOrderTool/PdfPreviewPanel.tsx) などから推測)
- **日付処理**: (不明、`frontend/package.json`を確認してください。Day.js, date-fns などが一般的です。)
- **通知 (トースト)**: Sonner ([`frontend/src/components/ui/sonner.tsx`](frontend/src/components/ui/sonner.tsx) から)
- **ドラッグ＆ドロップ**: ([`frontend/src/hooks/useDragAndDrop.ts`](frontend/src/hooks/useDragAndDrop.ts) からカスタム実装またはライブラリ使用の可能性)
- **API クライアント**: `Workspace` または `axios` (詳細は [`frontend/src/lib/api.ts`](frontend/src/lib/api.ts) を確認してください)
- **ビルドツール**: Vite ([`frontend/vite.config.ts`](frontend/vite.config.ts))
- **その他**: `frontend/package.json` を確認して、主要なライブラリをリストアップし、このセクションを更新してください。

### バックエンド

- **プラットフォーム**: Supabase
  - **データベース**: PostgreSQL (Supabase 標準)
  - **認証**: Supabase Auth
  - **ストレージ**: Supabase Storage (PDF ファイルの保存など)
  - **サーバーレス関数**: Supabase Edge Functions (Deno ランタイム)
    - PDF 処理関数: [`supabase/functions/process-pdf-single/index.ts`](supabase/functions/process-pdf-single/index.ts)

### AI

- **モデル**: Google Gemini API (Supabase Function 内での利用。[`supabase/functions/process-pdf-single/index.ts`](supabase/functions/process-pdf-single/index.ts) を参照)
  - **SDK**: `@google/genai` を使用していることを確認してください (ユーザー設定より)。

### 開発環境

- **コンテナ技術**: Docker, Docker Compose ([`docker-compose.yml`](docker-compose.yml) を参照)
- **開発コンテナ**: Visual Studio Code Dev Containers ([`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json), [`postCreateCommand.sh`](.devcontainer/postCreateCommand.sh) を参照)
- **CLI**: Supabase CLI (`npm install -g supabase`)

## セットアップと実行方法

### 前提条件

- Docker と Docker Compose
- Node.js (推奨バージョンは `frontend/package.json` の `engines` フィールドや `.nvmrc` ファイルを確認してください。なければ LTS 版を推奨)
- npm (Node.js に同梱) または yarn (プロジェクトで統一されている方)
- Supabase CLI (`npm install -g supabase`)
- Google Gemini API キー

### 環境変数の設定

プロジェクトルート、または `frontend` ディレクトリおよび `supabase/functions/process-pdf-single` ディレクトリに必要な `.env` ファイルを作成します。

1.  **Supabase 用環境変数**:
    ローカル開発時、Supabase CLI は通常、内部で必要なキーを管理しますが、Function から外部サービス (Gemini API) を利用する場合、そのキーを Function の環境変数として設定する必要があります。
    `supabase/functions/process-pdf-single/.env` ファイルを作成し、以下のように記述します:

    ```env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

    Supabase のプロジェクト URL や anon/service キーは、CLI がローカル起動時にターミナルに出力します。フロントエンドや Function 内で明示的に必要な場合は、それらも環境変数として設定できます。

2.  **フロントエンド用環境変数**:
    `frontend/.env` ファイルを作成し、ローカル Supabase インスタンスの URL と anon キーを設定します。これらは `supabase start` コマンド実行時に表示されます。

    ```env
    VITE_SUPABASE_URL=http://localhost:54321 # supabase start時の出力で確認
    VITE_SUPABASE_ANON_KEY=YOUR_LOCAL_SUPABASE_ANON_KEY # supabase start時の出力で確認
    ```

    これらの変数は [`frontend/src/lib/supabase.ts`](frontend/src/lib/supabase.ts) で使用されています。

    _(他にプロジェクト特有の環境変数があれば、その設定方法を追記してください。例えば、`frontend/public/config/active.json` で指定する `companyId` のデフォルト値など)_

### ローカル開発環境のセットアップ

1.  **リポジトリをクローン**:

    ```bash
    git clone <repository-url>
    cd magiq
    ```

2.  **Supabase サービスの起動**:
    Docker Desktop が起動していることを確認してください。

    ```bash
    supabase start
    ```

    これにより、ローカルの PostgreSQL データベース、Supabase Studio (通常 `http://localhost:54323`) などが起動します。
    出力された **API URL** と **anon key** をメモし、`frontend/.env` ファイルに設定してください。

3.  **データベースマイグレーションの適用**:
    Supabase サービスが起動した後、初期のデータベーススキーマをセットアップします。

    ```bash
    supabase db reset
    ```

    これにより、[`supabase/migrations`](supabase/migrations/) ディレクトリ内の SQL ファイルが実行され、テーブルが作成されます。
    _注意: `db reset` は既存のローカルデータを全て削除します。新しいマイグレーションのみを適用したい場合は `supabase migration up` を使用しますが、開発初期段階では `db reset` が一般的です。_

4.  **フロントエンドのセットアップ**:

    ```bash
    cd frontend
    npm install
    ```

5.  **フロントエンド開発サーバーの起動**:
    ```bash
    npm run dev
    ```
    通常、`http://localhost:5173` (Vite のデフォルト) でアプリケーションにアクセスできます。

### Dev Container を使用する場合

このプロジェクトには VS Code Dev Container の設定が含まれています ([`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json))。

1.  VS Code でプロジェクトを開きます。
2.  "Reopen in Container" のプロンプトが表示されたら、それをクリックします。
3.  コンテナがビルドされ、開発環境が起動します。[`postCreateCommand.sh`](.devcontainer/postCreateCommand.sh) により、一部のセットアップ (例: `npm install`) が自動実行される場合があります。
4.  コンテナ内のターミナルで、上記の「Supabase サービスの起動」からの手順 (Supabase CLI コマンド、環境変数設定など) を実行してください。

## ディレクトリ構成
````

.
├── .devcontainer/ # VS Code Dev Container 設定
├── .vscode/ # VS Code ワークスペース設定
├── frontend/ # React フロントエンドアプリケーション
│ ├── public/
│ │ ├── config/ # 企業別設定ファイル (active.json)
│ │ └── pdfjs-dist/ # PDF.js worker (react-pdf が使用)
│ ├── src/
│ │ ├── assets/ # 静的アセット (画像など) - 現在は空の可能性
│ │ ├── components/ # 再利用可能な React コンポーネント
│ │ │ ├── auth/
│ │ │ ├── dashboard/
│ │ │ ├── layout/
│ │ │ ├── ui/ # Shadcn/ui コンポーネント
│ │ │ └── workOrderTool/
│ │ ├── config/ # デフォルト設定 (default.json)
│ │ ├── constants/ # 定数 (company.ts など)
│ │ ├── hooks/ # カスタム React フック
│ │ ├── lib/ # API クライアント (api.ts), Supabase クライアント (supabase.ts), ユーティリティ (utils.ts)
│ │ ├── pages/ # 各ページのコンポーネント
│ │ │ └── admin/ # 管理者向けページ
│ │ ├── store/ # 状態管理ストア (Zustand - useCompanyStore.ts)
│ │ ├── types/ # TypeScript 型定義 (index.ts)
│ │ ├── utils/ # 汎用ユーティリティ関数 (getTargetShiftWeek.ts, shiftHelpers.ts)
│ │ ├── App.tsx # アプリケーションのメインコンポーネント
│ │ ├── main.tsx # アプリケーションのエントリポイント、ルーティング設定
│ │ └── setCompanyId.ts # 企業 ID 設定ロジック
│ ├── index.html # メイン HTML ファイル
│ ├── package.json # フロントエンドの依存関係とスクリプト
│ ├── vite.config.ts # Vite 設定
│ └── tsconfig.json # TypeScript 設定
├── supabase/ # Supabase バックエンド設定
│ ├── functions/ # Supabase Edge Functions
│ │ └── process-pdf-single/ # PDF 処理と Gemini API 連携 Function
│ │ ├── prompts/ # Gemini API 向けプロンプト定義 (企業・帳票ごと)
│ │ ├── index.ts # Function 本体
│ │ ├── deno.json # Deno 設定ファイル (Function 用)
│ │ └── promptRegistry.ts # プロンプト選択ロジック
│ ├── migrations/ # データベースマイグレーション SQL ファイル
│ ├── config.toml # Supabase プロジェクト設定 (ローカル開発用、CLI が主に管理)
│ └── tsconfig.json # TypeScript 設定 (Supabase Functions 開発用)
├── .gitignore
├── docker-compose.yml # Supabase ローカル開発用 Docker Compose 設定 (Supabase CLI が内部で使用)
├── eslint.config.js # ESLint 設定 (ルート)
├── README.md # このファイル
└── (その他の設定ファイル: .prettierrc.yaml, etc.)

````

## 主要機能の詳細説明

### 1. PDF処理機能 (`process-pdf-single` Function)

* **役割**: フロントエンドからアップロードされたPDFファイルを受け取り、内容を解析し、Google Gemini API を用いて指定された情報を抽出するSupabase Edge Functionです。
* **トリガー**: フロントエンドの作業指示書ツール ([`frontend/src/pages/admin/WorkOrderTool.tsx`](frontend/src/pages/admin/WorkOrderTool.tsx)) から、[`frontend/src/lib/api.ts`](frontend/src/lib/api.ts) の `uploadAndProcessPdf` 関数などを介してHTTPリクエストで呼び出されます。
* **処理フロー**:
    1.  リクエストからPDFファイルデータ、企業ID (`companyId`)、プロンプト種別 (`promptType`) などのメタデータを受け取ります。
    2.  PDFの内容をテキストとして抽出します。(Function内で使用されているPDF解析ライブラリを確認してください。Denoで動作するものが必要です。)
    3.  [`promptRegistry.ts`](supabase/functions/process-pdf-single/promptRegistry.ts) を使用して、`companyId` と `promptType` に応じたプロンプト定義を取得します。プロンプトは [`supabase/functions/process-pdf-single/prompts/`](supabase/functions/process-pdf-single/prompts/) ディレクトリ以下に企業・帳票ごとにTypeScriptファイルとして定義されています (例: [`noharaG.ts`](supabase/functions/process-pdf-single/prompts/noharaG.ts), [`katouBeniyaIkebukuro/misawa.ts`](supabase/functions/process-pdf-single/prompts/katouBeniyaIkebukuro/misawa.ts))。
    4.  取得したプロンプトとPDFから抽出したテキストをGoogle Gemini APIに送信し、構造化されたデータまたはテキストの形で結果を取得します。
        * **重要**: Google推奨の`@google/genai`ライブラリを使用しているか確認してください。
    5.  抽出結果を整形し、フロントエンドにJSON形式で返却します。
    6.  抽出結果や処理ステータスをSupabaseデータベースの `work_orders` テーブル ([`supabase/migrations/20250518014841_create_work_orders_table.sql`](supabase/migrations/20250518014841_create_work_orders_table.sql) 参照) に保存する処理が含まれている可能性があります。
* **設定**:
    * Gemini APIキーは環境変数 `GEMINI_API_KEY` でFunctionに設定します。

### 2. シフト管理機能

* **シフトフォーム ([`frontend/src/pages/ShiftForm.tsx`](frontend/src/pages/ShiftForm.tsx))**:
    * ユーザーが自身のシフト情報を入力・編集・提出するためのフォームです。
    * 入力されたデータはSupabaseデータベースの `shifts` テーブル ([`supabase/migrations/20250521131433_create_shifts.sql`](supabase/migrations/20250521131433_create_shifts.sql) 参照) に保存されます。
    * 入力支援のためのヘルパー関数 ([`frontend/src/utils/shiftHelpers.ts`](frontend/src/utils/shiftHelpers.ts), [`getTargetShiftWeek.ts`](frontend/src/utils/getTargetShiftWeek.ts)) を利用しています。
* **次回のシフト表示 ([`frontend/src/components/dashboard/NextShiftCard.tsx`](frontend/src/components/dashboard/NextShiftCard.tsx))**:
    * ダッシュボード上で、ユーザーの直近の登録済みシフト情報を表示します。
* **提出完了画面 ([`frontend/src/pages/ShiftComplete.tsx`](frontend/src/pages/ShiftComplete.tsx))**:
    * シフト提出が正常に完了したことをユーザーに通知します。

### 3. 設定ファイルと企業別カスタマイズ

* **企業IDの特定**:
    * アプリケーションは、何らかの方法 (URLのパス、サブドメイン、ユーザープロファイルなど) で現在の `companyId` を特定します。このロジックは [`frontend/src/setCompanyId.ts`](frontend/src/setCompanyId.ts) や関連する初期化処理に含まれている可能性があります。
    * 特定された `companyId` は Zustand ストア ([`frontend/src/store/useCompanyStore.ts`](frontend/src/store/useCompanyStore.ts)) に保存され、アプリケーション全体で利用されます。
* **設定ファイルの読み込み**:
    * [`frontend/public/config/active.json`](frontend/public/config/active.json): アプリケーションが現在どの企業の設定を使用すべきかを示すために使われる可能性があります (例: `{"companyId": "noharaG"}` のような内容で、ビルド時やデプロイ時に動的に生成または配置される想定)。
    * [`frontend/src/config/default.json`](frontend/src/config/default.json): アプリケーション全体のデフォルト設定を定義します。
    * 企業固有の設定: `companyId` に基づいて、特定の企業向けの設定 (例: `frontend/public/config/${companyId}.json` という命名規則のファイルや、`default.json` 内の企業別セクション) が読み込まれ、デフォルト設定を上書きする可能性があります。この具体的な仕組みは `useCompanyStore` や設定読み込みロジックを確認してください。
* **カスタマイズ内容**:
    * 企業ロゴ、テーマカラー、APIエンドポイントの接頭辞、特定の機能の有効/無効、PDF処理に使用するプロンプトのデフォルト値などが考えられます。

## API (Supabase Functions)

### `/functions/v1/process-pdf-single` (Supabase Functionの標準的なパス)
* **メソッド**: `POST`
* **説明**: PDFファイルを処理し、AI (Gemini) を用いて情報を抽出します。
* **認証**: Supabaseの認証ヘッダー (`Authorization: Bearer <SUPABASE_JWT>`) が必要です。FunctionのCORS設定 (`Access-Control-Allow-Origin`) も適切に設定されている必要があります。
* **リクエストボディ**: `FormData` (multipart/form-data)
    * `file`: アップロードするPDFファイル
    * `companyId`: (string) 処理対象の企業ID
    * `promptType`: (string) 使用するプロンプトの種別 (例: `default`, `workOrderTypeA` など)
    * *(その他、Functionが必要とするパラメータがあれば追記)*
* **レスポンス (成功時 - 例)**: `application/json`
    ```json
    {
      "extractedData": {
        "field1": "value1",
        "field2": "value2",
        // Gemini APIからの抽出結果に基づいた構造
      },
      "message": "PDF processed successfully."
      // work_order_id や storage_path などの情報も含む可能性あり
    }
    ```
* **レスポンス (エラー時 - 例)**: `application/json`
    ```json
    {
      "error": "Error message describing the issue (e.g., PDF parsing failed, Gemini API error, Missing parameters)"
    }
    ```
*(他のSupabase Functionがあれば、同様に記述してください。)*

## TypeScript と コーディング規約

* このプロジェクトでは、フロントエンド・バックエンド (Supabase Functions) 共にTypeScriptが使用されています。
* **暗黙の`any`型は禁止されています。** 全ての変数や関数には型を明示するか、TypeScriptが適切に型推論できるように記述してください (ユーザー設定より)。
* コードフォーマットにはPrettierが設定されています ([`.prettierrc.yaml`](.prettierrc.yaml) および [`frontend/.prettierrc.js`](frontend/.prettierrc.js))。
* リンティングにはESLintが設定されています ([`eslint.config.js`](eslint.config.js))。
* 開発時には、エディタのフォーマット・リンティング機能を有効にし、コミット前にコードが規約に準拠していることを確認してください。

## 注意事項と今後のTODO

* **`frontend/package.json` を確認し、[技術スタック](#技術スタック)セクションを正確な情報で更新してください。** 特に、日付処理ライブラリや具体的なPDF解析ライブラリなど。
* 各機能の詳細なロジックやAPIの正確なリクエスト/レスポンス形式については、ソースコード (特にTypeScriptの型定義) を参照し、必要に応じてこのREADMEを更新してください。
* エラーハンドリングやセキュリティに関する詳細な記述が不足しています。プロジェクトの進捗に合わせて追記してください。
* テスト戦略 (単体テスト、結合テスト、E2Eテスト) についても記述を追加することを推奨します。

## ライセンス

c: kanatani
````
