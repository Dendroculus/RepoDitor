import type { TranslationShape } from "@/app/i18n/types";
import { cosmeticsEn } from "@/app/i18n/locales/en/cosmetics";

export const cosmeticsJa: TranslationShape<typeof cosmeticsEn> = {
  unavailable: "コスメティックを利用できません",
  unavailableMessage: "この MetaSave ではコスメティックを編集できません。",
  eyebrow: "アカウントセーブ",
  title: "コスメティック",
  unlocked: "対応コスメティック {total} 個中 {owned} 個を解放済み",
  complete: "対応コスメティックはすべて解放済みです。",
  remaining: {
    one: "対応コスメティックが {count} 個ロックされています。",
    other: "対応コスメティックが {count} 個ロックされています。",
  },
  presets: "プリセットは変更されません。",
  action: "残りのコスメティックを解放",
  pendingField: "対応コスメティック",
  pendingValue: "{count} 個解放済み",
};
