-- NOHARA_GをNOHARA_G_MISAWAに変更するマイグレーション
-- 既存の野原G住環境の処理済みデータを野原G住環境_ミサワホームに変更

-- work_ordersテーブルのcompany_nameを更新
UPDATE work_orders
SET company_name = 'NOHARA_G_MISAWA'
WHERE company_name = 'NOHARA_G';

-- work_ordersテーブルのprompt_identifierを更新
UPDATE work_orders
SET prompt_identifier = 'NOHARA_G_MISAWA_V20250526'
WHERE prompt_identifier = 'NOHARA_G_V20250526';

-- company_detection_rulesテーブルの判定ルールを更新（存在する場合）
UPDATE company_detection_rules
SET company_id = 'NOHARA_G_MISAWA'
WHERE company_id = 'NOHARA_G';

-- company_detection_historyテーブルの履歴データを更新（存在する場合）
UPDATE company_detection_history
SET detected_company_id = 'NOHARA_G_MISAWA'
WHERE detected_company_id = 'NOHARA_G';

-- 更新件数の確認のためのコメント
COMMENT ON SCHEMA public IS 'マイグレーション完了: NOHARA_GをNOHARA_G_MISAWAに変更';