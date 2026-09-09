import type { TranslationShape } from "@/app/i18n/types";
import { shellEn } from "@/app/i18n/locales/en/shell";

export const shellKo: TranslationShape<typeof shellEn> = {
  skip: "콘텐츠로 건너뛰기",
  home: "RepoDitor Web 홈",
  application: "애플리케이션",
  switchTheme: "{theme} 테마로 전환",
  dark: "다크",
  light: "라이트",
  language: "언어",
  languageCurrent: "언어: {language}",
  policies: "정책",
  closePolicy: "{title} 닫기",
  footerPrivacy: "세이브 내용은 기기에만 있으며 저장되지 않습니다.",
};
