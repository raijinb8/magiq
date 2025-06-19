// supabase/functions/process-pdf-single/index.ts

import { GoogleGenAI, Part } from '@google/genai'
// Supabaseクライアントをインポート (Deno用)
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPrompt, PromptFunction } from './promptRegistry.ts'
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts' // Base64エンコード用
import { CompanyDetector } from './companyDetector.ts'
import { OCR_COMPANY_DETECTION_PROMPT, type OcrDetectionResponse } from './ocrPrompt.ts'

console.log('process-pdf-single function (v2 - with Gen) has been invoked!')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 開発中は '*'、本番ではReactアプリのオリジン
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// グローバルスコープでSupabaseクライアントを一度だけ初期化 (パフォーマンスのため)
// 環境変数は関数の呼び出しごとにDeno.env.getで取得するのがより安全・確実な場合もある
// ここでは起動時に一度取得する例
let supabaseClient: SupabaseClient | null = null
try {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.')
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        // サーバーサイドのクライアントなので、自動リフレッシュトークンは不要
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
    console.log('Supabase client initialized for server-side use.')
  }
} catch (e) {
  console.error('Error initializing Supabase client:', e)
}

type CompanyIdentifier = 'NOHARA_G' | 'KATOUBENIYA_IKEBUKURO_MISAWA' | 'UNKNOWN_OR_NOT_SET'

/**
 * OCR専用の会社判定処理
 */
async function performOcrCompanyDetection(
  geminiApiKey: string,
  pdfFile: File,
  pdfBase64Data: string
): Promise<OcrDetectionResponse> {
  const genAI = new GoogleGenAI({ apiKey: geminiApiKey })
  
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`[OCR Detection] Gemini API呼び出し試行 ${attempt + 1}/${maxRetries}`);
      
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-preview-05-20',
        contents: [
          {
            role: 'user',
            parts: [
              { text: OCR_COMPANY_DETECTION_PROMPT },
              {
                inlineData: {
                  mimeType: pdfFile.type,
                  data: pdfBase64Data,
                },
              },
            ],
          },
        ],
      })

      const responseText = response.text || ''
      console.log('[OCR Detection] Gemini raw response:', responseText)

      // JSONレスポンスをパース
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in OCR response')
      }

      const result = JSON.parse(jsonMatch[0]) as OcrDetectionResponse

      // バリデーション
      return {
        company_id: result.company_id || null,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0,
        detected_text: result.detected_text || '',
        found_keywords: Array.isArray(result.found_keywords) ? result.found_keywords : [],
        reasoning: result.reasoning || '',
      }
    } catch (error) {
      attempt++;
      console.error(`[OCR Detection] Gemini API呼び出し失敗 (試行 ${attempt}/${maxRetries}):`, error);
      
      // 最後の試行でない場合は待機してリトライ
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ: 2秒, 4秒, 8秒
        console.log(`[OCR Detection] ${waitTime}ms待機後にリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // 最後の試行でも失敗した場合
        console.error(`[OCR Detection] 全ての試行が失敗しました: ${maxRetries}回試行`);
        throw error;
      }
    }
  }
  
  // この行には到達しないはずだが、TypeScriptの型チェックのため
  throw new Error('Unexpected error in performOcrCompanyDetection');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Content-Typeのチェック (multipart/form-data を期待)
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.toLowerCase().includes('multipart/form-data')) {
      console.warn(`Invalid Content-Type: "${contentType}". Expected multipart/form-data.`)
      return new Response(
        JSON.stringify({
          error: '不正なリクエスト形式です。Content-Type は multipart/form-data である必要があります。',
        }),
        {
          status: 415, // Unsupported Media Type
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let formData: FormData
    try {
      // リクエストボディを FormData としてパース
      formData = await req.formData()
    } catch (e: unknown) {
      let errorMessage = 'リクエストボディの解析に失敗しました。multipart/form-data 形式が正しいか確認してください。'
      if (e instanceof Error) {
        errorMessage = e.message // Deno の formData() が投げるエラーのメッセージを利用
      } else if (typeof e === 'string') {
        errorMessage = e
      }
      console.error('Failed to parse FormData body:', errorMessage, e) // 元のエラーオブジェクトもログに出力
      return new Response(JSON.stringify({ error: '不正なリクエストボディです。' }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // パラメーター取得
    let companyIdFromFrontend = formData.get('companyId') as CompanyIdentifier // フロントエンドから会社IDを受け取る
    const enableAutoDetection = formData.get('enableAutoDetection') === 'true' // 自動判定を有効にするかどうか
    const ocrOnly = formData.get('ocrOnly') === 'true' // OCRと会社判定のみを実行するかどうか

    const pdfFile = formData.get('pdfFile') // フロントエンドで append したキー名
    // バリデーション
    if (!(pdfFile instanceof File)) {
      return new Response(
        JSON.stringify({
          error: 'PDFファイルが提供されていないか、形式が無効です。',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const fileName = pdfFile.name // フロントエンドから送られてくるファイル名
    if (!fileName) {
      return new Response(JSON.stringify({ error: 'fileName is required in the request body.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(
      `[${new Date().toISOString()}] Received request for ${fileName}, Company ID from frontend: ${companyIdFromFrontend}`
    )

    // PDFファイルの内容をBase64エンコード
    // ステップ1: PDFファイルの内容を ArrayBuffer として読み込む
    let fileArrayBuffer: ArrayBuffer
    try {
      fileArrayBuffer = await pdfFile.arrayBuffer()
      console.log(`[PDF Processing] Successfully read file into ArrayBuffer, size: ${fileArrayBuffer.byteLength} bytes`)
    } catch (bufferError) {
      console.error(`[PDF Processing] Failed to read PDF file content for ${fileName}:`, bufferError)
      return new Response(JSON.stringify({ error: 'PDFファイル内容の読み取りに失敗しました。' }), {
        status: 500, // Internal Server Error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // ステップ2: ArrayBuffer を Base64 文字列にエンコードする
    const pdfBase64Data = encodeBase64(fileArrayBuffer)
    console.log(`[PDF Processing] Successfully Base64 encoded PDF content for ${fileName}.`)

    // 1. Gemini APIキーを環境変数から取得
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      console.error('CRITICAL: GEMINI_API_KEY is not set in environment variables.')
      return new Response(
        JSON.stringify({
          error: 'API key for AI service is not configured on the server.',
        }),
        {
          status: 500, // Internal Server Error
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // OCR専用処理の場合
    if (ocrOnly) {
      console.log(`[${new Date().toISOString()}] Starting OCR-only company detection for ${fileName}`)

      try {
        const ocrResult = await performOcrCompanyDetection(GEMINI_API_KEY, pdfFile, pdfBase64Data)

        return new Response(
          JSON.stringify({
            message: 'OCRフェーズ完了',
            detectionResult: {
              detectedCompanyId: ocrResult.company_id,
              confidence: ocrResult.confidence,
              method: 'ocr_gemini',
              details: {
                foundKeywords: ocrResult.found_keywords,
                geminiReasoning: ocrResult.reasoning,
                detectedText: ocrResult.detected_text,
              },
            },
            fileName: fileName,
            ocrOnly: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } catch (error) {
        console.error('[OCR Detection] Error:', error)
        return new Response(
          JSON.stringify({
            error: 'OCR処理中にエラーが発生しました',
            detectionResult: {
              detectedCompanyId: null,
              confidence: 0,
              method: 'ocr_gemini',
              details: {
                geminiReasoning: `エラー: ${error instanceof Error ? error.message : String(error)}`,
              },
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // 通常の自動判定と手配書作成の実行
    let detectionResult = null
    let detectionConfidence = 0
    let detectionMethod = 'manual'
    let detectionDetails = {}

    if (enableAutoDetection || !companyIdFromFrontend || companyIdFromFrontend === 'UNKNOWN_OR_NOT_SET') {
      console.log(`[${new Date().toISOString()}] Starting automatic company detection for ${fileName}`)

      const detector = new CompanyDetector(GEMINI_API_KEY, supabaseClient)
      detectionResult = await detector.detectCompany(pdfFile, pdfBase64Data)

      if (detectionResult.detectedCompanyId) {
        console.log(
          `[${new Date().toISOString()}] Auto-detected company: ${detectionResult.detectedCompanyId} with confidence ${
            detectionResult.confidence
          }`
        )

        // フロントエンドから会社IDが提供されていない場合、自動判定結果を使用
        if (!companyIdFromFrontend || companyIdFromFrontend === 'UNKNOWN_OR_NOT_SET') {
          companyIdFromFrontend = detectionResult.detectedCompanyId as CompanyIdentifier
        }

        detectionConfidence = detectionResult.confidence
        detectionMethod = detectionResult.method
        detectionDetails = detectionResult.details
      } else {
        console.log(`[${new Date().toISOString()}] Could not auto-detect company for ${fileName}`)

        // 自動判定に失敗し、フロントエンドからも会社IDが提供されていない場合
        if (!companyIdFromFrontend || companyIdFromFrontend === 'UNKNOWN_OR_NOT_SET') {
          return new Response(
            JSON.stringify({
              error: '会社を自動判定できませんでした。手動で会社を選択してください。',
              detectionResult: detectionResult,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }
    }

    // supabase/functions/process-pdf-single/promptRegistry.ts
    // から識別子とプロンプトのマッピング情報を取得
    const promptEntry = getPrompt(companyIdFromFrontend)

    if (!promptEntry) {
      console.error(
        `[${new Date().toISOString()}] No prompt entry found for companyId: ${companyIdFromFrontend} (file: ${fileName})`
      )
      return new Response(
        JSON.stringify({
          error: `Unsupported company or prompt configuration for: ${companyIdFromFrontend}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. Genクライアントの初期化
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    const model = 'gemini-2.5-flash-preview-05-20' // または "gen-pro", "gen-1.5-pro-latest" など。速度とコストで選択。
    // gemini-2.5-flash-preview-05-20 最新版、改善された性能
    // gemini-2.5-pro-preview-05-06 思考と推論の強化、マルチモーダル理解、高度なコーディングなど
    // gemini-2.0-flash 次世代の機能、速度。

    // 3. プロンプトの組み立て
    // PROMPT_FUNCTION を取得（どのプロンプトを使うか）
    const selectedPromptFunction: PromptFunction = promptEntry.promptFunction
    // 組み立て
    const prompt = selectedPromptFunction(fileName)
    const promptIdentifier = `${companyIdFromFrontend}_${promptEntry.version}`
    // Gemini APIに渡すパーツを作成
    const requestParts: Part[] = [
      { text: prompt }, // テキストによる指示
      {
        inlineData: {
          mimeType: pdfFile.type, // 'application/pdf' など、Fileオブジェクトから取得
          data: pdfBase64Data, // Base64エンコードされたファイルデータ
        },
      },
    ]

    console.log(`[${new Date().toISOString()}] Sending prompt with PDF data to Gemini API for file: ${fileName}`)
    // console.debug("Full Prompt to Gen:", prompt); // デバッグ時に必要ならコメント解除 (非常に長くなる可能性)

    // 4. Gemini API呼び出し（リトライ機能付き）
    let generatedTextByGen: string = ''
    let usageMetadata: any = null
    
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        console.log(`[${new Date().toISOString()}] Gemini API呼び出し試行 ${attempt + 1}/${maxRetries} for ${fileName}`);
        
        // API Ref https://ai.google.dev/api/generate-content?hl=ja#v1beta.GenerateContentResponse
        const response = await genAI.models.generateContent({
          model: model,
          contents: [{ role: 'user', parts: requestParts }], // マルチモーダル入力形式
        // role: 'user' はユーザーのメッセージを、role: 'model' はAIモデル自身の応答を示す
        // 安全性設定の例 (必要に応じて調整)
        // safetySettings: [
        //   {
        //     category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        //     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        //   },
        //   {
        //     category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        //     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        //   },
        //   {
        //     category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        //     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        //   },
        //   {
        //     category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        //     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        //   },
        // ],
          // デベロッパーがシステム指示を設定
          // systemInstruction: "",
        })
        
        if (typeof response.text === 'string' && response.text.trim().length > 0) {
          generatedTextByGen = response.text
        } else {
          // response.text が undefined または空文字列だった場合の処理
          console.error('response.text is undefined or empty:', response)
          throw new Error('Gemini APIからの応答が空です。PDFの内容を確認してください。')
        }
        
        console.log(`[${new Date().toISOString()}] Successfully received response from Gemini API for: ${fileName}`)
        usageMetadata = response.usageMetadata

        // usageMetadata が存在する場合、トークン数をログに出力
        if (usageMetadata) {
          console.log(`Token Usage for ${fileName}:`)
          console.log(`  Prompt Token Count: ${usageMetadata.promptTokenCount}`)
          // candidatesTokenCount は存在する場合のみログに出力 (モデルや設定により異なる)
          if (usageMetadata.candidatesTokenCount !== undefined) {
            console.log(`  Candidates Token Count: ${usageMetadata.candidatesTokenCount}`)
          }
          // totalTokenCount は存在する場合のみログに出力
          if (usageMetadata.totalTokenCount !== undefined) {
            console.log(`  Total Token Count: ${usageMetadata.totalTokenCount}`)
          }
          // cachedContentTokenCount も存在する場合がある
          if (usageMetadata.cachedContentTokenCount !== undefined) {
            console.log(`  Cached Content Token Count: ${usageMetadata.cachedContentTokenCount}`)
          }
        } else {
          console.log(`[${new Date().toISOString()}] usageMetadata not found in Gemini API response for: ${fileName}`)
        }

        // 成功したらループを抜ける
        break;
        
      } catch (genError: any) {
        attempt++;
        console.error(`[${new Date().toISOString()}] Gemini API呼び出し失敗 (試行 ${attempt}/${maxRetries}) for ${fileName}:`, genError);
        
        // 最後の試行でない場合は待機してリトライ
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ: 2秒, 4秒, 8秒
          console.log(`[${new Date().toISOString()}] ${waitTime}ms待機後にリトライします...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // 最後の試行でも失敗した場合
          console.error(`[${new Date().toISOString()}] 全ての試行が失敗しました for ${fileName}: ${maxRetries}回試行`);
          let userFriendlyErrorMessage = `AIによるテキスト生成に失敗しました（${maxRetries}回試行）。`;
          
          // サーバーエラーの場合は一時的な問題の可能性を示唆
          if (genError.message && genError.message.includes('500')) {
            userFriendlyErrorMessage += ' 一時的なサーバーエラーの可能性があります。しばらく待ってから再度お試しください。';
          }
          
          return new Response(
            JSON.stringify({
              error: userFriendlyErrorMessage,
              details: genError.message,
            }),
            {
              status: 502, // Bad Gateway (外部APIとの連携で問題があった場合)
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }
    }

    // --- データベースへの保存処理 ---
    const companyName = promptEntry.companyName
    let dbRecordId: string | null = null
    if (supabaseClient) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting to save generated text to database for: ${fileName}`)
        const { data: insertedData, error: dbError } = await supabaseClient
          .from('work_orders') // 作成したテーブル名
          .insert([
            {
              file_name: fileName,
              // uploaded_at: new Date().toISOString(), // 本来はフロントからアップロード時刻をもらうか、ここで設定
              generated_text: generatedTextByGen,
              // edited_text: generatedTextByGen, // 初期値として同じものを入れるか、NULLのままか
              status: 'completed_from_ai', // AI処理完了を示すステータス
              prompt_identifier: promptIdentifier, // どのプロンプトを使ったか
              company_name: companyName, // 取引先_発注元
              gemini_processed_at: new Date().toISOString(), // Gemini処理完了時刻
              // 自動判定関連のカラム
              detected_company_id: detectionResult?.detectedCompanyId || null,
              detection_confidence: detectionConfidence || null,
              detection_method: detectionMethod,
              detection_metadata: detectionDetails || null,
              final_company_id: companyIdFromFrontend, // 最終的に使用された会社ID
            },
          ])
          .select('id') // 挿入されたレコードのIDを取得
          .single() // 1件のレコードが返ることを期待

        if (dbError) {
          console.error(`[${new Date().toISOString()}] Error saving to database for ${fileName}:`, dbError)
          // DB保存エラーは致命的ではないかもしれないので、フロントには成功として返しつつログで警告する選択肢もある
          // 今回はエラーとして扱う
          return new Response(
            JSON.stringify({
              error: 'Failed to save generated text to database.',
              details: dbError.message,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
        if (insertedData && insertedData.id) {
          dbRecordId = insertedData.id
          console.log(
            `[${new Date().toISOString()}] Successfully saved to database for ${fileName}, record ID: ${dbRecordId}`
          )

          // 判定履歴を保存
          if (detectionResult && enableAutoDetection) {
            const detector = new CompanyDetector(GEMINI_API_KEY, supabaseClient)
            await detector.saveDetectionHistory(
              dbRecordId!,
              fileName,
              detectionResult,
              undefined // TODO: ユーザーIDを渡す場合はここで設定
            )
          }
        } else {
          console.warn(
            `[${new Date().toISOString()}] Saved to database for ${fileName}, but no ID returned or insert failed silently.`
          )
        }
      } catch (e: unknown) {
        console.error(`[${new Date().toISOString()}] Exception during database save for ${fileName}:`, e)
        // こちらもエラーとして扱う
        let errorMessage = 'Internal Server Error. Please try again later.'
        if (e instanceof Error) {
          errorMessage = e.message
        } else if (typeof e === 'string') {
          errorMessage = e
        }
        return new Response(
          JSON.stringify({
            error: 'An exception occurred while saving to database.',
            details: errorMessage,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      console.warn(
        `[${new Date().toISOString()}] Supabase client not initialized. Skipping database save for ${fileName}.`
      )
      // 開発中はDB接続なしでも動くようにしておくか、エラーにするか選択
      // 今回は警告のみで進めるが、本番では client が null ならエラーにすべき
    }

    // 5. フロントエンドへのレスポンス
    const responseData = {
      message: `Successfully generated text for ${fileName} (Company: ${companyIdFromFrontend}).`,
      generatedText: generatedTextByGen,
      originalFileName: fileName,
      promptUsedIdentifier: promptIdentifier, // プロンプトのバージョン管理用
      identifiedCompany: companyIdFromFrontend,
      usageMetadata: usageMetadata, // トークン使用量も返す
      dbRecordId: dbRecordId, // DBに保存されたレコードのIDも返す (オプション)
      workOrderId: dbRecordId, // フロントエンドの互換性のため追加
      // 自動判定の結果を含める
      detectionResult: detectionResult
        ? {
            detectedCompanyId: detectionResult.detectedCompanyId,
            confidence: detectionResult.confidence,
            method: detectionResult.method,
            details: detectionResult.details,
          }
        : null,
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error(`[${new Date().toISOString()}] Unhandled error in function:`, error)
    let errorMessage = 'Internal Server Error. Please try again later.'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    return new Response(
      JSON.stringify({
        error: errorMessage || 'Internal Server Error. Please try again later.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
