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

// PDF処理の進捗ステータス定義（バックエンドと一致）
export type ProcessStatus =
  | 'waiting' // 待機中（処理開始前）
  | 'ocr_processing' // OCR実行中（会社判定含む）
  | 'document_creating' // 手配書作成中
  | 'completed' // 完了
  | 'error'; // エラー

// ステータス表示用の情報
export interface ProcessStatusInfo {
  status: ProcessStatus;
  label: string; // 日本語ラベル
  description: string; // 詳細説明
  color: 'blue' | 'yellow' | 'green' | 'red' | 'gray'; // 表示色
  icon: string; // アイコン名
  isLoading: boolean; // ローディング表示するか
}

// work_orderレコードの型定義
export interface WorkOrderRecord {
  id: string;
  file_name: string | null;
  uploaded_at: string;
  company_name: string | null;
  prompt_identifier: string | null;
  generated_text: string | null;
  edited_text: string | null;
  status: ProcessStatus;
  error_message: string | null;
  gemini_processed_at: string | null;
  created_at: string;
  updated_at: string;
  // 自動判定関連フィールド
  detected_company_id?: string | null;
  detection_confidence?: number | null;
  detection_method?: string | null;
  detection_metadata?: Record<string, unknown>;
  final_company_id?: string | null;
}

// ステータスポーリング用の型
export interface ProcessStatusResponse {
  id: string;
  status: ProcessStatus;
  error_message: string | null;
  updated_at: string;
  // 処理進捗に関する追加情報
  currentStep?: string;
  startTime?: string;
}

// ステータス管理用のコンテキスト型
export interface ProcessStatusContextType {
  statusInfo: ProcessStatusInfo | null;
  startTime: Date | null;
  recordId: string | null;
  isPolling: boolean;
  startPolling: (recordId: string) => void;
  stopPolling: () => void;
  resetStatus: () => void;
  elapsedTime: number; // 経過時間（秒）
}

// ProcessStatusからProcessStatusInfoを生成するユーティリティ関数
export function getProcessStatusInfo(status: ProcessStatus): ProcessStatusInfo {
  switch (status) {
    case 'waiting':
      return {
        status,
        label: '待機中',
        description: '処理開始を待機しています',
        color: 'gray',
        icon: 'clock',
        isLoading: false,
      };
    case 'ocr_processing':
      return {
        status,
        label: '会社判定中',
        description: 'PDFから会社情報を抽出しています',
        color: 'blue',
        icon: 'search',
        isLoading: true,
      };
    case 'document_creating':
      return {
        status,
        label: '手配書作成中',
        description: 'AI が手配書を作成しています',
        color: 'yellow',
        icon: 'edit',
        isLoading: true,
      };
    case 'completed':
      return {
        status,
        label: '完了',
        description: '手配書の作成が完了しました',
        color: 'green',
        icon: 'check',
        isLoading: false,
      };
    case 'error':
      return {
        status,
        label: 'エラー',
        description: '処理中にエラーが発生しました',
        color: 'red',
        icon: 'alert-circle',
        isLoading: false,
      };
    default:
      return {
        status: 'waiting',
        label: '不明',
        description: '不明なステータスです',
        color: 'gray',
        icon: 'help-circle',
        isLoading: false,
      };
  }
}

// 経過時間をフォーマットする関数
export function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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
