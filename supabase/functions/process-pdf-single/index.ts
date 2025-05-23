// supabase/functions/process-pdf-single/index.ts

import { GoogleGenAI } from '@google/genai'
// Supabaseクライアントをインポート (Deno用)
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPrompt, PromptFunction } from './promptRegistry.ts'

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

type CompanyIdentifier = 'NOHARA_G' | 'KATOUBENIYA_MISAWA' | 'UNKNOWN_OR_NOT_SET'

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

    let body: any = {}
    try {
      body = await req.json()
    } catch (e: unknown) {
      let errorMessage = 'Internal Server Error. Please try again later.'
      if (e instanceof Error) {
        errorMessage = e.message
      } else if (typeof e === 'string') {
        errorMessage = e
      }
      console.error('Failed to parse JSON body:', errorMessage)
      return new Response(JSON.stringify({ error: 'Invalid JSON body provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fileName = body.fileName as string // フロントエンドから送られてくるファイル名

    if (!fileName) {
      return new Response(JSON.stringify({ error: 'fileName is required in the request body.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 将来的にはここに実際のPDFの内容を渡す処理が入る（例: OCR結果など）
    const companyIdFromFrontend = body.companyId as CompanyIdentifier // ★フロントエンドから会社IDを受け取る

    if (!companyIdFromFrontend || companyIdFromFrontend === 'UNKNOWN_OR_NOT_SET') {
      // companyIdが送られてこない、または未選択の場合はエラーにするか、デフォルト処理をする
      return new Response(JSON.stringify({ error: 'companyId is required or invalid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(
      `[${new Date().toISOString()}] Received request for ${fileName}, Company ID from frontend: ${companyIdFromFrontend}`
    )

    // supabase/functions/process-pdf-single/promptRegistry.ts
    // から識別子とプロンプトのマッピング情報を取得
    const promptEntry = getPrompt(companyIdFromFrontend)

    if (!promptEntry) {
      console.error(
        `[${new Date().toISOString()}] No prompt entry found for companyId: ${companyIdFromFrontend} (file: ${fileName})`
      )
      return new Response(
        JSON.stringify({ error: `Unsupported company or prompt configuration for: ${companyIdFromFrontend}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 今回はダミーのPDF内容を使います
    const pdfContentDummy = `これは ${fileName} のダミーPDF内容です。実際にはここに抽出されたテキストが入ります。指定された会社: ${companyIdFromFrontend}`

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

    // 2. Genクライアントの初期化
    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    const model = 'gemini-2.5-flash-preview-04-17' // または "gen-pro", "gen-1.5-pro-latest" など。速度とコストで選択。
    // gemini-2.5-flash-preview-04-17 適応的思考、費用対効果
    // gemini-2.5-pro-preview-05-06 思考と推論の強化、マルチモーダル理解、高度なコーディングなど
    // gemini-2.0-flash 次世代の機能、速度。

    // 3. プロンプトの組み立て
    // PROMPT_FUNCTION を取得（どのプロンプトを使うか）
    const selectedPromptFunction: PromptFunction = promptEntry.promptFunction
    const promptIdentifier = `${companyIdFromFrontend}_${promptEntry.version}`
    // 組み立て
    const prompt = selectedPromptFunction(fileName, pdfContentDummy)

    console.log(`[${new Date().toISOString()}] Sending prompt to Gemini API for file: ${fileName}`)
    // console.debug("Full Prompt to Gen:", prompt); // デバッグ時に必要ならコメント解除 (非常に長くなる可能性)

    // 4. Gemini API呼び出し
    let generatedTextByGen: string = ''
    let usageMetadata: any = null
    try {
      // API Ref https://ai.google.dev/api/generate-content?hl=ja#v1beta.GenerateContentResponse
      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
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
      if (typeof response.text === 'string') {
        generatedTextByGen = response.text
      } else {
        // response.text が undefined だった場合の処理
        // 例えば、デフォルトの文字列を代入する、エラーを投げる、など
        generatedTextByGen = '' // またはエラー処理
        console.error('response.text is undefined')
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

      // console.debug("Gen Raw Response Text:", generatedTextByGen); // デバッグ時に必要ならコメント解除
    } catch (genError: any) {
      console.error(`[${new Date().toISOString()}] Error calling Gemini API for ${fileName}:`, genError)
      let userFriendlyErrorMessage = 'AIによるテキスト生成に失敗しました。'
      // Gemini APIからのエラーレスポンスに詳細が含まれていれば、それをログに出力
      // genError.message にも情報が含まれることがある
      // if (genError.response && genError.response.promptFeedback) {
      //   console.error("Gemini API Prompt Feedback:", genError.response.promptFeedback);
      //   if(genError.response.promptFeedback.blockReason){
      //       userFriendlyErrorMessage += ` 理由: ${genError.response.promptFeedback.blockReason}`;
      //   }
      // }
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
              company_name: companyName, // 固定値または将来的に動的に設定
              gemini_processed_at: new Date().toISOString(), // Gemini処理完了時刻
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
      dbRecordId: dbRecordId, // DBに保存されたレコードのIDも返す (オプション)
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
