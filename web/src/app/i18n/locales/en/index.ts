import { cosmeticsEn } from "@/app/i18n/locales/en/cosmetics";
import { policiesEn } from "@/app/i18n/locales/en/policies";
import { rechargeEn } from "@/app/i18n/locales/en/recharge";
import { runEn } from "@/app/i18n/locales/en/run";
import { saveEn } from "@/app/i18n/locales/en/save";
import { shellEn } from "@/app/i18n/locales/en/shell";
import type { TranslationShape } from "@/app/i18n/types";

export const enMessages = {
  app: shellEn,
  cosmetics: cosmeticsEn,
  policies: policiesEn,
  recharge: rechargeEn,
  run: runEn,
  save: saveEn,
} as const;

export type Messages = TranslationShape<typeof enMessages>;
