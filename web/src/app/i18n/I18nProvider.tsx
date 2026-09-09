import { useEffect, useMemo, useState, type ReactNode } from "react";

import { isLocale, LOCALE_KEY, resolveLocalizedMessage } from "@/app/i18n/catalog";
import { I18nContext, type I18nValue } from "@/app/i18n/context";
import type { Locale } from "@/app/i18n/types";

function initialLocale(): Locale {
  const prepaintLocale = document.documentElement.dataset.locale;
  if (isLocale(prepaintLocale)) return prepaintLocale;
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Storage may be unavailable; English remains the deterministic fallback.
  }
  return "en";
}

export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  function selectLocale(next: Locale): void {
    document.documentElement.lang = next;
    document.documentElement.dataset.locale = next;
    try {
      window.localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // The choice still applies for this page when storage is unavailable.
    }
    setLocale(next);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    document.title = resolveLocalizedMessage(locale, "save.landing.documentTitle");
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", resolveLocalizedMessage(locale, "save.landing.metaDescription"));
  }, [locale]);

  const value = useMemo<I18nValue>(() => {
    const numberFormat = new Intl.NumberFormat(locale);
    return {
      formatNumber: (number) => numberFormat.format(number),
      locale,
      setLocale: selectLocale,
      t: (key, values, count) => resolveLocalizedMessage(locale, key, values, count),
    };
  }, [locale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}
