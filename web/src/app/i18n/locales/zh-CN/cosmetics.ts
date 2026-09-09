import type { TranslationShape } from "@/app/i18n/types";
import { cosmeticsEn } from "@/app/i18n/locales/en/cosmetics";

export const cosmeticsZhCn: TranslationShape<typeof cosmeticsEn> = {
  unavailable: "装扮不可用",
  unavailableMessage: "此 MetaSave 无法使用装扮编辑。",
  eyebrow: "账户存档",
  title: "装扮",
  unlocked: "已解锁 {owned}/{total} 个受支持装扮",
  complete: "所有受支持的装扮都已解锁。",
  remaining: {
    one: "仍有 {count} 个受支持装扮未解锁。",
    other: "仍有 {count} 个受支持装扮未解锁。",
  },
  presets: "不会修改预设。",
  action: "解锁剩余装扮",
  pendingField: "受支持的装扮",
  pendingValue: "已解锁 {count} 个",
};
