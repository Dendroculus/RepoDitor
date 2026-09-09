import type { TranslationShape } from "@/app/i18n/types";
import { shellEn } from "@/app/i18n/locales/en/shell";

export const shellZhCn: TranslationShape<typeof shellEn> = {
  skip: "跳到内容",
  home: "RepoDitor Web 主页",
  application: "应用",
  switchTheme: "切换到{theme}主题",
  dark: "深色",
  light: "浅色",
  language: "语言",
  languageCurrent: "语言：{language}",
  policies: "政策",
  closePolicy: "关闭{title}",
  footerPrivacy: "存档内容仅保留在设备上，不会被持久化。",
};
