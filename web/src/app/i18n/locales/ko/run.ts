import type { TranslationShape } from "@/app/i18n/types";
import { runEn } from "@/app/i18n/locales/en/run";

export const runKo: TranslationShape<typeof runEn> = {
  editor: "Run 세이브 편집기",
  sections: "Run 편집기 섹션",
  unavailable: "Run 편집기를 사용할 수 없음",
  unavailableMessage: "이 Run 세이브는 안전하게 편집할 수 없습니다.",
  editError: "이 변경 사항을 안전하게 준비하지 못했습니다.",
  tabs: { players: "플레이어", upgrades: "업그레이드", run: "Run", recharge: "충전" },
  players: {
    title: "플레이어",
    list: "플레이어",
    selected: "선택한 플레이어",
    steamAvatar: "{name}의 Steam 아바타",
    avatarFallback: "{name}의 대체 아바타",
    currentHealth: "현재 체력",
    editNotice: "메모리에 대기 중인 변경을 만듭니다. 원본 파일은 변경되지 않습니다.",
    healthError: "현재 체력은 0에서 {maximum} 사이의 정수여야 합니다.",
    heal: "완전히 회복",
    healthSeparate: "체력과 체력 업그레이드는 별도의 값입니다.",
    empty: "이 Run 세이브에서 플레이어를 찾지 못했습니다.",
    player: "플레이어",
  },
  upgrades: {
    eyebrow: "플레이어별 값",
    title: "업그레이드",
    error: "업그레이드 값은 0에서 {maximum} 사이의 정수여야 합니다.",
    empty: "지원되는 플레이어 업그레이드 딕셔너리가 없습니다.",
  },
  run: {
    eyebrow: "현재 원정",
    title: "Run",
    intro: "아래 값은 메모리에서 조정됩니다. 원본 파일은 덮어쓰지 않습니다.",
    level: "Run 레벨",
    levelError: "Run 레벨은 1에서 {maximum} 사이의 정수여야 합니다.",
    currency: "재화",
    currencyError: "재화는 {minimum}에서 {maximum} 사이의 정수여야 합니다.",
    nextSpawn: "다음 스폰",
    unsupportedSpawn: "지원되지 않는 저장 값({value})",
  },
  pending: {
    supportedItems: "지원 아이템",
    allCharged: "모든 지원 아이템이 완전히 충전됨",
    recharged: { one: "아이템 {count}개 충전", other: "아이템 {count}개 충전" },
  },
};
