import { cosmeticsId } from "@/app/i18n/locales/id/cosmetics";
import { policiesId } from "@/app/i18n/locales/id/policies";
import { rechargeId } from "@/app/i18n/locales/id/recharge";
import { runId } from "@/app/i18n/locales/id/run";
import { saveId } from "@/app/i18n/locales/id/save";
import { shellId } from "@/app/i18n/locales/id/shell";
import type { Messages } from "@/app/i18n/locales/en";

export const idMessages = {
  app: shellId,
  cosmetics: cosmeticsId,
  policies: policiesId,
  recharge: rechargeId,
  run: runId,
  save: saveId,
} satisfies Messages;
