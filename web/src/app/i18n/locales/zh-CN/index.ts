import { cosmeticsZhCn } from "@/app/i18n/locales/zh-CN/cosmetics";
import { policiesZhCn } from "@/app/i18n/locales/zh-CN/policies";
import { rechargeZhCn } from "@/app/i18n/locales/zh-CN/recharge";
import { runZhCn } from "@/app/i18n/locales/zh-CN/run";
import { saveZhCn } from "@/app/i18n/locales/zh-CN/save";
import { shellZhCn } from "@/app/i18n/locales/zh-CN/shell";
import type { Messages } from "@/app/i18n/locales/en";

export const zhCnMessages = {
  app: shellZhCn,
  cosmetics: cosmeticsZhCn,
  policies: policiesZhCn,
  recharge: rechargeZhCn,
  run: runZhCn,
  save: saveZhCn,
} satisfies Messages;
