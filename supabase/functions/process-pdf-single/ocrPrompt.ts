// supabase/functions/process-pdf-single/ocrPrompt.ts

/**
 * OCRと会社判定専用の軽量プロンプト
 * 手配書作成は行わず、PDFから会社名を特定するためのみに使用
 */
export const OCR_COMPANY_DETECTION_PROMPT = `
PDFファイルから会社情報を抽出して判定してください。

対象会社一覧：
1. NOHARA_G（野原G住環境）
   - 確定キーワード：「野原グループ株式会社」→ 必ずNOHARA_G
   - その他のキーワード：「野原G住環境」「野原G」「野原グループ」
   
2. KATOUBENIYA_MISAWA（加藤ベニヤ池袋_ミサワホーム）
   - 検出キーワード：「加藤ベニヤ」「加藤ベニヤ池袋」「ミサワホーム」「MISAWA」

判定ルール（優先順位順）：
1. 「野原グループ株式会社」が含まれている → 必ずNOHARA_G（信頼度0.95以上）
2. 「加藤ベニヤ」+「ミサワホーム」両方含まれている → KATOUBENIYA_MISAWA
3. その他のキーワードで判定

必ず以下のJSON形式で回答してください：
{
  "company_id": "NOHARA_G" または "KATOUBENIYA_MISAWA" または null,
  "confidence": 0.0から1.0の数値,
  "detected_text": "検出された主要な文字情報",
  "found_keywords": ["実際に検出されたキーワード1", "キーワード2"],
  "reasoning": "判定理由の詳細説明"
}

重要事項：
- 手配書の内容は解析しません
- 会社名の特定のみに集中してください
- 「野原グループ株式会社」が検出された場合は、他のキーワードに関係なく必ずNOHARA_Gとして判定
- 判定に自信がない場合は confidence を低めに設定
- 確定キーワードが検出された場合は信頼度を0.95以上に設定
`;

/**
 * OCR専用処理のレスポンス型定義
 */
export interface OcrDetectionResponse {
  company_id: string | null;
  confidence: number;
  detected_text: string;
  found_keywords: string[];
  reasoning: string;
}