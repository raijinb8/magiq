-- supabase/migrations/xxxxxxxxxxxxxx_create_work_orders_table.sql
-- もし supabase stop して再度 supabase start した場合や、
-- 特に supabase db reset を実行した場合、UIで行った変更は失われ、
-- マイグレーションファイル（.sql）に基づいた状態に戻ってしまう。
CREATE TABLE public.work_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT, -- NULL許可
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- 慣習的にアップロード日時は必須とし、デフォルトで現在時刻
    company_name TEXT, -- 'null'::text、NULL許可
    prompt_identifier TEXT, -- 'null'::text、NULL許可
    generated_text TEXT, -- 'null'::text、NULL許可
    edited_text TEXT, -- 'null'::text、NULL許可
    status TEXT DEFAULT 'processing' NOT NULL, -- デフォルト値があり、通常ステータスは必須のためNOT NULLと解釈
    error_message TEXT, -- 'null'::text、NULL許可
    gemini_processed_at TIMESTAMPTZ DEFAULT now(), -- Gemini処理時刻、デフォルトで現在時刻だが、処理前はNULLになる可能性を考慮しNULL許可
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- レコード作成日時は必須
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL  -- レコード更新日時は必須 (トリガーで自動更新も一般的)
);