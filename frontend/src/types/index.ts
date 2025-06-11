// src/types/index.ts (または適切な場所に配置)

// COMPANY_OPTIONSの型をより厳密に
export const COMPANY_OPTIONS_CONST = [
  { value: 'NOHARA_G', label: '野原G住環境' },
  { value: 'KATOUBENIYA_MISAWA', label: '加藤ベニヤ池袋_ミサワホーム' },
  { value: 'YAMADA_K', label: '山田K建設 (準備中)' },
  { value: 'UNKNOWN_OR_NOT_SET', label: '会社を特定できませんでした' },
] as const; // as const で value と label をリテラル型として扱う

export type CompanyOptionValue =
  | (typeof COMPANY_OPTIONS_CONST)[number]['value']
  | '';

export interface CompanyOption {
  value: (typeof COMPANY_OPTIONS_CONST)[number]['value']; // より厳密な型
  label: string;
}

export interface ProcessedCompanyInfo {
  file: File | null;
  companyLabel: string; // これは COMPANY_OPTIONS の label に対応する想定
}

// PDFファイルの型定義（現時点ではFileと同じだが、将来的な拡張を考慮）
export type PdfFile = File;

export interface Point {
  x: number;
  y: number;
}

export interface ScrollPosition {
  left: number;
  top: number;
}

// 会社自動判定結果の型定義
export interface CompanyDetectionResult {
  detectedCompanyId: string | null;
  confidence: number;
  method: 'ocr_gemini' | 'gemini_analysis' | 'rule_based' | 'unknown';
  details: {
    foundKeywords?: string[];
    matchedPatterns?: string[];
    geminiReasoning?: string;
    detectedText?: string;
    rulesApplied?: Array<{
      ruleId: string;
      ruleType: string;
      ruleValue: string;
      matched: boolean;
    }>;
  };
}

// APIレスポンスの型 (例)
export interface PdfProcessSuccessResponse {
  generatedText: string;
  identifiedCompany: CompanyOptionValue; // APIが返す会社IDの型
  originalFileName: string;
  promptUsedIdentifier: string;
  dbRecordId: string; // UUIDなど
  message?: string; // 成功メッセージなど
  detectionResult?: CompanyDetectionResult | null; // 自動判定結果
  ocrOnly?: boolean; // OCR専用処理かどうか
  fileName?: string; // ファイル名（OCR専用処理時に使用）
}

export interface PdfProcessErrorResponse {
  error: string;
  message?: string; // エラーメッセージ詳細など
  detectionResult?: CompanyDetectionResult | null; // エラー時でも判定結果を含む場合がある
  // 他のエラー関連情報
}

export type PdfProcessResponse =
  | PdfProcessSuccessResponse
  | PdfProcessErrorResponse;

// バッチ処理関連の型定義
export interface BatchProcessIndividualResult {
  fileName: string;
  success: boolean;
  generatedText?: string;
  workOrderId?: string;
  error?: string;
}

export interface BatchProcessTokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface BatchProcessResult {
  batchId: string;
  individualResults: BatchProcessIndividualResult[];
  consolidatedText: string;
  totalTokenUsage: BatchProcessTokenUsage;
}

export interface PdfBatchProcessSuccessResponse {
  message: string;
  result: BatchProcessResult;
}

export interface PdfBatchProcessErrorResponse {
  error: string;
  details?: string;
}

export type PdfBatchProcessResponse =
  | PdfBatchProcessSuccessResponse
  | PdfBatchProcessErrorResponse;

// ファイル選択状態の管理
export interface FileSelectionState {
  [fileName: string]: boolean;
}
