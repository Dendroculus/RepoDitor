import type { TranslationShape } from "@/app/i18n/types";
import { shellEn } from "@/app/i18n/locales/en/shell";

export const shellJa: TranslationShape<typeof shellEn> = {
  skip: "コンテンツへ移動",
  home: "RepoDitor Web ホーム",
  application: "アプリケーション",
  switchTheme: "{theme}テーマに切り替え",
  dark: "ダーク",
  light: "ライト",
  language: "言語",
  languageCurrent: "言語：{language}",
  policies: "ポリシー",
  closePolicy: "{title}を閉じる",
  footerPrivacy: "セーブ内容は端末内に留まり、保存されません。",
};
