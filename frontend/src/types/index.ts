// src/types/index.ts
// MagIQ アプリケーションで使用される型定義

// 会社関連の型定義
export type CompanyOptionValue = 
  | 'NOHARA_G' 
  | 'KATOUBENIYA_MISAWA' 
  | 'YAMADA_K' 
  | 'UNKNOWN_OR_NOT_SET' 
  | '';

export interface CompanyOption {
  value: CompanyOptionValue;
  label: string;
}

// 会社固有定数（テスト用）
export const COMPANY_OPTIONS_CONST: readonly CompanyOption[] = [
  { value: 'NOHARA_G', label: '野原G住環境' },
  { value: 'KATOUBENIYA_MISAWA', label: '加藤ベニヤ池袋_ミサワホーム' },
  { value: 'YAMADA_K', label: '山田K建設 (準備中)' },
  { value: 'UNKNOWN_OR_NOT_SET', label: '会社を特定できませんでした' },
] as const;

// PDF関連の型定義
export interface PdfFile extends File {
  // Fileのプロパティをすべてそのまま継承
  // 必要に応じて追加のプロパティを定義
  preview?: string; // プレビューURL
  id?: string; // 一意なID（必要な場合）
}

// PDF処理レスポンスの型定義
export interface PdfProcessSuccessResponse {
  success?: true;
  generatedText?: string; // テスト用互換性
  ocrOnly?: boolean; // OCRのみの実行か
  detectionResult?: CompanyDetectionResult | null; // 自動判定結果
  dbRecordId?: string; // データベースレコードID
  identifiedCompany?: string; // 特定された会社
  originalFileName?: string; // 元のファイル名
  promptUsedIdentifier?: string; // 使用されたプロンプト識別子
  fileName?: string; // ファイル名
  data?: {
    work_order_id: string;
    file_name: string;
    company_name: string;
    generated_text: string;
    prompt_identifier: string;
    gemini_processed_at: string;
    uploaded_at: string;
    status: string;
    // 会社自動判定関連の結果
    detected_company?: CompanyDetectionResult;
  };
}

export interface PdfProcessErrorResponse {
  success: false;
  error: string;
  details?: string;
  work_order_id?: string; // エラーでも作成される場合がある
  detectionResult?: CompanyDetectionResult; // 自動判定結果（エラー時でも含まれる場合）
}

// 会社自動判定結果の型定義
export interface CompanyDetectionResult {
  detectedCompany?: CompanyOptionValue;
  detectedCompanyId?: CompanyOptionValue | null; // 既存コードで使用されている（nullも許可）
  confidence: number; // 0-1の信頼度
  reasoning?: string; // 判定理由
  method?: string; // 判定方法
  alternatives?: Array<{
    company: CompanyOptionValue;
    confidence: number;
    reasoning?: string;
  }>;
  isManualOverride?: boolean; // ユーザーが手動で変更したか
  details?: {
    foundKeywords?: string[];
    geminiReasoning?: string;
    detectedText?: string;
  };
}

// 処理状態の型定義
export type ProcessStatus = 
  | 'idle' 
  | 'uploading' 
  | 'processing' 
  | 'completed' 
  | 'error' 
  | 'cancelled'
  | 'analyzing' // OCRと会社判定フェーズ
  | 'generating' // テキスト生成フェーズ
  | 'waiting' // 処理待ち
  | 'ocr_processing' // OCR処理中
  | 'document_creating'; // ドキュメント作成中

export interface ProcessState {
  status: ProcessStatus;
  startTime: Date;
  progress?: number; // 0-100のプログレス（オプション）
  message?: string; // ステータスメッセージ
  error?: string; // エラーメッセージ
  fileName?: string; // 処理中のファイル名
  companyName?: string; // 処理中の会社名
  workOrderId?: string; // Work Order ID
  currentStep?: string; // 現在のステップ
  canCancel?: boolean; // キャンセル可能か
  errorDetail?: string; // 詳細エラー情報
  phaseDetails?: {
    currentPhase: 'upload' | 'analyze' | 'generate' | 'complete';
    phaseProgress?: number;
    phaseMessage?: string;
  };
}

// 処理済み会社情報の型定義
export interface ProcessedCompanyInfo {
  fileName?: string;
  companyName?: string;
  companyLabel?: string;
  companyId?: CompanyOptionValue;
  processedAt?: string;
  workOrderId?: string;
  file?: File; // 実際のファイル情報
  status?: 'completed' | 'processing' | 'error' | 'pending'; // 処理ステータス
}

// Work Order関連の型定義
export interface WorkOrder {
  id: string;
  file_name: string;
  uploaded_at: string;
  company_name: string;
  prompt_identifier: string;
  generated_text: string;
  edited_text?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  gemini_processed_at?: string;
  created_at: string;
  updated_at: string;
}

// API関連の型定義
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// シフト関連の型定義
export type ShiftType = 
  | 'morning' 
  | 'afternoon' 
  | 'night' 
  | 'full_day' 
  | 'custom';

export interface Shift {
  id: string;
  user_id: string;
  date: string;
  shift_type: ShiftType;
  custom_end_time?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

// プロジェクト関連の型定義
export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ドラッグ&ドロップ関連の型定義
export interface DragDropState {
  isDragOver: boolean;
  isDragActive: boolean;
}

// フォーム関連の型定義
export interface FormState<T = Record<string, unknown>> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// 通知関連の型定義
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  timestamp: Date;
}

// ページネーション関連の型定義
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ソート関連の型定義
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

// フィルター関連の型定義
export interface FilterState {
  [key: string]: unknown;
}

// リスト状態の型定義
export interface ListState<T = unknown> {
  items: T[];
  loading: boolean;
  error?: string;
  pagination?: PaginationState;
  sort?: SortState;
  filters?: FilterState;
}

// PDF制御関連の型定義
export interface PdfControlState {
  pageNumber: number;
  numPages: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  error?: string;
}

// ファイルアップロード関連の型定義
export interface FileUploadState {
  files: File[];
  uploading: boolean;
  progress: number;
  error?: string;
}

// 設定関連の型定義
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  pdf: {
    defaultScale: number;
    autoRotate: boolean;
    preloadPages: number;
  };
}

// エラー関連の型定義
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  stack?: string;
}

// 検索関連の型定義
export interface SearchState {
  query: string;
  results: unknown[];
  loading: boolean;
  error?: string;
  filters?: FilterState;
}

// 認証関連の型定義
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
}

// 会社ストア関連の型定義
export interface CompanyStoreState {
  companyId: CompanyOptionValue;
  companyInfo: CompanyOption | null;
  isLoading: boolean;
  error?: string;
}

// ファイル選択状態の型定義
export interface FileSelectionState {
  [fileName: string]: boolean;
}

// PDF制御用の型定義
export interface Point {
  x: number;
  y: number;
}

export interface ScrollPosition {
  scrollTop: number;
  scrollLeft: number;
  top: number;
  left: number;
}

// Work Order ステータス応答の型定義
export interface WorkOrderStatusResponse {
  success?: boolean;
  id?: string;
  status: string; // statusはnon-optionalのまま
  generated_text?: string;
  edited_text?: string;
  error_message?: string | null;
  uploaded_at?: string;
  gemini_processed_at?: string;
  file_name?: string;
  updated_at?: string;
  data?: {
    id: string;
    status: string;
    generated_text?: string;
    edited_text?: string;
    error_message?: string;
  };
  error?: string;
}

// バッチ処理関連の型定義
export interface BatchProcessOptions {
  companyId?: CompanyOptionValue;
  autoDetectEnabled?: boolean;
  concurrentLimit?: number;
  pauseOnError?: boolean;
  retryFailedFiles?: boolean;
}

export interface BatchProcessResult {
  fileName: string;
  status: 'success' | 'error' | 'cancelled' | 'processing' | 'pending';
  workOrderId?: string;
  errorMessage?: string;
  processingTime?: number;
  startedAt?: Date;
  completedAt?: Date;
  detectionResult?: CompanyDetectionResult;
  companyId?: CompanyOptionValue;
}

export interface BatchProcessingState {
  isProcessing: boolean;
  isPaused: boolean;
  processedCount: number;
  totalCount: number;
  successCount: number;
  errorCount: number;
  currentFile?: string;
  currentFileIndex?: number;
  results: BatchProcessResult[];
  startTime?: Date;
  endTime?: Date;
  totalFiles?: number;
  processedFiles?: number;
  failedFiles?: number;
}