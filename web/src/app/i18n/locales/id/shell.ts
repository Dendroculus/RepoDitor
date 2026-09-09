import type { TranslationShape } from "@/app/i18n/types";
import { shellEn } from "@/app/i18n/locales/en/shell";

export const shellId: TranslationShape<typeof shellEn> = {
  skip: "Lewati ke konten",
  home: "Beranda RepoDitor Web",
  application: "Aplikasi",
  switchTheme: "Ganti ke tema {theme}",
  dark: "Gelap",
  light: "Terang",
  language: "Bahasa",
  languageCurrent: "Bahasa: {language}",
  policies: "Kebijakan",
  closePolicy: "Tutup {title}",
  footerPrivacy: "Isi save tetap lokal dan tidak disimpan.",
};
