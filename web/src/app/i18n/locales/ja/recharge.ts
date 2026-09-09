import type { TranslationShape } from "@/app/i18n/types";
import { rechargeEn } from "@/app/i18n/locales/en/recharge";

export const rechargeJa: TranslationShape<typeof rechargeEn> = {
  unavailable: "充電を利用できません",
  unavailableMessage: "この Run セーブでは充電編集を利用できません。",
  invalidInt32: "保存された充電データが有効な符号付き Int32 整数ではありません。",
  eyebrow: "トラックのインベントリ",
  title: "充電",
  supported: { one: "対応充電アイテム {count} 個", other: "対応充電アイテム {count} 個" },
  empty: "この Run セーブに対応充電アイテムはありません。",
  complete: "対応アイテムはすべて満充電です。",
  needed: {
    one: "{count} 個のアイテムに充電が必要です",
    other: "{count} 個のアイテムに充電が必要です",
  },
  preservation: "不明または未対応のアイテムは変更されません。",
  action: "対応アイテムをすべて充電",
};
