import { enMessages, type Messages } from "@/app/i18n/locales/en";
import { localeEn } from "@/app/i18n/locales/en/metadata";
import { idMessages } from "@/app/i18n/locales/id";
import { localeId } from "@/app/i18n/locales/id/metadata";
import { jaMessages } from "@/app/i18n/locales/ja";
import { localeJa } from "@/app/i18n/locales/ja/metadata";
import { koMessages } from "@/app/i18n/locales/ko";
import { localeKo } from "@/app/i18n/locales/ko/metadata";
import { zhCnMessages } from "@/app/i18n/locales/zh-CN";
import { localeZhCn } from "@/app/i18n/locales/zh-CN/metadata";
import {
  LOCALES,
  type Locale,
  type MessageKey,
  type MessageValues,
  type PluralMessage,
} from "@/app/i18n/types";

export const LOCALE_KEY = "repoditor-locale";

export type TranslationKey = MessageKey<typeof enMessages>;
export type Translate = (key: TranslationKey, values?: MessageValues, count?: number) => string;

const catalogs: Readonly<Record<Locale, Messages>> = {
  en: enMessages,
  id: idMessages,
  ja: jaMessages,
  ko: koMessages,
  "zh-CN": zhCnMessages,
};

export const LANGUAGE_NAMES: Readonly<Record<Locale, string>> = {
  en: localeEn.name,
  id: localeId.name,
  ja: localeJa.name,
  ko: localeKo.name,
  "zh-CN": localeZhCn.name,
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.some((locale) => locale === value);
}

function valueAt(catalog: unknown, key: TranslationKey): unknown {
  let current = catalog;
  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object" || !Object.hasOwn(current, segment)) return null;
    current = Reflect.get(current, segment);
  }
  return current;
}

function isPluralMessage(value: unknown): value is PluralMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof Reflect.get(value, "one") === "string" &&
    typeof Reflect.get(value, "other") === "string"
  );
}

function isUsableMessage(value: unknown): boolean {
  if (typeof value === "string") return value.trim() !== "";
  return isPluralMessage(value) && value.one.trim() !== "" && value.other.trim() !== "";
}

function interpolate(message: string, values: MessageValues): string {
  return message.replaceAll(/\{([A-Za-z][A-Za-z0-9]*)\}/gu, (token, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : token,
  );
}

export function resolveLocalizedMessage(
  locale: Locale,
  key: TranslationKey,
  values: MessageValues = {},
  count?: number,
  requestedCatalog: unknown = catalogs[locale],
): string {
  const requested = valueAt(requestedCatalog, key);
  const selected = isUsableMessage(requested) ? requested : valueAt(enMessages, key);
  let message = key as string;
  if (isPluralMessage(selected)) {
    const form = new Intl.PluralRules(locale).select(count ?? 0) === "one" ? "one" : "other";
    message = selected[form];
  } else if (typeof selected === "string") {
    message = selected;
  }
  return interpolate(message, values);
}
