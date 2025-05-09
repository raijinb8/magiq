// src/pages/admin/WorkOrderTool.tsx

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner' // sonner から toast 関数を直接インポート

const WorkOrderTool = () => {
  // 状態管理フック
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // useRefフック
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 新しいファイルを処理する共通関数 (PDFフィルタリング、重複チェック、状態更新)
  const processNewFiles = useCallback(
    (newFilesInput: File[]) => {
      let addedFilesCount = 0
      const filesToAdd: File[] = []

      newFilesInput.forEach(newFile => {
        if (newFile.type !== 'application/pdf') {
          toast.error(`不正なファイル形式: 「${newFile.name}」`, {
            // sonner の error スタイル
            description: 'PDFファイルではありません。スキップしました。',
            duration: 5000, // 5秒間表示
          })
          return
        }

        const isDuplicate = uploadedFiles.some(existingFile => existingFile.name === newFile.name)

        if (isDuplicate) {
          toast.warning(`ファイルが重複しています: 「${newFile.name}」`, {
            // sonner の warning スタイル
            description: 'このファイルは既に追加されています。',
            duration: 5000,
          })
        } else {
          filesToAdd.push(newFile)
          addedFilesCount++
        }
      })

      if (filesToAdd.length > 0) {
        setUploadedFiles(prevFiles => [...prevFiles, ...filesToAdd])
        // (オプション) 正常に追加されたことをユーザーにフィードバック
        toast.success(`${addedFilesCount}件の新しいPDFファイルが一覧に追加されました。`)
      }
    },
    [uploadedFiles]
  ) // toast 関数は sonner から直接インポートしているので依存配列から削除

  // --- ドラッグ＆ドロップイベントハンドラ ---

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        processNewFiles(Array.from(files))
      }
    },
    [processNewFiles]
  )

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return
    }
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!isDragging) setIsDragging(true)
    },
    [isDragging]
  )

  // --- ファイル選択ダイアログ関連 ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      processNewFiles(Array.from(files))
    }
    if (event.target) {
      event.target.value = ''
    }
  }

  return (
    <div
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
          <h2 className="mb-4 text-lg font-semibold">アップロード済みPDF一覧</h2>
          <Button className="w-full mb-4" variant="outline" onClick={() => fileInputRef.current?.click()}>
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
                      className="mb-2 cursor-pointer rounded-md p-2 text-sm hover:bg-muted"
                    >
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
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
              <h2 className="text-lg font-semibold">PDFプレビュー</h2>
            </div>
            <div className="flex-1 bg-slate-100 rounded-md flex items-center justify-center overflow-auto p-2">
              <p className="text-muted-foreground">ここに選択されたPDFが表示されます</p>
            </div>
          </div>

          <div className="w-1/2 p-4 flex flex-col overflow-hidden">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">業務手配書 文言</h2>
              <div>
                <Button variant="outline" size="sm" className="mr-2">
                  戻る (仮)
                </Button>
                <Button variant="outline" size="sm" className="mr-2">
                  次へ (仮)
                </Button>
                <Button size="sm">保存 (仮)</Button>
              </div>
            </div>
            <Textarea
              className="flex-1 resize-none rounded-md text-sm font-mono"
              placeholder="ここに抽出された業務手配書の文言が表示されます..."
              defaultValue={`08:00～\n野原Ｇ住環境　牧\n今中(公)　邸\nミサワホーム株式会社\n東京都世田谷区経堂3-447-36\nMH建設　村上様：080-4888-2659\n強12.5 3x8 1F10 2F49\n合計　59枚\n※安全装備 (安全靴) 着用の事\n※タオル巻き禁止!\n※安全靴・上履き着用の事!\n※現場内及び周辺(路上含む)は禁煙\n2名作業`}
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
  )
}

export default WorkOrderTool
