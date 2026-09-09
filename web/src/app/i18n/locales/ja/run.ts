import type { TranslationShape } from "@/app/i18n/types";
import { runEn } from "@/app/i18n/locales/en/run";

export const runJa: TranslationShape<typeof runEn> = {
  editor: "Run セーブエディター",
  sections: "Run エディターのセクション",
  unavailable: "Run エディターを利用できません",
  unavailableMessage: "この Run セーブは安全に編集できません。",
  editError: "この変更を安全に保留できませんでした。",
  tabs: { players: "プレイヤー", upgrades: "アップグレード", run: "Run", recharge: "充電" },
  players: {
    title: "プレイヤー",
    list: "プレイヤー",
    selected: "選択中のプレイヤー",
    steamAvatar: "{name} の Steam アバター",
    avatarFallback: "{name} の代替アバター",
    currentHealth: "現在の体力",
    editNotice: "変更はメモリ上に保留されます。元のファイルは変更されません。",
    healthError: "現在の体力は 0 から {maximum} までの整数にしてください。",
    heal: "全回復",
    healthSeparate: "体力と体力アップグレードは別の値です。",
    empty: "この Run セーブにプレイヤーが見つかりません。",
    player: "プレイヤー",
  },
  upgrades: {
    eyebrow: "プレイヤー別の値",
    title: "アップグレード",
    error: "アップグレード値は 0 から {maximum} までの整数にしてください。",
    empty: "対応するプレイヤーアップグレード辞書が見つかりません。",
  },
  run: {
    eyebrow: "現在の遠征",
    title: "Run",
    intro: "以下の値はメモリ上で調整されます。元のファイルは上書きされません。",
    level: "Run レベル",
    levelError: "Run レベルは 1 から {maximum} までの整数にしてください。",
    currency: "通貨",
    currencyError: "通貨は {minimum} から {maximum} までの整数にしてください。",
    nextSpawn: "次のスポーン",
    unsupportedSpawn: "未対応の保存値（{value}）",
  },
  pending: {
    supportedItems: "対応アイテム",
    allCharged: "対応アイテムはすべて満充電",
    recharged: { one: "{count} 個を充電", other: "{count} 個を充電" },
  },
};
