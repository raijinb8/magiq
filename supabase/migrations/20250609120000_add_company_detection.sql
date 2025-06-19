-- 会社自動判定機能のためのデータベーススキーマ拡張

-- 1. work_ordersテーブルに自動判定関連のカラムを追加
ALTER TABLE public.work_orders 
ADD COLUMN IF NOT EXISTS detected_company_id TEXT,
ADD COLUMN IF NOT EXISTS detection_confidence DECIMAL(3,2) CHECK (detection_confidence >= 0 AND detection_confidence <= 1),
ADD COLUMN IF NOT EXISTS detection_method TEXT, -- 'content_analysis', 'pattern_match', 'manual_override' など
ADD COLUMN IF NOT EXISTS detection_metadata JSONB, -- 判定の詳細情報を保存
ADD COLUMN IF NOT EXISTS final_company_id TEXT; -- 最終的に使用された会社ID（手動修正後）

-- インデックスを追加（検索性能向上のため）
CREATE INDEX IF NOT EXISTS idx_work_orders_detected_company ON public.work_orders(detected_company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_final_company ON public.work_orders(final_company_id);

-- 2. 会社判定履歴テーブルの作成（学習・改善用）
CREATE TABLE IF NOT EXISTS public.company_detection_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id uuid REFERENCES public.work_orders(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    detected_company_id TEXT,
    detection_confidence DECIMAL(3,2),
    detection_details JSONB, -- 判定理由の詳細（検出された文言、パターンなど）
    user_corrected_company_id TEXT, -- ユーザーが修正した場合の会社ID
    correction_reason TEXT, -- 修正理由（オプション）
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_detection_history_work_order ON public.company_detection_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_detected ON public.company_detection_history(detected_company_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_corrected ON public.company_detection_history(user_corrected_company_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_created_at ON public.company_detection_history(created_at DESC);

-- 3. 会社判定ルール設定テーブルの作成（管理画面で設定可能）
CREATE TABLE IF NOT EXISTS public.company_detection_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'pattern', 'address', 'logo_text')),
    rule_value TEXT NOT NULL, -- キーワード、正規表現パターンなど
    priority INTEGER DEFAULT 0, -- 優先度（高い値ほど優先）
    is_active BOOLEAN DEFAULT true,
    description TEXT, -- ルールの説明
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_detection_rules_company ON public.company_detection_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_detection_rules_active ON public.company_detection_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_detection_rules_type ON public.company_detection_rules(rule_type);

-- 4. 初期判定ルールの挿入
INSERT INTO public.company_detection_rules (company_id, rule_type, rule_value, priority, description) VALUES
-- 野原G住環境のルール
('NOHARA_G', 'keyword', '野原G住環境', 100, '会社名の完全一致'),
('NOHARA_G', 'keyword', '野原G', 90, '会社名の部分一致'),
('NOHARA_G', 'keyword', '野原グループ', 80, '会社グループ名'),
('NOHARA_G', 'pattern', '野原.*住環境', 70, '会社名のパターンマッチ'),

-- 加藤ベニヤ池袋_ミサワホームのルール
('KATOUBENIYA_IKEBUKURO_MISAWA', 'keyword', '加藤ベニヤ', 100, '会社名の部分一致'),
('KATOUBENIYA_IKEBUKURO_MISAWA', 'keyword', 'ミサワホーム', 100, '発注元の一致'),
('KATOUBENIYA_IKEBUKURO_MISAWA', 'keyword', '加藤ベニヤ池袋', 95, '会社名の詳細一致'),
('KATOUBENIYA_IKEBUKURO_MISAWA', 'address', '池袋', 60, '地域名の一致'),
('KATOUBENIYA_IKEBUKURO_MISAWA', 'pattern', '加藤ベニヤ.*ミサワ', 85, 'パターンマッチ')
ON CONFLICT DO NOTHING;

-- 5. 更新日時の自動更新トリガー（detection_rulesテーブル用）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_detection_rules_updated_at 
BEFORE UPDATE ON public.company_detection_rules 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) の設定
ALTER TABLE public.company_detection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_detection_rules ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは履歴を読み取り可能、作成可能
CREATE POLICY "Authenticated users can read detection history" 
ON public.company_detection_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create detection history" 
ON public.company_detection_history FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- 管理者のみルールを編集可能（仮の実装、実際の管理者判定は要調整）
CREATE POLICY "Anyone can read detection rules" 
ON public.company_detection_rules FOR SELECT 
TO authenticated 
USING (true);

-- TODO: 管理者権限の実装後、以下のポリシーを調整
CREATE POLICY "Authenticated users can manage detection rules" 
ON public.company_detection_rules FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.company_detection_history IS '会社自動判定の履歴を保存し、精度向上のための学習データとして使用';
COMMENT ON TABLE public.company_detection_rules IS '会社判定のためのルール設定を管理';
COMMENT ON COLUMN public.work_orders.detected_company_id IS 'AIが自動判定した会社ID';
COMMENT ON COLUMN public.work_orders.detection_confidence IS '判定の信頼度（0.0〜1.0）';
COMMENT ON COLUMN public.work_orders.final_company_id IS '最終的に使用された会社ID（手動修正を含む）';