-- 会社自動検出機能のためのフィールド追加
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS detected_company_id TEXT,
ADD COLUMN IF NOT EXISTS detection_confidence DECIMAL(3, 2) CHECK (detection_confidence >= 0 AND detection_confidence <= 1),
ADD COLUMN IF NOT EXISTS detection_method TEXT,
ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT FALSE;

-- 検出履歴テーブルの作成
CREATE TABLE IF NOT EXISTS company_detection_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE,
  detected_company_id TEXT NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  detection_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスの追加
CREATE INDEX IF NOT EXISTS idx_work_orders_detected_company ON work_orders(detected_company_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_work_order ON company_detection_history(work_order_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_created ON company_detection_history(created_at);

-- コメントの追加
COMMENT ON COLUMN work_orders.detected_company_id IS '自動検出された会社ID';
COMMENT ON COLUMN work_orders.detection_confidence IS '検出の信頼度スコア（0.0〜1.0）';
COMMENT ON COLUMN work_orders.detection_method IS '検出方法（gemini_content_analysis, pattern_matching等）';
COMMENT ON COLUMN work_orders.is_manual_override IS 'ユーザーが手動で会社を変更したかどうか';
COMMENT ON TABLE company_detection_history IS '会社検出の履歴を保存し、将来の機械学習に活用';