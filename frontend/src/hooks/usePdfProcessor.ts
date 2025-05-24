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
    companyLabelForError: string // エラーメッセージ表示用の会社ラベル
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
      companyLabelForError: string // エラーメッセージ用に会社ラベルを受け取る
    ): Promise<void> => {
      if (!companyId) {
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

        const requestBody = {
          fileName: fileToProcess.name,
          companyId: companyId,
        };

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        });

        // response.json() の前に response.ok をチェックする方が一般的
        if (!response.ok) {
          // エラーレスポンスを先に処理
          let errorMsg = `HTTPエラー: ${response.status} ${response.statusText}`;
          try {
            const errorData =
              (await response.json()) as PdfProcessErrorResponse;
            errorMsg = errorData?.error || errorMsg; // APIが返すエラーメッセージを優先
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
