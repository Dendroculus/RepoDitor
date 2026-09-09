import type { TranslationShape } from "@/app/i18n/types";
import { runEn } from "@/app/i18n/locales/en/run";

export const runZhCn: TranslationShape<typeof runEn> = {
  editor: "Run 存档编辑器",
  sections: "Run 编辑器分区",
  unavailable: "Run 编辑器不可用",
  unavailableMessage: "无法安全编辑此 Run 存档。",
  editError: "无法安全暂存此编辑。",
  tabs: { players: "玩家", upgrades: "升级", run: "Run", recharge: "充能" },
  players: {
    title: "玩家",
    list: "玩家",
    selected: "已选玩家",
    steamAvatar: "{name} 的 Steam 头像",
    avatarFallback: "{name} 的备用头像",
    currentHealth: "当前生命值",
    editNotice: "这会在内存中创建待处理更改，不会更改您的源文件。",
    healthError: "当前生命值必须是 0 到 {maximum} 之间的整数。",
    heal: "恢复至满",
    healthSeparate: "生命值和生命值升级是不同的数值。",
    empty: "此 Run 存档中没有找到玩家。",
    player: "玩家",
  },
  upgrades: {
    eyebrow: "每位玩家的数值",
    title: "升级",
    error: "升级值必须是 0 到 {maximum} 之间的整数。",
    empty: "此存档中没有找到受支持的玩家升级字典。",
  },
  run: {
    eyebrow: "当前远征",
    title: "Run",
    intro: "在内存中调整以下数值。您的源文件绝不会被覆盖。",
    level: "Run 等级",
    levelError: "Run 等级必须是 1 到 {maximum} 之间的整数。",
    currency: "货币",
    currencyError: "货币必须是 {minimum} 到 {maximum} 之间的整数。",
    nextSpawn: "下次出生点",
    unsupportedSpawn: "不受支持的存档值（{value}）",
  },
  pending: {
    supportedItems: "受支持的物品",
    allCharged: "所有受支持物品均已充满",
    recharged: { one: "已为 {count} 件物品充能", other: "已为 {count} 件物品充能" },
  },
};
