import type { TranslationShape } from "@/app/i18n/types";
import { runEn } from "@/app/i18n/locales/en/run";

export const runId: TranslationShape<typeof runEn> = {
  editor: "Editor save Run",
  sections: "Bagian editor Run",
  unavailable: "Editor Run tidak tersedia",
  unavailableMessage: "Save Run ini tidak dapat diedit dengan aman.",
  editError: "Edit ini tidak dapat disiapkan dengan aman.",
  tabs: { players: "Pemain", upgrades: "Upgrade", run: "Run", recharge: "Isi daya" },
  players: {
    title: "Pemain",
    list: "Pemain",
    selected: "Pemain terpilih",
    steamAvatar: "Avatar Steam untuk {name}",
    avatarFallback: "Avatar cadangan untuk {name}",
    currentHealth: "Health saat ini",
    editNotice: "Ini membuat perubahan tertunda di memori. File sumber Anda tidak berubah.",
    healthError: "Health saat ini harus bilangan bulat antara 0 dan {maximum}.",
    heal: "Pulihkan Penuh",
    healthSeparate: "Health dan upgrade Health adalah nilai yang terpisah.",
    empty: "Tidak ada pemain dalam save Run ini.",
    player: "Pemain",
  },
  upgrades: {
    eyebrow: "Nilai per pemain",
    title: "Upgrade",
    error: "Nilai upgrade harus bilangan bulat antara 0 dan {maximum}.",
    empty: "Tidak ada dictionary upgrade pemain yang didukung dalam save ini.",
  },
  run: {
    eyebrow: "Ekspedisi saat ini",
    title: "Run",
    intro: "Sesuaikan nilai berikut di memori. File sumber Anda tidak pernah ditimpa.",
    level: "Level Run",
    levelError: "Level Run harus bilangan bulat antara 1 dan {maximum}.",
    currency: "Currency",
    currencyError: "Currency harus bilangan bulat antara {minimum} dan {maximum}.",
    nextSpawn: "Spawn berikutnya",
    unsupportedSpawn: "Nilai save tidak didukung ({value})",
  },
  pending: {
    supportedItems: "Item yang didukung",
    allCharged: "Semua item yang didukung terisi penuh",
    recharged: { one: "{count} item diisi ulang", other: "{count} item diisi ulang" },
  },
};
