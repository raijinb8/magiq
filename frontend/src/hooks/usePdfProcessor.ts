// src/pages/admin/WorkOrderTool/hooks/usePdfProcessor.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type {
  CompanyOptionValue,
  PdfProcessSuccessResponse,
  PdfProcessErrorResponse, // エラーレスポンス型もインポート
} from '@/types'; // 型定義ファイルからインポート

export interface UsePdfProcessorProps {
  onSuccess: (data: PdfProcessSuccessResponse, file: File) => void;
  onError: (
    errorMessage: string,
    file: File,
    companyLabelForError: string
  ) => void;
}

export interface UsePdfProcessorReturn {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; // 必要であれば外部から操作できるように
  processFile: (
    fileToProcess: File,
    companyId: CompanyOptionValue,
    companyLabelForError: string, // エラーメッセージ表示用の会社ラベル
    enableAutoDetection?: boolean, // 自動判定を有効にするかどうか
    ocrOnly?: boolean // OCRと会社判定のみを実行するかどうか
  ) => Promise<void>;
}

export const usePdfProcessor = ({
  onSuccess,
  onError,
}: UsePdfProcessorProps): UsePdfProcessorReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(
    async (
      fileToProcess: File,
      companyId: CompanyOptionValue,
      companyLabelForError: string, // エラーメッセージ用に会社ラベルを受け取る
      enableAutoDetection = false, // デフォルトは自動判定無効
      ocrOnly = false // デフォルトはOCRのみは無効
    ): Promise<void> => {
      // 自動判定が有効な場合は、会社IDが未選択でも処理を続行
      if (!enableAutoDetection && !companyId) {
        // companyId の存在チェックを追加
        toast.error('会社が選択されていません。');
        onError('会社未選択', fileToProcess, companyLabelForError);
        return;
      }
      setIsLoading(true);
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) {
          toast.error('認証されていません。ログインしてください。');
          // setIsLoading(false); // finally で処理
          onError('認証エラー', fileToProcess, companyLabelForError);
          return;
        }

        const functionUrl = import.meta.env
          .VITE_PUBLIC_PROCESS_PDF_FUNCTION_URL;
        if (!functionUrl) {
          toast.error('設定エラー: Function URLが未設定です。');
          // setIsLoading(false); // finally で処理
          onError(
            '設定エラー: Function URL未設定',
            fileToProcess,
            companyLabelForError
          );
          return;
        }

        // FormDataオブジェクトを作成してファイルと他のデータを格納
        const formData = new FormData();
        formData.append('pdfFile', fileToProcess, fileToProcess.name); // 第3引数でファイル名を指定
        formData.append('companyId', companyId || 'UNKNOWN_OR_NOT_SET'); // 会社IDが未選択の場合はデフォルト値
        formData.append('enableAutoDetection', String(enableAutoDetection)); // 自動判定フラグ
        formData.append('ocrOnly', String(ocrOnly)); // OCRのみフラグ
        // 必要に応じて他のデータも formData.append() で追加できます
        // 例: formData.append('originalFileName', fileToProcess.name);

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            // 'Content-Type': 'multipart/form-data', // FormData を使用する場合、ブラウザが適切なContent-Type（boundaryを含む）を自動設定するため、明示的に指定しない
            Authorization: `Bearer ${session.access_token}`,
            // 'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY, // Edge Functionの認証設定によっては必要
          },
          body: formData, // FormDataオブジェクトをbodyに設定
        });

        // response.json() の前に response.ok をチェックする方が一般的
        if (!response.ok) {
          // エラーレスポンスを先に処理
          let errorMsg = `HTTPエラー: ${response.status} ${response.statusText}`;
          let errorData: PdfProcessErrorResponse | null = null;
          try {
            errorData = (await response.json()) as PdfProcessErrorResponse;
            errorMsg = errorData?.error || errorMsg; // APIが返すエラーメッセージを優先
            
            // 自動判定に失敗した場合の特別な処理
            if (errorData?.detectionResult && !errorData.detectionResult.detectedCompanyId) {
              toast.warning('会社を自動判定できませんでした。手動で選択してください。', {
                description: `信頼度: ${(errorData.detectionResult.confidence * 100).toFixed(0)}%`
              });
            }
          } catch (jsonError) {
            // JSONパースに失敗した場合など
            console.warn('Failed to parse error response as JSON:', jsonError);
          }
          console.error('Backend API Error Response:', response);
          toast.error(`処理エラー: ${errorMsg}`, {
            description: `ファイル「${fileToProcess.name}」の処理中に問題が発生しました。`,
          });
          onError(errorMsg, fileToProcess, companyLabelForError);
          return;
        }

        // response.ok の場合のみ .json() を安全に呼び出せる
        const responseData =
          (await response.json()) as PdfProcessSuccessResponse; // 成功レスポンスとして型付け
        onSuccess(responseData, fileToProcess);
      } catch (error: unknown) {
        let errorMessage = 'API呼び出し中に予期せぬエラーが発生しました。';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error('Frontend API Call/Network Error:', error);
        toast.error('クライアントサイドエラー', { description: errorMessage });
        onError(errorMessage, fileToProcess, companyLabelForError);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError] // 依存配列
  );

  return { isLoading, setIsLoading, processFile };
};
