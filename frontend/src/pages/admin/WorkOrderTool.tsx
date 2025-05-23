// src/pages/admin/WorkOrderTool.tsx

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner'; // sonner から toast 関数を直接インポート
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase.ts'; // Supabase Client のインポート
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // PDFの注釈レイヤーのスタイル
import 'react-pdf/dist/esm/Page/TextLayer.css'; // PDFのテキストレイヤーのスタイル (文字選択などに必要)
import { Plus, Minus } from 'lucide-react'; // icon

// PDFのレンダリングを効率的に行うための Web Worker を設定
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs', // frontend/node_modules/pdfjs-dist/build/pdf.worker.min.mjs から手動コピー
  import.meta.url // または deploy.pdf.worker.min.js といった名前に変えてもOK
).toString();

const COMPANY_OPTIONS = [
  { value: 'NOHARA_G', label: '野原G住環境' },
  { value: 'KATOUBENIYA_MISAWA', label: '加藤ベニヤ池袋_ミサワホーム' },
  { value: 'YAMADA_K', label: '山田K建設 (準備中)' }, // 仮に準備中のものも入れておく
  { value: 'UNKNOWN_OR_NOT_SET', label: '会社を特定できませんでした' }, // バックエンドのエラーケースも考慮
  // 今後対応する会社が増えたらここに追加
];

type CompanyOptionValue = (typeof COMPANY_OPTIONS)[number]['value'] | ''; // 選択肢のvalue型 + 未選択を表す空文字

const WorkOrderTool = () => {
  // 状態管理フック
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // useRefフック
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processingFile, setProcessingFile] = useState<File | null>(null); // 現在処理中のファイルオブジェクト
  const [generatedText, setGeneratedText] = useState<string>(''); // Geminiが生成したテキスト
  const [isLoading, setIsLoading] = useState(false);

  // 選択された会社IDの状態
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<CompanyOptionValue>('');

  // 処理結果表示用
  const [processedCompanyInfo, setProcessedCompanyInfo] = useState<{
    file: File | null;
    companyLabel: string;
  }>({ file: null, companyLabel: '' });

  // WorkOrderTool コンポーネント内
  const [pdfFileToDisplay, setPdfFileToDisplay] = useState<File | null>(null); // 表示するPDFファイル (FileオブジェクトまたはURL)
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageScale, setPageScale] = useState<number>(1.0); // 初期倍率を100% (1.0) とする

  // PDFが読み込まれたときにページ数を設定する関数
  function onDocumentLoadSuccess({
    numPages: nextNumPages,
  }: {
    numPages: number;
  }) {
    setNumPages(nextNumPages);
    setPageNumber(1); // 最初のページを表示
  }

  // バックエンドAPIを呼び出す関数
  const handleProcessFile = async (fileToProcess: File) => {
    // 会社が選択されているかチェック
    if (!selectedCompanyId) {
      toast.error('会社が選択されていません。', {
        description:
          '処理を開始する前に、ドロップダウンから会社を選択してください。',
        duration: 5000,
      });
      return;
    }

    if (!fileToProcess || isLoading) {
      // 処理中なら何もしない
      if (isLoading)
        toast.info('現在別のファイルを処理中です。少々お待ちください。');
      return;
    }

    setProcessingFile(fileToProcess); // どのファイルを処理しているかUIにフィードバックするため
    setIsLoading(true);
    setGeneratedText(''); // 前回の結果やプレースホルダーをクリア
    setPdfFileToDisplay(fileToProcess); // プレビュー用のPDFをセット

    const companyLabel =
      COMPANY_OPTIONS.find((c) => c.value === selectedCompanyId)?.label ||
      selectedCompanyId;

    toast.info(
      `「${fileToProcess.name}」の処理を開始します (会社: ${companyLabel})...`,
      {
        duration: 3000,
      }
    );

    try {
      const session = (await supabase.auth.getSession()).data.session; // 現在のセッションを取得

      if (!session) {
        toast.error('認証されていません。ログインしてください。');
        setIsLoading(false);
        return;
      }

      // Edge FunctionのエンドポイントURLを環境変数から取得
      const functionUrl = import.meta.env.VITE_PUBLIC_PROCESS_PDF_FUNCTION_URL;
      console.log(functionUrl);
      // バックエンドAPIに送信するデータ
      const requestBody = {
        fileName: fileToProcess.name,
        companyId: selectedCompanyId, // 選択された会社IDを送信
        // 将来的にはここにファイルの内容やその他のメタデータを追加することも検討
        // fileSize: fileToProcess.size,
        // fileType: fileToProcess.type,
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 本番環境では、Edge Functionの呼び出しに認証トークン(Authorization: Bearer <token>)を使うのが一般的
          Authorization: `Bearer ${session.access_token}`,
          // Supabaseのanon key (ローカル開発で --no-verify-jwt を使っている場合や、
          // Edge Function側でRLSやカスタム認証をまだ設定していない場合に必要になることがある)
          // apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      setIsLoading(false); // ローディング状態を解除
      const responseData = await response.json();

      if (!response.ok) {
        console.error('Backend API Error Response:', responseData);
        toast.error(
          `処理エラー: ${responseData.error || response.statusText}`,
          {
            description: `ファイル「${fileToProcess.name}」の処理中に問題が発生しました。(${response.status})`,
            duration: 8000,
          }
        );
        setGeneratedText(
          `エラーが発生しました:\n${responseData.error || response.statusText}\n\n詳細は開発者コンソールを確認してください。`
        );
        setProcessedCompanyInfo({
          file: fileToProcess,
          companyLabel: `エラー (${companyLabel})`,
        });
        setProcessingFile(null); // エラー時は処理中ファイルをクリア
        return;
      }

      toast.success(
        `「${fileToProcess.name}」のAI処理が完了しました！ (会社: ${
          COMPANY_OPTIONS.find(
            (c) => c.value === responseData.identifiedCompany
          )?.label || responseData.identifiedCompany
        })`,
        {
          duration: 5000,
        }
      );
      setGeneratedText(
        responseData.generatedText || 'テキストが生成されませんでした。'
      );
      setProcessedCompanyInfo({
        // ★処理した会社情報を保存
        file: fileToProcess,
        companyLabel:
          COMPANY_OPTIONS.find(
            (c) => c.value === responseData.identifiedCompany
          )?.label || responseData.identifiedCompany,
      });

      // 処理が成功したら processingFile はクリアせず、どのファイルの結果が表示されているか分かるように残す
      // (UIの要件に応じて、成功時もクリアするかどうかを決める)

      // --- データベースへの保存処理 (ステップ5.7で実装) ---
      // await saveToDatabase(responseData.originalFileName, responseData.generatedText, responseData.promptUsedIdentifier)
    } catch (error: any) {
      setIsLoading(false);
      setProcessingFile(null); // エラー時は処理中ファイルをクリア
      setGeneratedText(
        `API呼び出し中にエラーが発生しました:\n${error.message}\n\n詳細は開発者コンソールを確認してください。`
      );
      setProcessedCompanyInfo({
        file: fileToProcess,
        companyLabel: `エラー (${companyLabel})`,
      });
      console.error('Frontend API Call/Network Error:', error);
      toast.error(
        'API呼び出し中にネットワークエラーまたは予期せぬエラーが発生しました。',
        {
          description: error.message || '不明なクライアントサイドエラーです。',
          duration: 8000,
        }
      );
    }
    // finally ブロックはsetIsLoading(false)が二重に呼ばれる可能性があるので、各処理の最後に移動
  };

  // 新しいファイルを処理する共通関数 (PDFフィルタリング、重複チェック、状態更新)
  // processNewFiles 関数内で、ファイルが追加された後に handleProcessFile を呼び出す
  const processNewFiles = useCallback(
    (newFilesInput: File[]) => {
      let addedFilesCount = 0;
      const filesToAdd: File[] = [];

      newFilesInput.forEach((newFile) => {
        if (newFile.type !== 'application/pdf') {
          toast.error(`不正なファイル形式: 「${newFile.name}」`, {
            description: 'PDFファイルではありません。スキップしました。',
            duration: 5000,
          });
          return;
        }
        const isDuplicate = uploadedFiles.some(
          (existingFile) => existingFile.name === newFile.name
        );
        if (isDuplicate) {
          toast.warning(`ファイルが重複しています: 「${newFile.name}」`, {
            description: 'このファイルは既に追加されています。',
            duration: 5000,
          });
        } else {
          filesToAdd.push(newFile);
          addedFilesCount++;
        }
      });

      if (filesToAdd.length > 0) {
        setUploadedFiles((prevFiles) => {
          const updatedFiles = [...prevFiles, ...filesToAdd];
          // 自動的に最初の新しいファイルを処理開始 (UI/UXに応じて変更可)
          // 他の処理が実行中でなければ、最初の追加ファイルを処理する
          if (filesToAdd.length > 0 && !isLoading) {
            // isLoading をチェック
            handleProcessFile(filesToAdd[0]);
          }
          return updatedFiles;
        });
        toast.success(
          `${addedFilesCount}件のPDFファイルが一覧に追加されました。`
        );
      }
    },
    [uploadedFiles, isLoading, handleProcessFile]
    // [uploadedFiles] //最初の新しいファイルを自動的に実行しない場合
  ); // isLoading と handleProcessFile を依存配列に追加

  // --- ドラッグ＆ドロップイベントハンドラ ---

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        processNewFiles(Array.from(files));
      }
    },
    [processNewFiles]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.currentTarget.contains(event.relatedTarget as Node)) {
        return;
      }
      setIsDragging(false);
    },
    []
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  // --- ファイル選択ダイアログ関連 ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processNewFiles(Array.from(files));
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div /* ... (ルートdivの定義) ... */
      className={`flex h-screen flex-col bg-muted/40 ${
        isDragging ? 'border-4 border-dashed border-primary bg-primary/10' : ''
      }`}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <h1 className="text-xl font-semibold">業務手配書 作成ツール</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 border-r bg-background p-4 overflow-y-auto">
          <h2 className="mb-4 text-lg font-semibold">
            アップロード済みPDF一覧
          </h2>
          {/* 会社選択ドロップダウン */}
          <div className="mb-4">
            <label
              htmlFor="company-select"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              処理対象の会社:
            </label>
            <Select
              value={selectedCompanyId}
              onValueChange={(value) =>
                setSelectedCompanyId(value as CompanyOptionValue)
              }
            >
              <SelectTrigger id="company-select" className="w-full">
                <SelectValue placeholder="会社を選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>会社一覧</SelectLabel>
                  {COMPANY_OPTIONS.map(
                    (company) =>
                      // 「準備中」のものは選択できないようにする例 (disabled)
                      // UNKNOWN_OR_NOT_SET はユーザーが選ぶものではないのでリストから除外
                      company.value !== 'UNKNOWN_OR_NOT_SET' && (
                        <SelectItem
                          key={company.value}
                          value={company.value}
                          disabled={company.label.includes('準備中')}
                        >
                          {company.label}
                        </SelectItem>
                      )
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full mb-4"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            PDFを選択してアップロード
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <ScrollArea className="h-[calc(100vh-220px)] rounded-md border">
            <div className="p-4">
              {uploadedFiles.length > 0 ? (
                <ul>
                  {uploadedFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className={`mb-2 cursor-pointer rounded-md p-2 text-sm transition-colors duration-150 ease-in-out
                        ${processingFile?.name === file.name && isLoading ? 'bg-blue-100 dark:bg-blue-800/30 ring-2 ring-blue-500 animate-pulse' : ''}
                        ${processedCompanyInfo.file?.name === file.name && !isLoading && generatedText && !generatedText.startsWith('エラー') ? 'bg-green-100 dark:bg-green-800/30 ring-1 ring-green-500' : ''}
                        ${processedCompanyInfo.file?.name === file.name && !isLoading && generatedText && generatedText.startsWith('エラー') ? 'bg-red-100 dark:bg-red-800/30 ring-1 ring-red-500' : ''}
                        ${!processingFile || processingFile?.name !== file.name ? 'hover:bg-muted' : ''}
                      `}
                      onClick={() => handleProcessFile(file)} // クリックで処理開始
                    >
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      {processingFile?.name === file.name && isLoading && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          (処理中...)
                        </span>
                      )}
                      {processingFile?.name === file.name &&
                        !isLoading &&
                        generatedText &&
                        !generatedText.startsWith('エラー') && (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            (処理完了)
                          </span>
                        )}
                      {processingFile?.name === file.name &&
                        !isLoading &&
                        generatedText &&
                        generatedText.startsWith('エラー') && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                            (エラー)
                          </span>
                        )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  ここにPDFファイルをドラッグ＆ドロップするか、
                  <br />
                  上のボタンからファイルを選択してください。
                </p>
              )}
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-row overflow-hidden">
          <div className="w-1/2 border-r p-4 flex flex-col overflow-hidden">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                PDFプレビュー{' '}
                {processingFile &&
                  !isLoading &&
                  pdfFileToDisplay &&
                  `(${processingFile.name})`}
              </h2>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-md flex flex-col items-center justify-start overflow-auto p-2 relative">
              {processingFile && !isLoading ? ( // 処理が完了したファイル（または処理中でない選択ファイル）を表示
                <Document
                  file={processingFile} // FileオブジェクトまたはURL
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => {
                    toast.error('PDFの読み込みに失敗しました。', {
                      description: error.message,
                    });
                    console.error('Error while loading PDF:', error);
                  }}
                  loading={
                    <p className="text-muted-foreground p-4">
                      PDFを読み込み中...
                    </p>
                  }
                  noData={
                    <p className="text-muted-foreground p-4">
                      表示するPDFが選択されていません。
                    </p>
                  }
                  error={
                    <p className="text-red-500 p-4">PDFの読み込みエラー。</p>
                  }
                  className="w-full h-full flex flex-col items-center" // Document自体のスタイリング
                >
                  {numPages && (
                    <div className="sticky top-0 z-10 bg-slate-200 dark:bg-slate-700 p-2 flex items-center justify-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageNumber <= 1}
                        onClick={() =>
                          setPageNumber((prev) => Math.max(prev - 1, 1))
                        }
                      >
                        前へ
                      </Button>
                      <span>
                        ページ {pageNumber} / {numPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageNumber >= numPages}
                        onClick={() =>
                          setPageNumber((prev) => Math.min(prev + 1, numPages))
                        }
                      >
                        次へ
                      </Button>
                      {/* 拡大・縮小コントロール */}
                      <div className="ml-auto flex items-center gap-2">
                        {' '}
                        {/* 縮小ボタン */}
                        <Button
                          variant="outline"
                          size="icon" // アイコンボタンにする場合
                          onClick={() =>
                            setPageScale((prev) => Math.max(0.25, prev - 0.25))
                          } // 最小倍率0.25、0.25ずつ減少
                          disabled={pageScale <= 0.25}
                          title="縮小"
                        >
                          {/* Lucide Minus アイコン */}
                          <Minus className="h-4 w-4" />{' '}
                        </Button>
                        {/* 現在の倍率を表示 */}
                        <span className="text-sm w-16 text-center">
                          {(pageScale * 100).toFixed(0)}%
                        </span>{' '}
                        {/* 拡大ボタン */}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setPageScale((prev) => Math.min(3.0, prev + 0.25))
                          } // 最大倍率3.0、0.25ずつ増加
                          disabled={pageScale >= 3.0}
                          title="拡大"
                        >
                          {/* Lucide Plus アイコン */}
                          <Plus className="h-4 w-4" />{' '}
                        </Button>
                        {/* 100% ボタン */}
                        <Button
                          variant="outline"
                          size="sm"
                          // onClick={fitWidth} // fitWidth関数を後で定義
                          title="100%"
                          onClick={() => setPageScale(1.0)}
                          disabled={pageScale === 1.0}
                        >
                          100%
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* PDFのページを表示 */}
                  <div className="flex-grow overflow-auto w-full flex justify-center">
                    {' '}
                    {/* スクロールと中央寄せ */}
                    <Page
                      pageNumber={pageNumber}
                      width={600}
                      // height={/* 高さを指定することも可能 */}
                      renderTextLayer={true} // テキストレイヤーを有効にする（文字選択や検索のため）
                      renderAnnotationLayer={true} // 注釈レイヤーを有効にする
                      className="shadow-lg" // ページに影をつけるなど
                      loading={<p>ページを読み込み中...</p>}
                    />
                  </div>
                </Document>
              ) : isLoading ? (
                <p className="text-muted-foreground p-4">
                  AI処理中です。完了後にPDFが表示されます...
                </p>
              ) : (
                <p className="text-muted-foreground p-4">
                  左のリストからファイルを選択するか、新しいPDFをアップロードして処理を開始してください。
                </p>
              )}
            </div>
          </div>

          <div className="w-1/2 p-4 flex flex-col overflow-hidden">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                業務手配書 文言<br></br>
                {processedCompanyInfo.file && !isLoading && (
                  <>
                    <span className="block text-sm font-normal text-muted-foreground ml-2">
                      ファイル: {processedCompanyInfo.file.name}
                    </span>
                    <span className="block text-sm font-normal text-muted-foreground ml-2">
                      会社: {processedCompanyInfo.companyLabel}
                    </span>
                  </>
                )}
              </h2>
              <div>
                <Button variant="outline" size="sm" className="mr-2" disabled>
                  戻る (仮)
                </Button>
                <Button variant="outline" size="sm" className="mr-2" disabled>
                  次へ (仮)
                </Button>
                <Button size="sm" disabled>
                  保存 (仮)
                </Button>
              </div>
            </div>
            <Textarea
              className="flex-1 resize-none rounded-md text-sm font-mono"
              placeholder={
                isLoading
                  ? `「${processingFile?.name || '選択されたファイル'}」の業務手配書をAIが生成中です...\n\n通常30秒程度かかります。しばらくお待ちください。`
                  : generatedText
                    ? '' // generatedTextがあればプレースホルダーは不要
                    : processingFile
                      ? `「${processingFile.name}」の処理結果がここに表示されます。クリックまたはアップロードで処理を開始してください。`
                      : '処理するPDFを左の一覧から選択するか、新しいPDFをアップロードしてください。'
              }
              value={generatedText}
              readOnly // この段階ではまだ編集不可、表示専用
            />
          </div>
        </main>
      </div>
      {/* sonner の Toaster コンポーネントは、通常 App.tsx やレイアウトコンポーネントなど、
        アプリケーションのルートに近い場所に一度だけ配置します。
        この WorkOrderTool.tsx の中には配置しません。
        例: <Toaster richColors position="top-right" />
      */}
    </div>
  );
};

export default WorkOrderTool;
