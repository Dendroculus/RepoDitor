import { cosmeticsJa } from "@/app/i18n/locales/ja/cosmetics";
import { policiesJa } from "@/app/i18n/locales/ja/policies";
import { rechargeJa } from "@/app/i18n/locales/ja/recharge";
import { runJa } from "@/app/i18n/locales/ja/run";
import { saveJa } from "@/app/i18n/locales/ja/save";
import { shellJa } from "@/app/i18n/locales/ja/shell";
import type { Messages } from "@/app/i18n/locales/en";

export const jaMessages = {
  app: shellJa,
  cosmetics: cosmeticsJa,
  policies: policiesJa,
  recharge: rechargeJa,
  run: runJa,
  save: saveJa,
} satisfies Messages;
