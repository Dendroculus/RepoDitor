import { createContext, useContext } from "react";

import type { Translate } from "@/app/i18n/catalog";
import type { Locale } from "@/app/i18n/types";

export interface I18nValue {
  readonly formatNumber: (value: number) => string;
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly t: Translate;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider.");
  return context;
}
