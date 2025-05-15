// supabase/functions/process-pdf-single/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Deno標準ライブラリからserveをインポート (バージョンは最新のものに合わせてもOK)

console.log("process-pdf-single function has been invoked!"); // 関数が呼び出されたことをログに出力

// CORSヘッダー: どのオリジンからのリクエストを許可するかなどを設定
// 開発中はローカルのReactアプリのポートを指定するのが良いでしょう (例: http://localhost:5173)
// '*' は全てのオリジンを許可しますが、本番ではセキュリティ上推奨されません。
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 後でReactアプリのオリジンに変更しましょう
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // 許可するヘッダー
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // 許可するHTTPメソッド (今回はPOSTとOPTIONS)
};

serve(async (req: Request) => {
  // OPTIONSメソッドはCORSのプリフライトリクエストとしてブラウザから送信されることがあるため、
  // これに対応しておかないと、POSTリクエストがブロックされることがあります。
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 今回はまずPOSTリクエストのみを受け付けるようにします。
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method Not Allowed. Please use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // フロントエンドから送られてくるJSONデータをパースします。
    // この段階では、ファイル名など簡単な情報を受け取ることを想定します。
    let body = {}; // 初期化
    try {
      body = await req.json(); // リクエストボディをJSONとして解析
    } catch (e) {
      // JSONのパースに失敗した場合 (例: ボディが空、またはJSON形式でない)
      console.error("Failed to parse JSON body:", e.message);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 400 Bad Request
      );
    }

    // 受け取ったデータの一部をログに出力してみましょう。
    // フロントエンドから { "fileName": "example.pdf" } のようなデータが送られてくることを期待します。
    const fileName = (body as any).fileName;
    console.log('Received request with body:', body);
    if (fileName) {
      console.log('File name from request:', fileName);
    } else {
      console.log('fileName not found in request body.');
      // fileNameが必須であれば、ここでエラーレスポンスを返すこともできます。
      // return new Response(
      //   JSON.stringify({ error: 'fileName is required in the request body.' }),
      //   { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      // );
    }

    // ダミーの業務手配書文言を作成
    const dummyGeneratedText = `これは「${fileName || "ファイル名不明のPDF"}」に対するダミーの業務手配書です。\nバックエンドAPI (process-pdf-single) から返されました。\n処理時刻: ${new Date().toLocaleTimeString()}`;

    // フロントエンドへのレスポンスデータ
    const responseData = {
      message: `Backend received your request for ${fileName || "a PDF file"}. This is a dummy response.`,
      generatedText: dummyGeneratedText,
      originalFileName: fileName || null,
    };

    // JSON形式でレスポンスを返す
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200, // 200 OK
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    // 予期せぬエラーが発生した場合の処理
    console.error('Unhandled error in function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});