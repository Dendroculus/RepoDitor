import type { TranslationShape } from "@/app/i18n/types";
import { rechargeEn } from "@/app/i18n/locales/en/recharge";

export const rechargeKo: TranslationShape<typeof rechargeEn> = {
  unavailable: "충전을 사용할 수 없음",
  unavailableMessage: "이 Run 세이브에서는 충전 편집을 사용할 수 없습니다.",
  invalidInt32: "저장된 충전 데이터가 유효한 부호 있는 Int32 정수가 아닙니다.",
  eyebrow: "트럭 인벤토리",
  title: "충전",
  supported: { one: "지원 충전 아이템 {count}개", other: "지원 충전 아이템 {count}개" },
  empty: "이 Run 세이브에서 지원되는 충전 아이템을 찾지 못했습니다.",
  complete: "지원되는 모든 아이템이 완전히 충전되었습니다.",
  needed: {
    one: "아이템 {count}개를 충전해야 합니다",
    other: "아이템 {count}개를 충전해야 합니다",
  },
  preservation: "알 수 없거나 지원되지 않는 아이템 유형은 변경되지 않습니다.",
  action: "지원 아이템 모두 충전",
};
