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

export interface PdfFile extends File {
  // 必要であれば File 型を拡張するカスタムプロパティ
}

export interface Point {
  x: number;
  y: number;
}

export interface ScrollPosition {
  left: number;
  top: number;
}

// APIレスポンスの型 (例)
export interface PdfProcessSuccessResponse {
  generatedText: string;
  identifiedCompany: CompanyOptionValue; // APIが返す会社IDの型
  originalFileName: string;
  promptUsedIdentifier: string;
  dbRecordId: string; // UUIDなど
  message?: string; // 成功メッセージなど
}

export interface PdfProcessErrorResponse {
  error: string;
  message?: string; // エラーメッセージ詳細など
  // 他のエラー関連情報
}

export type PdfProcessResponse =
  | PdfProcessSuccessResponse
  | PdfProcessErrorResponse;
