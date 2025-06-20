// supabase/functions/process-pdf-single/promptRegistry.ts
// フロントエンドから送られてくる会社ID（例: NOHARA_G_）と、
// 実際に呼び出すべきプロンプト関数（またはそのファイルパス）を
// 対応付ける「マッピング情報」
import { KATOUBENIYA_IKEBUKURO_MISAWA_PROMPT as KATOUBENIYA_IKEBUKURO_MISAWA_PROMPT_FUNC } from "./prompts/katouBeniyaIkebukuro/misawa.ts";

// 親会社単体（27社）のインポート
import { SONOTA_PROMPT as SONOTA_PROMPT_FUNC } from "./prompts/sonota.ts";
import { AIBUILD_PROMPT as AIBUILD_PROMPT_FUNC } from "./prompts/aibuild.ts";
import { GOODHOUSER_PROMPT as GOODHOUSER_PROMPT_FUNC } from "./prompts/goodhouser.ts";
import { JAPAN_KENZAI_PROMPT as JAPAN_KENZAI_PROMPT_FUNC } from "./prompts/japanKenzai.ts";
import { JUTEC_PROMPT as JUTEC_PROMPT_FUNC } from "./prompts/jutec.ts";
import { CHIYODA_UTE_PROMPT as CHIYODA_UTE_PROMPT_FUNC } from "./prompts/chiyodaUte.ts";
import { TOWA_KENKO_PROMPT as TOWA_KENKO_PROMPT_FUNC } from "./prompts/towaKenko.ts";
import { YUTAKA_KENSETSU_PROMPT as YUTAKA_KENSETSU_PROMPT_FUNC } from "./prompts/yutakaKensetsu.ts";
import { ITO_KENSETSU_PROMPT as ITO_KENSETSU_PROMPT_FUNC } from "./prompts/itoKensetsu.ts";
import { KOSHIN_KENSETSU_PROMPT as KOSHIN_KENSETSU_PROMPT_FUNC } from "./prompts/koshinKensetsu.ts";
import { RIKOU_KENSETSU_PROMPT as RIKOU_KENSETSU_PROMPT_FUNC } from "./prompts/rikouKensetsu.ts";
import { KATOUBENIYA_ASAGIRI_PROMPT as KATOUBENIYA_ASAGIRI_PROMPT_FUNC } from "./prompts/katouBeniyaAsagiri.ts";
import { KATOUBENIYA_IKEBUKURO_PROMPT as KATOUBENIYA_IKEBUKURO_PROMPT_FUNC } from "./prompts/katouBeniyaIkebukuro.ts";
import { YOSHINO_SEKKO_PROMPT as YOSHINO_SEKKO_PROMPT_FUNC } from "./prompts/yoshinoSekko.ts";
import { WAIMI_PROMPT as WAIMI_PROMPT_FUNC } from "./prompts/waimi.ts";
import { JONAN_SATO_PROMPT as JONAN_SATO_PROMPT_FUNC } from "./prompts/jonanSato.ts";
import { TAISEI_MOKUZAI_PROMPT as TAISEI_MOKUZAI_PROMPT_FUNC } from "./prompts/taiseiMokuzai.ts";
import { MIYAKEN_HOUSING_PROMPT as MIYAKEN_HOUSING_PROMPT_FUNC } from "./prompts/miyakenHousing.ts";
import { TOKUSAN_ZAIMOKU_PROMPT as TOKUSAN_ZAIMOKU_PROMPT_FUNC } from "./prompts/tokusanZaimoku.ts";
import { TOKYO_SHINKENZAI_PROMPT as TOKYO_SHINKENZAI_PROMPT_FUNC } from "./prompts/tokyoShinkenzai.ts";
import { SAKAE_KENSETSU_PROMPT as SAKAE_KENSETSU_PROMPT_FUNC } from "./prompts/sakaeKensetsu.ts";
import { YAMAFUJI_PROMPT as YAMAFUJI_PROMPT_FUNC } from "./prompts/yamafuji.ts";
import { WATANABE_BENIYA_CHIBA_PROMPT as WATANABE_BENIYA_CHIBA_PROMPT_FUNC } from "./prompts/watanabeBeniyaChiba.ts";
import { WATANABE_BENIYA_JONANSHIMA_PROMPT as WATANABE_BENIYA_JONANSHIMA_PROMPT_FUNC } from "./prompts/watanabeBeniyaJonanshima.ts";
import { WATABE_KOUMUTEN_PROMPT as WATABE_KOUMUTEN_PROMPT_FUNC } from "./prompts/watabeKoumuten.ts";
import { ISHIDA_MOKUZAI_PROMPT as ISHIDA_MOKUZAI_PROMPT_FUNC } from "./prompts/ishidaMokuzai.ts";
import { BENCHU_PROMPT as BENCHU_PROMPT_FUNC } from "./prompts/benchu.ts";
import { MINOHIRO_PROMPT as MINOHIRO_PROMPT_FUNC } from "./prompts/minohiro.ts";

// サブ会社組み合わせのインポート
// ジャパン建材系（3社）
import { JAPAN_KENZAI_AIDA_PROMPT as JAPAN_KENZAI_AIDA_PROMPT_FUNC } from "./prompts/japanKenzai/aida.ts";
import { JAPAN_KENZAI_APPLEHOME_PROMPT as JAPAN_KENZAI_APPLEHOME_PROMPT_FUNC } from "./prompts/japanKenzai/applehome.ts";
import { JAPAN_KENZAI_ECOHOUSE_PROMPT as JAPAN_KENZAI_ECOHOUSE_PROMPT_FUNC } from "./prompts/japanKenzai/ecohouse.ts";

// ジューテック系（4社）
import { JUTEC_KEFI_PROMPT as JUTEC_KEFI_PROMPT_FUNC } from "./prompts/jutec/kefi.ts";
import { JUTEC_FSTAGE_PROMPT as JUTEC_FSTAGE_PROMPT_FUNC } from "./prompts/jutec/fstage.ts";
import { JUTEC_CAREN_PROMPT as JUTEC_CAREN_PROMPT_FUNC } from "./prompts/jutec/caren.ts";
import { JUTEC_RENOVESIA_PROMPT as JUTEC_RENOVESIA_PROMPT_FUNC } from "./prompts/jutec/renovesia.ts";

// 加藤ベニヤ朝霧系（5社）
import { KATOUBENIYA_ASAGIRI_AIDA_PROMPT as KATOUBENIYA_ASAGIRI_AIDA_PROMPT_FUNC } from "./prompts/katouBeniyaAsagiri/aida.ts";
import { KATOUBENIYA_ASAGIRI_ACURA_PROMPT as KATOUBENIYA_ASAGIRI_ACURA_PROMPT_FUNC } from "./prompts/katouBeniyaAsagiri/acura.ts";
import { KATOUBENIYA_ASAGIRI_TAMURA_PROMPT as KATOUBENIYA_ASAGIRI_TAMURA_PROMPT_FUNC } from "./prompts/katouBeniyaAsagiri/tamura.ts";
import { KATOUBENIYA_ASAGIRI_DAIWA_PROMPT as KATOUBENIYA_ASAGIRI_DAIWA_PROMPT_FUNC } from "./prompts/katouBeniyaAsagiri/daiwa.ts";
import { KATOUBENIYA_ASAGIRI_ASAHI_PROMPT as KATOUBENIYA_ASAGIRI_ASAHI_PROMPT_FUNC } from "./prompts/katouBeniyaAsagiri/asahi.ts";

// 加藤ベニヤ池袋系（1社）
import { KATOUBENIYA_IKEBUKURO_HAWKONE_PROMPT as KATOUBENIYA_IKEBUKURO_HAWKONE_PROMPT_FUNC } from "./prompts/katouBeniyaIkebukuro/hawkone.ts";

// 大成木材系（1社）
import { TAISEI_MOKUZAI_SEKISUI_PROMPT as TAISEI_MOKUZAI_SEKISUI_PROMPT_FUNC } from "./prompts/taiseiMokuzai/sekisui.ts";

// 渡辺ベニヤ城南島系（2社）
import { WATANABE_JONANSHIMA_TOYOTA_PROMPT as WATANABE_JONANSHIMA_TOYOTA_PROMPT_FUNC } from "./prompts/watanabeBeniyaJonanshima/toyota.ts";
import { WATANABE_JONANSHIMA_SUMIRIN_PROMPT as WATANABE_JONANSHIMA_SUMIRIN_PROMPT_FUNC } from "./prompts/watanabeBeniyaJonanshima/sumirin.ts";

// 野原G住環境系（10社）
import { NOHARA_G_TAMAC_PROMPT as NOHARA_G_TAMAC_PROMPT_FUNC } from "./prompts/noharaG/tamac.ts";
import { NOHARA_G_MISAWA_PROMPT as NOHARA_G_MISAWA_PROMPT_FUNC } from "./prompts/noharaG/misawa.ts";
import { NOHARA_G_MELDIA_PROMPT as NOHARA_G_MELDIA_PROMPT_FUNC } from "./prompts/noharaG/meldia.ts";
import { NOHARA_G_YAMATO_PROMPT as NOHARA_G_YAMATO_PROMPT_FUNC } from "./prompts/noharaG/yamato.ts";
import { NOHARA_G_ISHO_PROMPT as NOHARA_G_ISHO_PROMPT_FUNC } from "./prompts/noharaG/isho.ts";
import { NOHARA_G_UCHIUMI_PROMPT as NOHARA_G_UCHIUMI_PROMPT_FUNC } from "./prompts/noharaG/uchiumi.ts";
import { NOHARA_G_SAKAE_PROMPT as NOHARA_G_SAKAE_PROMPT_FUNC } from "./prompts/noharaG/sakae.ts";
import { NOHARA_G_YOSHINO_PROMPT as NOHARA_G_YOSHINO_PROMPT_FUNC } from "./prompts/noharaG/yoshino.ts";
import { NOHARA_G_BUSHU_PROMPT as NOHARA_G_BUSHU_PROMPT_FUNC } from "./prompts/noharaG/bushu.ts";
import { NOHARA_G_MORO_PROMPT as NOHARA_G_MORO_PROMPT_FUNC } from "./prompts/noharaG/moro.ts";

// プロンプト関数の型定義 (一貫性を保つため)
export type PromptFunction = (fileName: string) => string;

interface PromptRegistryEntry {
  filePathForLogging?: string; // デバッグやログ出力用 (動的インポートを使わない場合は主にこれ)
  promptFunction: PromptFunction;
  companyName: string;
  version: string; // プロンプトのバージョン
}

// フロントエンドから送られてくる companyId (またはそれを処理して得られるキー) とプロンプトの対応表
export const PROMPT_REGISTRY: Record<string, PromptRegistryEntry | undefined> =
  {
    KATOUBENIYA_IKEBUKURO_MISAWA: {
      filePathForLogging: "./prompts/katouBeniyaIkebukuro/misawa.ts",
      promptFunction: KATOUBENIYA_IKEBUKURO_MISAWA_PROMPT_FUNC,
      companyName: "加藤ベニヤ池袋_ミサワホーム",
      version: "V20250526",
    },
    
    // 親会社単体（27社）
    SONOTA: {
      filePathForLogging: "./prompts/sonota.ts",
      promptFunction: SONOTA_PROMPT_FUNC,
      companyName: "その他",
      version: "V20250610",
    },
    AIBUILD: {
      filePathForLogging: "./prompts/aibuild.ts",
      promptFunction: AIBUILD_PROMPT_FUNC,
      companyName: "アイビルド",
      version: "V20250610",
    },
    GOODHOUSER: {
      filePathForLogging: "./prompts/goodhouser.ts",
      promptFunction: GOODHOUSER_PROMPT_FUNC,
      companyName: "グッドハウザー",
      version: "V20250610",
    },
    JAPAN_KENZAI: {
      filePathForLogging: "./prompts/japanKenzai.ts",
      promptFunction: JAPAN_KENZAI_PROMPT_FUNC,
      companyName: "ジャパン建材",
      version: "V20250610",
    },
    JUTEC: {
      filePathForLogging: "./prompts/jutec.ts",
      promptFunction: JUTEC_PROMPT_FUNC,
      companyName: "ジューテック",
      version: "V20250610",
    },
    CHIYODA_UTE: {
      filePathForLogging: "./prompts/chiyodaUte.ts",
      promptFunction: CHIYODA_UTE_PROMPT_FUNC,
      companyName: "チヨダウーテ",
      version: "V20250610",
    },
    TOWA_KENKO: {
      filePathForLogging: "./prompts/towaKenko.ts",
      promptFunction: TOWA_KENKO_PROMPT_FUNC,
      companyName: "トーア建工",
      version: "V20250610",
    },
    YUTAKA_KENSETSU: {
      filePathForLogging: "./prompts/yutakaKensetsu.ts",
      promptFunction: YUTAKA_KENSETSU_PROMPT_FUNC,
      companyName: "ユタカ建設",
      version: "V20250610",
    },
    ITO_KENSETSU: {
      filePathForLogging: "./prompts/itoKensetsu.ts",
      promptFunction: ITO_KENSETSU_PROMPT_FUNC,
      companyName: "伊藤建設",
      version: "V20250610",
    },
    KOSHIN_KENSETSU: {
      filePathForLogging: "./prompts/koshinKensetsu.ts",
      promptFunction: KOSHIN_KENSETSU_PROMPT_FUNC,
      companyName: "公進建設",
      version: "V20250610",
    },
    RIKOU_KENSETSU: {
      filePathForLogging: "./prompts/rikouKensetsu.ts",
      promptFunction: RIKOU_KENSETSU_PROMPT_FUNC,
      companyName: "利幸建設",
      version: "V20250610",
    },
    KATOUBENIYA_ASAGIRI: {
      filePathForLogging: "./prompts/katouBeniyaAsagiri.ts",
      promptFunction: KATOUBENIYA_ASAGIRI_PROMPT_FUNC,
      companyName: "加藤ベニヤ朝霧",
      version: "V20250610",
    },
    KATOUBENIYA_IKEBUKURO: {
      filePathForLogging: "./prompts/katouBeniyaIkebukuro.ts",
      promptFunction: KATOUBENIYA_IKEBUKURO_PROMPT_FUNC,
      companyName: "加藤ベニヤ池袋",
      version: "V20250610",
    },
    YOSHINO_SEKKO: {
      filePathForLogging: "./prompts/yoshinoSekko.ts",
      promptFunction: YOSHINO_SEKKO_PROMPT_FUNC,
      companyName: "吉野石膏",
      version: "V20250610",
    },
    WAIMI: {
      filePathForLogging: "./prompts/waimi.ts",
      promptFunction: WAIMI_PROMPT_FUNC,
      companyName: "和以美",
      version: "V20250610",
    },
    JONAN_SATO: {
      filePathForLogging: "./prompts/jonanSato.ts",
      promptFunction: JONAN_SATO_PROMPT_FUNC,
      companyName: "城南佐藤工務店",
      version: "V20250610",
    },
    TAISEI_MOKUZAI: {
      filePathForLogging: "./prompts/taiseiMokuzai.ts",
      promptFunction: TAISEI_MOKUZAI_PROMPT_FUNC,
      companyName: "大成木材",
      version: "V20250610",
    },
    MIYAKEN_HOUSING: {
      filePathForLogging: "./prompts/miyakenHousing.ts",
      promptFunction: MIYAKEN_HOUSING_PROMPT_FUNC,
      companyName: "宮建ハウジング",
      version: "V20250610",
    },
    TOKUSAN_ZAIMOKU: {
      filePathForLogging: "./prompts/tokusanZaimoku.ts",
      promptFunction: TOKUSAN_ZAIMOKU_PROMPT_FUNC,
      companyName: "徳三材木",
      version: "V20250610",
    },
    TOKYO_SHINKENZAI: {
      filePathForLogging: "./prompts/tokyoShinkenzai.ts",
      promptFunction: TOKYO_SHINKENZAI_PROMPT_FUNC,
      companyName: "東京新建材社",
      version: "V20250610",
    },
    SAKAE_KENSETSU: {
      filePathForLogging: "./prompts/sakaeKensetsu.ts",
      promptFunction: SAKAE_KENSETSU_PROMPT_FUNC,
      companyName: "栄建設",
      version: "V20250610",
    },
    YAMAFUJI: {
      filePathForLogging: "./prompts/yamafuji.ts",
      promptFunction: YAMAFUJI_PROMPT_FUNC,
      companyName: "株式会社山藤",
      version: "V20250610",
    },
    WATANABE_BENIYA_CHIBA: {
      filePathForLogging: "./prompts/watanabeBeniyaChiba.ts",
      promptFunction: WATANABE_BENIYA_CHIBA_PROMPT_FUNC,
      companyName: "渡辺ベニヤ千葉",
      version: "V20250610",
    },
    WATANABE_BENIYA_JONANSHIMA: {
      filePathForLogging: "./prompts/watanabeBeniyaJonanshima.ts",
      promptFunction: WATANABE_BENIYA_JONANSHIMA_PROMPT_FUNC,
      companyName: "渡辺ベニヤ城南島",
      version: "V20250610",
    },
    WATABE_KOUMUTEN: {
      filePathForLogging: "./prompts/watabeKoumuten.ts",
      promptFunction: WATABE_KOUMUTEN_PROMPT_FUNC,
      companyName: "渡部工務店",
      version: "V20250610",
    },
    ISHIDA_MOKUZAI: {
      filePathForLogging: "./prompts/ishidaMokuzai.ts",
      promptFunction: ISHIDA_MOKUZAI_PROMPT_FUNC,
      companyName: "石田木材",
      version: "V20250610",
    },
    BENCHU: {
      filePathForLogging: "./prompts/benchu.ts",
      promptFunction: BENCHU_PROMPT_FUNC,
      companyName: "紅中",
      version: "V20250610",
    },
    MINOHIRO: {
      filePathForLogging: "./prompts/minohiro.ts",
      promptFunction: MINOHIRO_PROMPT_FUNC,
      companyName: "美濃弘商店",
      version: "V20250610",
    },
    
    // サブ会社組み合わせ（26社）
    // ジャパン建材系（3社）
    JAPAN_KENZAI_AIDA: {
      filePathForLogging: "./prompts/japanKenzai/aida.ts",
      promptFunction: JAPAN_KENZAI_AIDA_PROMPT_FUNC,
      companyName: "ジャパン建材_アイダ設計",
      version: "V20250610",
    },
    JAPAN_KENZAI_APPLEHOME: {
      filePathForLogging: "./prompts/japanKenzai/applehome.ts",
      promptFunction: JAPAN_KENZAI_APPLEHOME_PROMPT_FUNC,
      companyName: "ジャパン建材_アップルホーム",
      version: "V20250610",
    },
    JAPAN_KENZAI_ECOHOUSE: {
      filePathForLogging: "./prompts/japanKenzai/ecohouse.ts",
      promptFunction: JAPAN_KENZAI_ECOHOUSE_PROMPT_FUNC,
      companyName: "ジャパン建材_エコハウス",
      version: "V20250610",
    },
    
    // ジューテック系（4社）
    JUTEC_KEFI: {
      filePathForLogging: "./prompts/jutec/kefi.ts",
      promptFunction: JUTEC_KEFI_PROMPT_FUNC,
      companyName: "ジューテック_KEFI WORKS",
      version: "V20250610",
    },
    JUTEC_FSTAGE: {
      filePathForLogging: "./prompts/jutec/fstage.ts",
      promptFunction: JUTEC_FSTAGE_PROMPT_FUNC,
      companyName: "ジューテック_エフステージ",
      version: "V20250610",
    },
    JUTEC_CAREN: {
      filePathForLogging: "./prompts/jutec/caren.ts",
      promptFunction: JUTEC_CAREN_PROMPT_FUNC,
      companyName: "ジューテック_カレンエステート",
      version: "V20250610",
    },
    JUTEC_RENOVESIA: {
      filePathForLogging: "./prompts/jutec/renovesia.ts",
      promptFunction: JUTEC_RENOVESIA_PROMPT_FUNC,
      companyName: "ジューテック_リノベシア",
      version: "V20250610",
    },
    
    // 加藤ベニヤ朝霧系（5社）
    KATOUBENIYA_ASAGIRI_AIDA: {
      filePathForLogging: "./prompts/katouBeniyaAsagiri/aida.ts",
      promptFunction: KATOUBENIYA_ASAGIRI_AIDA_PROMPT_FUNC,
      companyName: "加藤ベニヤ朝霧_アイダ設計",
      version: "V20250610",
    },
    KATOUBENIYA_ASAGIRI_ACURA: {
      filePathForLogging: "./prompts/katouBeniyaAsagiri/acura.ts",
      promptFunction: KATOUBENIYA_ASAGIRI_ACURA_PROMPT_FUNC,
      companyName: "加藤ベニヤ朝霧_アキュラホーム",
      version: "V20250610",
    },
    KATOUBENIYA_ASAGIRI_TAMURA: {
      filePathForLogging: "./prompts/katouBeniyaAsagiri/tamura.ts",
      promptFunction: KATOUBENIYA_ASAGIRI_TAMURA_PROMPT_FUNC,
      companyName: "加藤ベニヤ朝霧_タムラ建設",
      version: "V20250610",
    },
    KATOUBENIYA_ASAGIRI_DAIWA: {
      filePathForLogging: "./prompts/katouBeniyaAsagiri/daiwa.ts",
      promptFunction: KATOUBENIYA_ASAGIRI_DAIWA_PROMPT_FUNC,
      companyName: "加藤ベニヤ朝霧_大和ハウス",
      version: "V20250610",
    },
    KATOUBENIYA_ASAGIRI_ASAHI: {
      filePathForLogging: "./prompts/katouBeniyaAsagiri/asahi.ts",
      promptFunction: KATOUBENIYA_ASAGIRI_ASAHI_PROMPT_FUNC,
      companyName: "加藤ベニヤ朝霧_旭ハウジング",
      version: "V20250610",
    },
    
    // 加藤ベニヤ池袋系（1社）
    KATOUBENIYA_IKEBUKURO_HAWKONE: {
      filePathForLogging: "./prompts/katouBeniyaIkebukuro/hawkone.ts",
      promptFunction: KATOUBENIYA_IKEBUKURO_HAWKONE_PROMPT_FUNC,
      companyName: "加藤ベニヤ池袋_ホークワン",
      version: "V20250610",
    },
    
    // 大成木材系（1社）
    TAISEI_MOKUZAI_SEKISUI: {
      filePathForLogging: "./prompts/taiseiMokuzai/sekisui.ts",
      promptFunction: TAISEI_MOKUZAI_SEKISUI_PROMPT_FUNC,
      companyName: "大成木材_積水ハウス",
      version: "V20250610",
    },
    
    // 渡辺ベニヤ城南島系（2社）
    WATANABE_JONANSHIMA_TOYOTA: {
      filePathForLogging: "./prompts/watanabeBeniyaJonanshima/toyota.ts",
      promptFunction: WATANABE_JONANSHIMA_TOYOTA_PROMPT_FUNC,
      companyName: "渡辺ベニヤ城南島_トヨタホーム",
      version: "V20250610",
    },
    WATANABE_JONANSHIMA_SUMIRIN: {
      filePathForLogging: "./prompts/watanabeBeniyaJonanshima/sumirin.ts",
      promptFunction: WATANABE_JONANSHIMA_SUMIRIN_PROMPT_FUNC,
      companyName: "渡辺ベニヤ城南島_住友林業",
      version: "V20250610",
    },
    
    // 野原G住環境系（10社）
    NOHARA_G_TAMAC: {
      filePathForLogging: "./prompts/noharaG/tamac.ts",
      promptFunction: NOHARA_G_TAMAC_PROMPT_FUNC,
      companyName: "野原G住環境_タマック",
      version: "V20250610",
    },
    NOHARA_G_MISAWA: {
      filePathForLogging: "./prompts/noharaG/misawa.ts",
      promptFunction: NOHARA_G_MISAWA_PROMPT_FUNC,
      companyName: "野原G住環境_ミサワホーム",
      version: "V20250526", // 旧NOHARA_Gから移行
    },
    NOHARA_G_MELDIA: {
      filePathForLogging: "./prompts/noharaG/meldia.ts",
      promptFunction: NOHARA_G_MELDIA_PROMPT_FUNC,
      companyName: "野原G住環境_メルディア",
      version: "V20250610",
    },
    NOHARA_G_YAMATO: {
      filePathForLogging: "./prompts/noharaG/yamato.ts",
      promptFunction: NOHARA_G_YAMATO_PROMPT_FUNC,
      companyName: "野原G住環境_ヤマト住建",
      version: "V20250610",
    },
    NOHARA_G_ISHO: {
      filePathForLogging: "./prompts/noharaG/isho.ts",
      promptFunction: NOHARA_G_ISHO_PROMPT_FUNC,
      companyName: "野原G住環境_井笑ホーム",
      version: "V20250610",
    },
    NOHARA_G_UCHIUMI: {
      filePathForLogging: "./prompts/noharaG/uchiumi.ts",
      promptFunction: NOHARA_G_UCHIUMI_PROMPT_FUNC,
      companyName: "野原G住環境_内海工務店",
      version: "V20250610",
    },
    NOHARA_G_SAKAE: {
      filePathForLogging: "./prompts/noharaG/sakae.ts",
      promptFunction: NOHARA_G_SAKAE_PROMPT_FUNC,
      companyName: "野原G住環境_栄工務店",
      version: "V20250610",
    },
    NOHARA_G_YOSHINO: {
      filePathForLogging: "./prompts/noharaG/yoshino.ts",
      promptFunction: NOHARA_G_YOSHINO_PROMPT_FUNC,
      companyName: "野原G住環境_株式会社ヨシノ",
      version: "V20250610",
    },
    NOHARA_G_BUSHU: {
      filePathForLogging: "./prompts/noharaG/bushu.ts",
      promptFunction: NOHARA_G_BUSHU_PROMPT_FUNC,
      companyName: "野原G住環境_武州建設",
      version: "V20250610",
    },
    NOHARA_G_MORO: {
      filePathForLogging: "./prompts/noharaG/moro.ts",
      promptFunction: NOHARA_G_MORO_PROMPT_FUNC,
      companyName: "野原G住環境_茂呂建設",
      version: "V20250610",
    },
  };

// 会社IDからプロンプト関数を取得するヘルパー関数
// 型安全性を高めるために
// キーが文字列で、値が PromptRegistryEntry 型または undefined (見つからない場合があるため)
export function getPrompt(companyId: string): PromptRegistryEntry | null {
  const entry = PROMPT_REGISTRY[companyId];
  if (entry) {
    return entry;
  }
  console.warn(`No prompt found in registry for companyId: ${companyId}`);
  return null;
}
