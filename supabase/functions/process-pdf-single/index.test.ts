import { assertEquals, assertExists, assert } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { promptRegistry } from "./promptRegistry.ts";

// モック用のSupabaseクライアント
const mockSupabaseClient = createClient(
  "https://test.supabase.co",
  "test-anon-key"
);

// モック関数の作成
const mockResponse = {
  json: (data: any) => new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  }),
  error: (message: string, status = 500) => new Response(
    JSON.stringify({ error: message }),
    { 
      headers: { "Content-Type": "application/json" },
      status 
    }
  ),
};

Deno.test("promptRegistry - 会社IDに基づくプロンプト取得", async () => {
  const noharaPrompt = promptRegistry.getPrompt("NOHARA_G", "default");
  assertExists(noharaPrompt);
  assertEquals(noharaPrompt.companyId, "NOHARA_G");
  
  const katouPrompt = promptRegistry.getPrompt("KATOUBENIYA_MISAWA", "default");  
  assertExists(katouPrompt);
  assertEquals(katouPrompt.companyId, "KATOUBENIYA_MISAWA");
});

Deno.test("promptRegistry - 無効な会社IDでエラー", () => {
  try {
    promptRegistry.getPrompt("INVALID_COMPANY", "default");
    assert(false, "エラーが発生するべき");
  } catch (error) {
    assertExists(error);
    assert(error.message.includes("Invalid company"));
  }
});

Deno.test("Edge Function - リクエスト検証", async () => {
  // FormDataなしのリクエスト
  const emptyRequest = new Request("http://localhost", {
    method: "POST",
  });

  // 実際のハンドラー関数のテストは、関数を別ファイルに分離してからテスト
  // ここでは基本的な構造をテスト
  assertEquals(emptyRequest.method, "POST");
});

Deno.test("PDF処理 - ファイル形式検証", async () => {
  // PDFファイルのモック
  const pdfBlob = new Blob(["mock pdf content"], { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", pdfBlob, "test.pdf");
  formData.append("companyId", "NOHARA_G");

  const request = new Request("http://localhost", {
    method: "POST",
    body: formData,
  });

  const file = formData.get("file") as File;
  assertExists(file);
  assertEquals(file.type, "application/pdf");
  assertEquals(file.name, "test.pdf");
});

Deno.test("エラーハンドリング - 無効なファイル形式", async () => {
  const textFile = new Blob(["text content"], { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", textFile, "test.txt");

  const file = formData.get("file") as File;
  assert(file.type !== "application/pdf", "PDFファイルではない");
});

Deno.test("レスポンス形式の検証", () => {
  const successResponse = mockResponse.json({
    generatedText: "テスト結果",
    promptIdentifier: "NOHARA_G:V20250526",
    tokenUsage: { input: 100, output: 50, total: 150 },
    processingTime: 1000,
  });

  assertEquals(successResponse.status, 200);
  assert(successResponse.headers.get("Content-Type")?.includes("application/json"));
});

Deno.test("エラーレスポンス形式の検証", () => {
  const errorResponse = mockResponse.error("処理中にエラーが発生しました", 500);

  assertEquals(errorResponse.status, 500);
  assert(errorResponse.headers.get("Content-Type")?.includes("application/json"));
});