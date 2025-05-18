// supabase/functions/process-pdf-single/index.ts

import { GoogleGenAI } from "@google/genai";
// Supabaseクライアントをインポート (Deno用)
import { createClient, SupabaseClient } from '@supabase/supabase-js';
console.log("process-pdf-single function (v2 - with Gen) has been invoked!");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 開発中は '*'、本番ではReactアプリのオリジン
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 野原G住環境向けの固定プロンプト (ユーザー提供のものをここに記述)
// fileName と pdfContentDummy を受け取るようにテンプレート化
const NOHARA_G_PROMPT_TEMPLATE = (fileName: string, pdfContentDummy: string): string => `
添付された発注書 (${fileName}) から以下の情報を抽出し、指定された形式で厳密に整理してください。
PDFの実際の内容はまだ連携できませんが、仮の内容は「${pdfContentDummy}」です。

**最重要フォーマット指示:**
* **文字幅:** 日本語（漢字、ひらがな、カタカナ、括弧などの全角記号）は**全角**を使用します。**アラビア数字（0-9）、ハイフン（-）、ピリオド（.）、コロン（:）、アルファベット（例: F, x）は必ず半角**を使用してください。**【重要】絶対に数字、ハイフン、ピリオドを全角で出力しないでください。**
* **スペース:** スペース（例：会社名と担当者名の間、現場名と「邸」の間）は全角スペース（U+3000）を使用します。

**抽出・整形ステップ:**
* **開始時間:** (文書から時間を抽出。18:00なら08:00に修正考慮。AM/PMは24h表記。末尾「～」。**数字・コロンは必ず半角**。) 例: \`08:00～\`
* **担当会社・担当者:** (「野原グループ株式会社 住環境カンパニー」を「野原Ｇ住環境」に置換。担当者の苗字抽出。両者を**全角スペース**で連結。) 例: 「野原Ｇ住環境　牧」
* **現場名:**（値を抽出。日本人名なら姓と名の間**（例：菅原　一雄）**に全角スペース挿入試行。元のスペース保持。末尾に「邸」を**全角スペース**空けて追加。） 例: 「今中(公)　邸」、「菅原　一雄　邸」
* **得意先名:** (抽出。全角。)
* **現場住所:** (抽出。**住所内の数字やハイフンも必ず半角**で出力。)
* **現場連絡先:** (荷受人名（会社名と氏名間に**全角スペース**挿入試行）と電話番号抽出。「名前：電話番号」形式。**名前内のスペースは全角、コロン・数字・ハイフンは必ず半角**。） 例：「MH建設　村上様：080-4888-2659」
* **資材明細:** (プレフィックス決定[バリア強/バリア/強(全角)]。サイズ変換[数字/xは半角]。階数情報抽出[単位削除、階指定間の区切りを**全角スペース**に、F/数字は半角]。以下の形式で**全角スペース区切り**で連結: \`[Prefix(全角)][Thickness(半角)] [Size(半角)] [Floor/Qty(半角)]\`。 **数字、ピリオド、x、Fは必ず半角**。)
    * 例: \`12.5　3x6　3F17\`
    * 例: \`強12.5　3x6　1F15　2F11\`
    * 例: \`バリア強12.5　3x6　1F3\`
    * 例: \`バリア9.5　3x6　2F10\`
* **合計枚数:** (数量合計。「合計　[数字(半角)]枚」形式。**数字は必ず半角**。) 例: \`合計　147枚\`
* **備考:** (関連特記事項抽出。標準注意文/定型文除外。「※[情報]」形式リスト。**情報内の数字・記号(:等)は必ず半角**。末尾に固定3行追加:
    ※タオル巻き禁止!
    ※安全靴・上履き着用の事!
    ※現場内及び周辺(路上含む)は禁煙)
* **作業人数:** (抽出人数。「〇名作業」or「〇～〇名作業」形式。**数字・ハイフン(～)は必ず半角**。※なし。) 例: \`2名作業\`, \`1-2名作業\`

**最終確認:** 出力する前に、**すべての数字(0-9)、ハイフン(-)、ピリオド(.)、コロン(:)、アルファベット(F, x) が半角**になっていることを確認してください。

**出力形式例:** (全角/半角混合)
08:00～
野原Ｇ住環境　牧
今中(公)　邸
ミサワホーム株式会社
東京都世田谷区経堂3-447-36
MH建設　村上様：080-4888-2659
強12.5 3x8 1F10 2F49
バリア強12.5 3x6 1F29 2F5
バリア強12.5 3x8 1F29 2F25
合計　147枚
※安全装備 (安全靴) 着用の事
※ゲートNo: 0330
※キーBOX: 5685
※タオル巻き禁止!
※安全靴・上履き着用の事!
※現場内及び周辺(路上含む)は禁煙
2名作業
`; // プロンプトここまで

// グローバルスコープでSupabaseクライアントを一度だけ初期化 (パフォーマンスのため)
// 環境変数は関数の呼び出しごとにDeno.env.getで取得するのがより安全・確実な場合もある
// ここでは起動時に一度取得する例
let supabaseClient: SupabaseClient | null = null;
try {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.");
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        // サーバーサイドのクライアントなので、自動リフレッシュトークンは不要
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    console.log("Supabase client initialized for server-side use.");
  }
} catch (e) {
  console.error("Error initializing Supabase client:", e);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse JSON body:", e.message);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = body.fileName; // フロントエンドから送られてくるファイル名
    // 将来的にはここに実際のPDFの内容を渡す処理が入る（例: OCR結果など）
    // 今回はダミーのPDF内容を使います
    const pdfContentDummy = `これは ${fileName || '不明なファイル'} のダミーPDF内容です。実際にはここに抽出されたテキストが入ります。`;


    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'fileName is required in the request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Gemini APIキーを環境変数から取得
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
      return new Response(JSON.stringify({ error: "API key for AI service is not configured on the server." }), {
        status: 500, // Internal Server Error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Genクライアントの初期化
    const genAI = new GoogleGenAI({apiKey: GEMINI_API_KEY});
    const model = "gemini-2.5-flash-preview-04-17"; // または "gen-pro", "gen-1.5-pro-latest" など。速度とコストで選択。
    // gemini-2.5-flash-preview-04-17 適応的思考、費用対効果
    // gemini-2.5-pro-preview-05-06 思考と推論の強化、マルチモーダル理解、高度なコーディングなど
    // gemini-2.0-flash 次世代の機能、速度。

    // 3. プロンプトの組み立て
    const prompt = NOHARA_G_PROMPT_TEMPLATE(fileName, pdfContentDummy);

    console.log(`[${new Date().toISOString()}] Sending prompt to Gemini API for file: ${fileName}`);
    // console.debug("Full Prompt to Gen:", prompt); // デバッグ時に必要ならコメント解除 (非常に長くなる可能性)

    // 4. Gemini API呼び出し
    let generatedTextByGen = "";
    let usageMetadata: any = null;
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
      });
      generatedTextByGen = response.text;
      console.log(`[${new Date().toISOString()}] Successfully received response from Gemini API for: ${fileName}`);
      usageMetadata = response.usageMetadata;
      
      // usageMetadata が存在する場合、トークン数をログに出力
      if (usageMetadata) {
        console.log(`Token Usage for ${fileName}:`);
        console.log(`  Prompt Token Count: ${usageMetadata.promptTokenCount}`);
        // candidatesTokenCount は存在する場合のみログに出力 (モデルや設定により異なる)
        if (usageMetadata.candidatesTokenCount !== undefined) {
          console.log(`  Candidates Token Count: ${usageMetadata.candidatesTokenCount}`);
        }
        // totalTokenCount は存在する場合のみログに出力
        if (usageMetadata.totalTokenCount !== undefined) {
          console.log(`  Total Token Count: ${usageMetadata.totalTokenCount}`);
        }
        // cachedContentTokenCount も存在する場合がある
        if (usageMetadata.cachedContentTokenCount !== undefined) {
            console.log(`  Cached Content Token Count: ${usageMetadata.cachedContentTokenCount}`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] usageMetadata not found in Gemini API response for: ${fileName}`);
      }

      // console.debug("Gen Raw Response Text:", generatedTextByGen); // デバッグ時に必要ならコメント解除
    } catch (genError) {
      console.error(`[${new Date().toISOString()}] Error calling Gemini API for ${fileName}:`, genError);
      let userFriendlyErrorMessage = "AIによるテキスト生成に失敗しました。";
      // Gemini APIからのエラーレスポンスに詳細が含まれていれば、それをログに出力
      // genError.message にも情報が含まれることがある
      // if (genError.response && genError.response.promptFeedback) {
      //   console.error("Gemini API Prompt Feedback:", genError.response.promptFeedback);
      //   if(genError.response.promptFeedback.blockReason){
      //       userFriendlyErrorMessage += ` 理由: ${genError.response.promptFeedback.blockReason}`;
      //   }
      // }
      return new Response(JSON.stringify({ error: userFriendlyErrorMessage, details: genError.message }), {
        status: 502, // Bad Gateway (外部APIとの連携で問題があった場合)
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- データベースへの保存処理 ---
    let dbRecordId: string | null = null;
    if (supabaseClient) {
      try {
        console.log(`[${new Date().toISOString()}] Attempting to save generated text to database for: ${fileName}`);
        const { data: insertedData, error: dbError } = await supabaseClient
          .from('work_orders') // 作成したテーブル名
          .insert([
            {
              file_name: fileName,
              // uploaded_at: new Date().toISOString(), // 本来はフロントからアップロード時刻をもらうか、ここで設定
              generated_text: generatedTextByGen,
              // edited_text: generatedTextByGen, // 初期値として同じものを入れるか、NULLのままか
              status: 'completed_from_ai', // AI処理完了を示すステータス
              prompt_identifier: "NOHARA_G_PROMPT_V20250515", // どのプロンプトを使ったか
              // company_name: '野原Ｇ住環境', // 固定値または将来的に動的に設定
              gemini_processed_at: new Date().toISOString(), // Gemini処理完了時刻
            },
          ])
          .select('id') // 挿入されたレコードのIDを取得
          .single(); // 1件のレコードが返ることを期待

        if (dbError) {
          console.error(`[${new Date().toISOString()}] Error saving to database for ${fileName}:`, dbError);
          // DB保存エラーは致命的ではないかもしれないので、フロントには成功として返しつつログで警告する選択肢もある
          // 今回はエラーとして扱う
          return new Response(JSON.stringify({ error: "Failed to save generated text to database.", details: dbError.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (insertedData && insertedData.id) {
          dbRecordId = insertedData.id;
          console.log(`[${new Date().toISOString()}] Successfully saved to database for ${fileName}, record ID: ${dbRecordId}`);
        } else {
          console.warn(`[${new Date().toISOString()}] Saved to database for ${fileName}, but no ID returned or insert failed silently.`);
        }
      } catch (e) {
        console.error(`[${new Date().toISOString()}] Exception during database save for ${fileName}:`, e);
        // こちらもエラーとして扱う
        return new Response(JSON.stringify({ error: "An exception occurred while saving to database.", details: e.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn(`[${new Date().toISOString()}] Supabase client not initialized. Skipping database save for ${fileName}.`);
      // 開発中はDB接続なしでも動くようにしておくか、エラーにするか選択
      // 今回は警告のみで進めるが、本番では client が null ならエラーにすべき
    }

    // 5. フロントエンドへのレスポンス
    const responseData = {
      message: `Successfully generated and processed text for ${fileName}.`,
      generatedText: generatedTextByGen,
      originalFileName: fileName,
      promptUsedIdentifier: "NOHARA_G_PROMPT_V20250515", // プロンプトのバージョン管理用
      dbRecordId: dbRecordId, // DBに保存されたレコードのIDも返す (オプション)
    };

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Unhandled error in function:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});