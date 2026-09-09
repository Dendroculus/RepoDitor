import type { TranslationShape } from "@/app/i18n/types";
import { rechargeEn } from "@/app/i18n/locales/en/recharge";

export const rechargeZhCn: TranslationShape<typeof rechargeEn> = {
  unavailable: "充能不可用",
  unavailableMessage: "此 Run 存档无法使用充能编辑。",
  invalidInt32: "存储的充能数据不是有效的有符号 Int32 整数。",
  eyebrow: "卡车物品栏",
  title: "充能",
  supported: { one: "{count} 件受支持的可充能物品", other: "{count} 件受支持的可充能物品" },
  empty: "此 Run 存档中没有找到受支持的可充能物品。",
  complete: "所有受支持物品均已充满。",
  needed: { one: "{count} 件物品需要充能", other: "{count} 件物品需要充能" },
  preservation: "未知和不受支持的物品类型不会被更改。",
  action: "为所有受支持物品充能",
};
