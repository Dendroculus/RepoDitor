import { cosmeticsKo } from "@/app/i18n/locales/ko/cosmetics";
import { policiesKo } from "@/app/i18n/locales/ko/policies";
import { rechargeKo } from "@/app/i18n/locales/ko/recharge";
import { runKo } from "@/app/i18n/locales/ko/run";
import { saveKo } from "@/app/i18n/locales/ko/save";
import { shellKo } from "@/app/i18n/locales/ko/shell";
import type { Messages } from "@/app/i18n/locales/en";

export const koMessages = {
  app: shellKo,
  cosmetics: cosmeticsKo,
  policies: policiesKo,
  recharge: rechargeKo,
  run: runKo,
  save: saveKo,
} satisfies Messages;
