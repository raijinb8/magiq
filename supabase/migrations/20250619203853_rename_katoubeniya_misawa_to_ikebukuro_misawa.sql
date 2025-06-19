-- KATOUBENIYA_MISAWA を KATOUBENIYA_IKEBUKURO_MISAWA に統一するマイグレーション

-- work_ordersテーブルのprompt_identifierを更新
UPDATE work_orders 
SET prompt_identifier = 'KATOUBENIYA_IKEBUKURO_MISAWA' 
WHERE prompt_identifier = 'KATOUBENIYA_MISAWA';

-- company_detection_rulesテーブルのcompany_idを更新
UPDATE company_detection_rules 
SET company_id = 'KATOUBENIYA_IKEBUKURO_MISAWA' 
WHERE company_id = 'KATOUBENIYA_MISAWA';

-- 確認用のSELECT文（コメントアウト）
-- SELECT COUNT(*) FROM work_orders WHERE prompt_identifier = 'KATOUBENIYA_IKEBUKURO_MISAWA';
-- SELECT COUNT(*) FROM company_detection_rules WHERE company_id = 'KATOUBENIYA_IKEBUKURO_MISAWA';