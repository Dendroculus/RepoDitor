import type { TranslationShape } from "@/app/i18n/types";
import { rechargeEn } from "@/app/i18n/locales/en/recharge";

export const rechargeId: TranslationShape<typeof rechargeEn> = {
  unavailable: "Isi daya tidak tersedia",
  unavailableMessage: "Pengeditan isi daya tidak tersedia untuk save Run ini.",
  invalidInt32: "Data daya tersimpan bukan bilangan bulat Int32 bertanda yang valid.",
  eyebrow: "Inventaris truk",
  title: "Isi daya",
  supported: {
    one: "{count} item isi ulang yang didukung",
    other: "{count} item isi ulang yang didukung",
  },
  empty: "Tidak ada item isi ulang yang didukung dalam save Run ini.",
  complete: "Semua item yang didukung terisi penuh.",
  needed: { one: "{count} item perlu diisi ulang", other: "{count} item perlu diisi ulang" },
  preservation: "Jenis item tidak dikenal dan tidak didukung tetap tidak berubah.",
  action: "Isi Ulang Semua Item yang Didukung",
};
