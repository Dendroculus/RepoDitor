import type { TranslationShape } from "@/app/i18n/types";
import { cosmeticsEn } from "@/app/i18n/locales/en/cosmetics";

export const cosmeticsId: TranslationShape<typeof cosmeticsEn> = {
  unavailable: "Cosmetics tidak tersedia",
  unavailableMessage: "Pengeditan cosmetics tidak tersedia untuk MetaSave ini.",
  eyebrow: "Save akun",
  title: "Cosmetics",
  unlocked: "{owned} dari {total} cosmetics yang didukung telah terbuka",
  complete: "Semua cosmetics yang didukung sudah terbuka.",
  remaining: {
    one: "{count} cosmetic yang didukung masih terkunci.",
    other: "{count} cosmetics yang didukung masih terkunci.",
  },
  presets: "Preset tidak diubah.",
  action: "Buka Cosmetics Tersisa",
  pendingField: "Cosmetics yang didukung",
  pendingValue: "{count} terbuka",
};
