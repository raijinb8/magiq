// supabase/functions/process-pdf-single/companyDetector.ts
import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// 会社検出結果の型定義
export interface CompanyDetectionResult {
  detectedCompanyId: string | null;
  confidence: number;
  method: "gemini_analysis" | "rule_based" | "unknown";
  details: {
    foundKeywords?: string[];
    matchedPatterns?: string[];
    geminiReasoning?: string;
    rulesApplied?: Array<{
      ruleId: string;
      ruleType: string;
      ruleValue: string;
      matched: boolean;
    }>;
  };
}

// 判定ルールの型定義
interface DetectionRule {
  id: string;
  company_id: string;
  rule_type: "keyword" | "pattern" | "address" | "logo_text";
  rule_value: string;
  priority: number;
}

/**
 * PDFファイルから会社を自動判定するクラス
 */
export class CompanyDetector {
  private genAI: GoogleGenAI;
  private supabaseClient: SupabaseClient | null;
  private detectionRules: DetectionRule[] = [];

  constructor(
    geminiApiKey: string,
    supabaseClient: SupabaseClient | null,
  ) {
    this.genAI = new GoogleGenAI({ apiKey: geminiApiKey });
    this.supabaseClient = supabaseClient;
  }

  /**
   * 判定ルールをデータベースから読み込む
   */
  async loadDetectionRules(): Promise<void> {
    if (!this.supabaseClient) {
      console.warn("Supabase client not available, using default rules");
      this.detectionRules = this.getDefaultRules();
      return;
    }

    try {
      const { data, error } = await this.supabaseClient
        .from("company_detection_rules")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (error) {
        console.error("Error loading detection rules:", error);
        this.detectionRules = this.getDefaultRules();
      } else {
        this.detectionRules = data || this.getDefaultRules();
        console.log(
          `Loaded ${this.detectionRules.length} detection rules from database`,
        );
      }
    } catch (e) {
      console.error("Exception loading detection rules:", e);
      this.detectionRules = this.getDefaultRules();
    }
  }

  /**
   * デフォルトの判定ルール（データベースが利用できない場合）
   */
  private getDefaultRules(): DetectionRule[] {
    return [
      // 野原G住環境
      {
        id: "1",
        company_id: "NOHARA_G",
        rule_type: "keyword",
        rule_value: "野原G住環境",
        priority: 100,
      },
      {
        id: "2",
        company_id: "NOHARA_G",
        rule_type: "keyword",
        rule_value: "野原G",
        priority: 90,
      },
      {
        id: "3",
        company_id: "NOHARA_G",
        rule_type: "keyword",
        rule_value: "野原グループ",
        priority: 80,
      },

      // 加藤ベニヤ池袋_ミサワホーム
      {
        id: "4",
        company_id: "KATOUBENIYA_IKEBUKURO_MISAWA",
        rule_type: "keyword",
        rule_value: "加藤ベニヤ",
        priority: 100,
      },
      {
        id: "5",
        company_id: "KATOUBENIYA_IKEBUKURO_MISAWA",
        rule_type: "keyword",
        rule_value: "ミサワホーム",
        priority: 100,
      },
      {
        id: "6",
        company_id: "KATOUBENIYA_IKEBUKURO_MISAWA",
        rule_type: "keyword",
        rule_value: "加藤ベニヤ池袋",
        priority: 95,
      },
    ];
  }

  /**
   * PDFファイルから会社を検出
   */
  async detectCompany(
    pdfFile: File,
    pdfBase64: string,
  ): Promise<CompanyDetectionResult> {
    console.log(
      `[Company Detection] Starting detection for file: ${pdfFile.name}`,
    );

    // 判定ルールが読み込まれていない場合は読み込む
    if (this.detectionRules.length === 0) {
      await this.loadDetectionRules();
    }

    try {
      // Gemini APIを使用してPDF内容を分析
      const geminiResult = await this.analyzeWithGemini(pdfFile, pdfBase64);

      // Geminiの結果が高信頼度の場合はそれを返す
      if (geminiResult.confidence >= 0.85) {
        console.log(
          `[Company Detection] High confidence Gemini result: ${geminiResult.detectedCompanyId} (${geminiResult.confidence})`,
        );
        return geminiResult;
      }

      // ルールベースの判定も試みる（Geminiの結果を補完）
      const ruleBasedResult = await this.applyRuleBasedDetection(
        pdfFile,
        pdfBase64,
      );

      // 両方の結果を比較して、より信頼度の高い方を選択
      if (ruleBasedResult.confidence > geminiResult.confidence) {
        console.log(
          `[Company Detection] Rule-based result has higher confidence: ${ruleBasedResult.detectedCompanyId} (${ruleBasedResult.confidence})`,
        );
        return ruleBasedResult;
      }

      return geminiResult;
    } catch (error) {
      console.error("[Company Detection] Error during detection:", error);
      return {
        detectedCompanyId: null,
        confidence: 0,
        method: "unknown",
        details: {
          geminiReasoning: `エラーが発生しました: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      };
    }
  }

  /**
   * Gemini APIを使用してPDF内容を分析
   */
  private async analyzeWithGemini(
    pdfFile: File,
    pdfBase64: string,
  ): Promise<CompanyDetectionResult> {
    const prompt = `
以下のPDFファイルから、発注元の会社を判定してください。

現在登録されている会社：
1. NOHARA_G - 野原G住環境、野原グループ
2. KATOUBENIYA_IKEBUKURO_MISAWA - 加藤ベニヤ、加藤ベニヤ池袋、ミサワホーム

判定基準：
- 会社名、ロゴ、住所、電話番号
- 書類のフォーマットやレイアウトの特徴
- 特定の文言やキーワード

必ず以下のJSON形式で回答してください：
{
  "company_id": "NOHARA_G" または "KATOUBENIYA_IKEBUKURO_MISAWA" または null,
  "confidence": 0.0から1.0の数値,
  "reasoning": "判定理由の説明",
  "found_keywords": ["検出されたキーワード1", "キーワード2"]
}

PDFを分析して、どの会社の書類か判定してください。
`;

    try {
      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: pdfFile.type,
                data: pdfBase64,
              },
            },
          ],
        }],
      });

      const responseText = response.text || "";
      console.log("[Company Detection] Gemini raw response:", responseText);

      // JSONレスポンスをパース
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }

        const result = JSON.parse(jsonMatch[0]);
        return {
          detectedCompanyId: result.company_id || null,
          confidence: typeof result.confidence === "number"
            ? result.confidence
            : 0,
          method: "gemini_analysis",
          details: {
            geminiReasoning: result.reasoning || "",
            foundKeywords: result.found_keywords || [],
          },
        };
      } catch (parseError) {
        console.error(
          "[Company Detection] Failed to parse Gemini response:",
          parseError,
        );
        return {
          detectedCompanyId: null,
          confidence: 0,
          method: "gemini_analysis",
          details: {
            geminiReasoning: "JSONパースエラー: " + responseText,
          },
        };
      }
    } catch (error) {
      console.error("[Company Detection] Gemini API error:", error);
      throw error;
    }
  }

  /**
   * ルールベースの判定を適用（フォールバック用）
   */
  private async applyRuleBasedDetection(
    pdfFile: File,
    pdfBase64: string,
  ): Promise<CompanyDetectionResult> {
    // この実装では、Geminiを使ってテキスト抽出し、ルールを適用
    // 実際の実装では、より効率的な方法を検討する
    const extractedText = await this.extractTextWithGemini(pdfFile, pdfBase64);

    const companyScores: { [key: string]: number } = {};
    const matchedRules: any[] = [];

    for (const rule of this.detectionRules) {
      let matched = false;

      if (rule.rule_type === "keyword") {
        if (extractedText.includes(rule.rule_value)) {
          matched = true;
          companyScores[rule.company_id] =
            (companyScores[rule.company_id] || 0) + rule.priority;
        }
      } else if (rule.rule_type === "pattern") {
        const regex = new RegExp(rule.rule_value, "i");
        if (regex.test(extractedText)) {
          matched = true;
          companyScores[rule.company_id] =
            (companyScores[rule.company_id] || 0) + rule.priority;
        }
      }

      matchedRules.push({
        ruleId: rule.id,
        ruleType: rule.rule_type,
        ruleValue: rule.rule_value,
        matched,
      });
    }

    // 最高スコアの会社を選択
    let detectedCompanyId: string | null = null;
    let maxScore = 0;

    for (const [companyId, score] of Object.entries(companyScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedCompanyId = companyId;
      }
    }

    // 信頼度の計算（最大スコアの正規化）
    const confidence = maxScore > 0 ? Math.min(maxScore / 200, 0.95) : 0;

    return {
      detectedCompanyId,
      confidence,
      method: "rule_based",
      details: {
        rulesApplied: matchedRules.filter((r) => r.matched),
      },
    };
  }

  /**
   * Geminiを使ってPDFからテキストを抽出（ルールベース判定用）
   */
  private async extractTextWithGemini(
    pdfFile: File,
    pdfBase64: string,
  ): Promise<string> {
    const prompt =
      "このPDFファイルの全テキストを抽出してください。フォーマットは保持しなくて構いません。";

    try {
      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: pdfFile.type,
                data: pdfBase64,
              },
            },
          ],
        }],
      });

      return response.text || "";
    } catch (error) {
      console.error("[Company Detection] Text extraction error:", error);
      return "";
    }
  }

  /**
   * 判定履歴を保存
   */
  async saveDetectionHistory(
    workOrderId: string,
    fileName: string,
    detectionResult: CompanyDetectionResult,
    userId?: string,
  ): Promise<void> {
    if (!this.supabaseClient) {
      console.warn("Supabase client not available, skipping history save");
      return;
    }

    try {
      const { error } = await this.supabaseClient
        .from("company_detection_history")
        .insert({
          work_order_id: workOrderId,
          file_name: fileName,
          detected_company_id: detectionResult.detectedCompanyId,
          detection_confidence: detectionResult.confidence,
          detection_details: detectionResult.details,
          created_by: userId,
        });

      if (error) {
        console.error("Error saving detection history:", error);
      } else {
        console.log(
          `[Company Detection] History saved for work order: ${workOrderId}`,
        );
      }
    } catch (e) {
      console.error("Exception saving detection history:", e);
    }
  }
}
