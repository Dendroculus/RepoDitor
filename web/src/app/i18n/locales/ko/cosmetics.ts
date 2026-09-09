import type { TranslationShape } from "@/app/i18n/types";
import { cosmeticsEn } from "@/app/i18n/locales/en/cosmetics";

export const cosmeticsKo: TranslationShape<typeof cosmeticsEn> = {
  unavailable: "코스메틱을 사용할 수 없음",
  unavailableMessage: "이 MetaSave에서는 코스메틱 편집을 사용할 수 없습니다.",
  eyebrow: "계정 세이브",
  title: "코스메틱",
  unlocked: "지원 코스메틱 {total}개 중 {owned}개 잠금 해제",
  complete: "지원되는 모든 코스메틱이 이미 잠금 해제되었습니다.",
  remaining: {
    one: "지원 코스메틱 {count}개가 잠겨 있습니다.",
    other: "지원 코스메틱 {count}개가 잠겨 있습니다.",
  },
  presets: "프리셋은 변경되지 않습니다.",
  action: "남은 코스메틱 잠금 해제",
  pendingField: "지원 코스메틱",
  pendingValue: "{count}개 잠금 해제",
};
