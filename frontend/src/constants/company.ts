// src/constants/company.ts
import type { CompanyOption } from '@/types';

export const COMPANY_OPTIONS: readonly CompanyOption[] = [
  // 既存実装済み（1社）
  { value: 'KATOUBENIYA_IKEBUKURO_MISAWA', label: '加藤ベニヤ池袋_ミサワホーム' },
  
  // 親会社単体（27社）
  { value: 'SONOTA', label: 'その他' },
  { value: 'AIBUILD', label: 'アイビルド' },
  { value: 'GOODHOUSER', label: 'グッドハウザー' },
  { value: 'JAPAN_KENZAI', label: 'ジャパン建材' },
  { value: 'JUTEC', label: 'ジューテック' },
  { value: 'CHIYODA_UTE', label: 'チヨダウーテ' },
  { value: 'TOWA_KENKO', label: 'トーア建工' },
  { value: 'YUTAKA_KENSETSU', label: 'ユタカ建設' },
  { value: 'ITO_KENSETSU', label: '伊藤建設' },
  { value: 'KOSHIN_KENSETSU', label: '公進建設' },
  { value: 'RIKOU_KENSETSU', label: '利幸建設' },
  { value: 'KATOUBENIYA_ASAGIRI', label: '加藤ベニヤ朝霧' },
  { value: 'KATOUBENIYA_IKEBUKURO', label: '加藤ベニヤ池袋' },
  { value: 'YOSHINO_SEKKO', label: '吉野石膏' },
  { value: 'WAIMI', label: '和以美' },
  { value: 'JONAN_SATO', label: '城南佐藤工務店' },
  { value: 'TAISEI_MOKUZAI', label: '大成木材' },
  { value: 'MIYAKEN_HOUSING', label: '宮建ハウジング' },
  { value: 'TOKUSAN_ZAIMOKU', label: '徳三材木' },
  { value: 'TOKYO_SHINKENZAI', label: '東京新建材社' },
  { value: 'SAKAE_KENSETSU', label: '栄建設' },
  { value: 'YAMAFUJI', label: '株式会社山藤' },
  { value: 'WATANABE_BENIYA_CHIBA', label: '渡辺ベニヤ千葉' },
  { value: 'WATANABE_BENIYA_JONANSHIMA', label: '渡辺ベニヤ城南島' },
  { value: 'WATABE_KOUMUTEN', label: '渡部工務店' },
  { value: 'ISHIDA_MOKUZAI', label: '石田木材' },
  { value: 'BENCHU', label: '紅中' },
  { value: 'MINOHIRO', label: '美濃弘商店' },
  
  // サブ会社組み合わせ（29社）
  // ジャパン建材系（3社）
  { value: 'JAPAN_KENZAI_AIDA', label: 'ジャパン建材_アイダ設計' },
  { value: 'JAPAN_KENZAI_APPLEHOME', label: 'ジャパン建材_アップルホーム' },
  { value: 'JAPAN_KENZAI_ECOHOUSE', label: 'ジャパン建材_エコハウス' },
  
  // ジューテック系（4社）
  { value: 'JUTEC_KEFI', label: 'ジューテック_KEFI WORKS' },
  { value: 'JUTEC_FSTAGE', label: 'ジューテック_エフステージ' },
  { value: 'JUTEC_CAREN', label: 'ジューテック_カレンエステート' },
  { value: 'JUTEC_RENOVESIA', label: 'ジューテック_リノベシア' },
  
  // 加藤ベニヤ朝霧系（5社）
  { value: 'KATOUBENIYA_ASAGIRI_AIDA', label: '加藤ベニヤ朝霧_アイダ設計' },
  { value: 'KATOUBENIYA_ASAGIRI_ACURA', label: '加藤ベニヤ朝霧_アキュラホーム' },
  { value: 'KATOUBENIYA_ASAGIRI_TAMURA', label: '加藤ベニヤ朝霧_タムラ建設' },
  { value: 'KATOUBENIYA_ASAGIRI_DAIWA', label: '加藤ベニヤ朝霧_大和ハウス' },
  { value: 'KATOUBENIYA_ASAGIRI_ASAHI', label: '加藤ベニヤ朝霧_旭ハウジング' },
  
  // 加藤ベニヤ池袋系（1社）
  { value: 'KATOUBENIYA_IKEBUKURO_HAWKONE', label: '加藤ベニヤ池袋_ホークワン' },
  
  // 大成木材系（1社）
  { value: 'TAISEI_MOKUZAI_SEKISUI', label: '大成木材_積水ハウス' },
  
  // 渡辺ベニヤ城南島系（2社）
  { value: 'WATANABE_JONANSHIMA_TOYOTA', label: '渡辺ベニヤ城南島_トヨタホーム' },
  { value: 'WATANABE_JONANSHIMA_SUMIRIN', label: '渡辺ベニヤ城南島_住友林業' },
  
  // 野原G住環境系（10社）
  { value: 'NOHARA_G_TAMAC', label: '野原G住環境_タマック' },
  { value: 'NOHARA_G_MISAWA', label: '野原G住環境_ミサワホーム' },
  { value: 'NOHARA_G_MELDIA', label: '野原G住環境_メルディア' },
  { value: 'NOHARA_G_YAMATO', label: '野原G住環境_ヤマト住建' },
  { value: 'NOHARA_G_ISHO', label: '野原G住環境_井笑ホーム' },
  { value: 'NOHARA_G_UCHIUMI', label: '野原G住環境_内海工務店' },
  { value: 'NOHARA_G_SAKAE', label: '野原G住環境_栄工務店' },
  { value: 'NOHARA_G_YOSHINO', label: '野原G住環境_株式会社ヨシノ' },
  { value: 'NOHARA_G_BUSHU', label: '野原G住環境_武州建設' },
  { value: 'NOHARA_G_MORO', label: '野原G住環境_茂呂建設' },
];

// ユーザーが選択できないオプションも含む全リスト (内部処理用)
export const ALL_COMPANY_OPTIONS: readonly CompanyOption[] = [
  ...COMPANY_OPTIONS,
  { value: 'UNKNOWN_OR_NOT_SET', label: '会社を特定できませんでした' },
];
