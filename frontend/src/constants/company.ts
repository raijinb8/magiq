// src/constants/company.ts
import type { CompanyOption } from '@/types';

export const COMPANY_OPTIONS: readonly CompanyOption[] = [
  { value: 'NOHARA_G', label: '野原G住環境' },
  { value: 'KATOUBENIYA_MISAWA', label: '加藤ベニヤ池袋_ミサワホーム' },
  { value: 'YAMADA_K', label: '山田K建設 (準備中)' },
  // UNKNOWN_OR_NOT_SET は選択肢としては表示しない場合、ここから除外するか、
  // 表示ロジック側でフィルタリングする
];

// ユーザーが選択できないオプションも含む全リスト (内部処理用)
export const ALL_COMPANY_OPTIONS: readonly CompanyOption[] = [
  ...COMPANY_OPTIONS,
  { value: 'UNKNOWN_OR_NOT_SET', label: '会社を特定できませんでした' },
];
