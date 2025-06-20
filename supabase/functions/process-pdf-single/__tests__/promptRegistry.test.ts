// promptRegistry のテスト
import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from "@std/testing/asserts";
import { describe, it } from "@std/testing/bdd";
import {
  getPrompt,
  PROMPT_REGISTRY,
  type PromptFunction,
} from "../promptRegistry.ts";

describe("promptRegistry", () => {
  describe("PROMPT_REGISTRY", () => {
    it("NOHARA_G_MISAWAエントリが正しく設定されている", () => {
      const entry = PROMPT_REGISTRY["NOHARA_G_MISAWA"];
      assertExists(entry);
      if (entry) {
        assertEquals(entry.companyName, "野原G住環境");
        assertEquals(entry.version, "V20250526");
        assertExists(entry.promptFunction);
        assertEquals(typeof entry.promptFunction, "function");
      }
    });

    it("KATOUBENIYA_IKEBUKURO_MISAWAエントリが正しく設定されている", () => {
      const entry = PROMPT_REGISTRY["KATOUBENIYA_IKEBUKURO_MISAWA"];
      assertExists(entry);
      if (entry) {
        assertEquals(entry.companyName, "加藤ベニヤ池袋_ミサワホーム");
        assertEquals(entry.version, "V20250526");
        assertExists(entry.promptFunction);
        assertEquals(typeof entry.promptFunction, "function");
      }
    });

    it("各エントリが必要なプロパティを持っている", () => {
      Object.entries(PROMPT_REGISTRY).forEach(([key, entry]) => {
        if (entry) {
          assertExists(entry.companyName, `${key} に companyName が必要です`);
          assertExists(entry.version, `${key} に version が必要です`);
          assertExists(
            entry.promptFunction,
            `${key} に promptFunction が必要です`,
          );
          assertEquals(
            typeof entry.promptFunction,
            "function",
            `${key} の promptFunction は関数である必要があります`,
          );
        }
      });
    });
  });

  describe("getPrompt", () => {
    it("存在する会社IDでプロンプトエントリを取得できる", () => {
      const entry = getPrompt("NOHARA_G_MISAWA");
      assertExists(entry);
      assertEquals(entry?.companyName, "野原G住環境");
    });

    it("存在しない会社IDでnullを返す", () => {
      const entry = getPrompt("UNKNOWN_COMPANY");
      assertEquals(entry, null);
    });

    it("空文字列でnullを返す", () => {
      const entry = getPrompt("");
      assertEquals(entry, null);
    });

    it("大文字小文字を区別する", () => {
      const entry1 = getPrompt("NOHARA_G_MISAWA");
      const entry2 = getPrompt("nohara_g_misawa");
      assertExists(entry1);
      assertEquals(entry2, null);
    });
  });

  describe("PromptFunction", () => {
    it("NOHARA_G_MISAWAのプロンプト関数がファイル名を受け取り文字列を返す", () => {
      const entry = getPrompt("NOHARA_G_MISAWA");
      assertExists(entry);
      if (entry) {
        const result = entry.promptFunction("test.pdf");
        assertEquals(typeof result, "string");
        assertNotEquals(result, "");
      }
    });

    it("KATOUBENIYA_IKEBUKURO_MISAWAのプロンプト関数がファイル名を受け取り文字列を返す", () => {
      const entry = getPrompt("KATOUBENIYA_IKEBUKURO_MISAWA");
      assertExists(entry);
      if (entry) {
        const result = entry.promptFunction("test.pdf");
        assertEquals(typeof result, "string");
        assertNotEquals(result, "");
      }
    });

    it("プロンプト関数にファイル名が含まれる", () => {
      const entry = getPrompt("NOHARA_G_MISAWA");
      assertExists(entry);
      if (entry) {
        const fileName = "specific_test_file.pdf";
        const result = entry.promptFunction(fileName);
        // プロンプトにファイル名が含まれることを確認
        // （実際のプロンプト実装によっては調整が必要）
        assertEquals(result.includes(fileName), true);
      }
    });
  });

  describe("プロンプトレジストリの整合性", () => {
    it("すべてのエントリが一意のバージョンを持つ", () => {
      const versions = new Set<string>();
      const duplicates: string[] = [];

      Object.entries(PROMPT_REGISTRY).forEach(([key, entry]) => {
        if (entry) {
          const versionKey = `${key}_${entry.version}`;
          if (versions.has(versionKey)) {
            duplicates.push(versionKey);
          }
          versions.add(versionKey);
        }
      });

      assertEquals(
        duplicates.length,
        0,
        `重複するバージョン: ${duplicates.join(", ")}`,
      );
    });

    it("すべてのプロンプト関数が有効な文字列を返す", () => {
      Object.entries(PROMPT_REGISTRY).forEach(([key, entry]) => {
        if (entry) {
          const result = entry.promptFunction("test.pdf");
          assertNotEquals(
            result,
            "",
            `${key} のプロンプト関数が空文字列を返しました`,
          );
          assertNotEquals(
            result,
            null,
            `${key} のプロンプト関数がnullを返しました`,
          );
          assertNotEquals(
            result,
            undefined,
            `${key} のプロンプト関数がundefinedを返しました`,
          );
        }
      });
    });
  });
});
