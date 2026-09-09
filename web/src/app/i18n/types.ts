export const LOCALES = ["en", "id", "ja", "ko", "zh-CN"] as const;

export type Locale = (typeof LOCALES)[number];

export interface PluralMessage {
  readonly one: string;
  readonly other: string;
}

export type TranslationShape<T> = T extends string
  ? string
  : T extends PluralMessage
    ? PluralMessage
    : { readonly [K in keyof T]: TranslationShape<T[K]> };

export type MessageKey<T> = {
  [K in keyof T & string]: T[K] extends string | PluralMessage ? K : `${K}.${MessageKey<T[K]>}`;
}[keyof T & string];

export type MessageValues = Readonly<Record<string, number | string>>;
