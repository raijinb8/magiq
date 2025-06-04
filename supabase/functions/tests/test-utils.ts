// Edge Functions用テストユーティリティ

export interface MockSupabaseClient {
  from: (table: string) => MockSupabaseQuery;
  storage: {
    from: (bucket: string) => MockSupabaseStorage;
  };
}

export interface MockSupabaseQuery {
  insert: (data: any) => Promise<{ data: any; error: null }>;
  select: (columns?: string) => MockSupabaseQuery;
  eq: (column: string, value: any) => MockSupabaseQuery;
  update: (data: any) => Promise<{ data: any; error: null }>;
  delete: () => Promise<{ data: any; error: null }>;
}

export interface MockSupabaseStorage {
  upload: (path: string, file: File) => Promise<{ data: { path: string }; error: null }>;
  createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string }; error: null }>;
}

// モックSupabaseクライアントの作成
export function createMockSupabaseClient(): MockSupabaseClient {
  const mockQuery: MockSupabaseQuery = {
    insert: async (data: any) => ({ data, error: null }),
    select: (columns?: string) => mockQuery,
    eq: (column: string, value: any) => mockQuery,
    update: async (data: any) => ({ data, error: null }),
    delete: async () => ({ data: {}, error: null }),
  };

  const mockStorage: MockSupabaseStorage = {
    upload: async (path: string, file: File) => ({
      data: { path },
      error: null,
    }),
    createSignedUrl: async (path: string, expiresIn: number) => ({
      data: { signedUrl: \`https://test.supabase.co/storage/v1/object/sign/\${path}\` },
      error: null,
    }),
  };

  return {
    from: (table: string) => mockQuery,
    storage: {
      from: (bucket: string) => mockStorage,
    },
  };
}

// モックFormDataの作成
export function createMockFormData(data: Record<string, string | File>): FormData {
  const formData = new FormData();
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      formData.append(key, value);
    } else {
      formData.append(key, value);
    }
  }
  
  return formData;
}

// モックPDFファイルの作成
export function createMockPdfFile(name = "test.pdf"): File {
  const pdfContent = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2D, // %PDF-
    // 簡単なPDFヘッダー
  ]);
  
  return new File([pdfContent], name, { type: "application/pdf" });
}

// モックレスポンスヘルパー
export const mockResponse = {
  json: (data: any, status = 200) => new Response(
    JSON.stringify(data),
    {
      headers: { "Content-Type": "application/json" },
      status,
    }
  ),
  
  error: (message: string, status = 500) => new Response(
    JSON.stringify({ error: message }),
    {
      headers: { "Content-Type": "application/json" },
      status,
    }
  ),
  
  cors: (data: any, status = 200) => new Response(
    JSON.stringify(data),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
      status,
    }
  ),
};

// 環境変数のモック
export function mockEnv(vars: Record<string, string>) {
  for (const [key, value] of Object.entries(vars)) {
    Deno.env.set(key, value);
  }
}

// テスト用のGemini APIレスポンスモック
export const mockGeminiResponse = {
  success: {
    candidates: [{
      content: {
        parts: [{
          text: "建物名: テストビル\\n工事内容: 改修工事\\n期間: 2024年1月-3月"
        }]
      }
    }],
    usageMetadata: {
      promptTokenCount: 1000,
      candidatesTokenCount: 100,
      totalTokenCount: 1100,
    }
  },
  
  error: {
    error: {
      code: 400,
      message: "Invalid request",
      status: "INVALID_ARGUMENT"
    }
  }
};