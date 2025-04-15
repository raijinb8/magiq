# Magiq

Magiq は、現場作業問題をITで解決することを目的とした、容易な現場向け半SaaSプロダクトです。

現場工程のシフト管理、内金申請、現場終了報告、KY画像提出等、作業者と事務方の作業コミュニケーションを溜さず、だれでも簡単に利用できるUIを持ちます。

---

## 使用技術

- **React (Vite)**
- **Supabase (Auth, DB)**
- **Tailwind CSS**
- **Zustand** (state management)
- **shadcn/ui** (UI component library)

---

## ディレクトリ構成

```bash
src/
├── pages/         # 画面単位
├── components/    # 内部UIコンポーネント
│   ├── ui/        # shadcnコンポーネント
│   └── dashboard/ # ダッシュボード用
├── config/        # 設定json
├── lib/           # supabaseなどのラッパー関連
```

---

## 機能概要

- ログイン/ログアウト (Supabase Auth)
- 現場シフトの申請 (ShiftForm)
- ダッシュボード
  - 今週の現場予定
  - 現場終了報告ステータス
  - KY画像提出ステータス
  - 内金申請ステータス

---

## 開発環境構築

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

必要な.env設定:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Supabase DBスキーマ

### テーブル: `shifts`

| column          | type      | description              |
| --------------- | --------- | ------------------------ |
| id              | uuid      | primary key              |
| user_id         | uuid      | FK to `auth.users.id`    |
| date            | date      | 現場日付                 |
| shift_type      | text      | full / pm / custom / off |
| custom_end_time | time      | 時間指定ありの場合       |
| note            | text      | 備考項目                 |
| created_at      | timestamp | 自動登録 (now())         |

---

## 開発メモ

- `created_at` はSupabase上でUTC時間として保存されます

  - 表示時は `toLocaleString('ja-JP')` などで日本時間に変換

- Row Level Security (RLS)を使用
  - `user_id = auth.uid()` で入力者未発表の第三者アクセスを防止

---

## 未完成 / TODO

- [ ] 現場情報DB連携
- [ ] 内金申請フォーム
- [ ] 終了報告画面
- [ ] ロール別の設定分岐
- [ ] 管理者用ビューの分離

---

任意のPR歓迎です。
