import { CaretDownIcon, CheckIcon, TranslateIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { LANGUAGE_NAMES } from "@/app/i18n/catalog";
import { useI18n } from "@/app/i18n/context";
import { LOCALES, type Locale } from "@/app/i18n/types";

export function LanguageMenu() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef(new Map<Locale, HTMLButtonElement>());
  const listboxId = useId();

  useEffect(() => {
    if (open) options.current.get(locale)?.focus();
  }, [locale, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  function closeMenu(returnFocus: boolean): void {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  function selectLocale(next: Locale): void {
    setLocale(next);
    closeMenu(true);
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectLocale(LOCALES[index]!);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      let next = event.key === "Home" ? 0 : LOCALES.length - 1;
      if (event.key === "ArrowDown") next = (index + 1) % LOCALES.length;
      if (event.key === "ArrowUp") next = (index - 1 + LOCALES.length) % LOCALES.length;
      options.current.get(LOCALES[next]!)?.focus();
    }
  }

  return (
    <div className="relative" ref={container}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("app.languageCurrent", { language: LANGUAGE_NAMES[locale] })}
        className={`inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          open
            ? "bg-surface-raised text-accent"
            : "text-secondary hover:bg-surface-raised hover:text-accent"
        }`}
        onClick={() => setOpen((current) => !current)}
        data-testid="language-menu-trigger"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            closeMenu(true);
          }
        }}
        ref={trigger}
        type="button"
      >
        <TranslateIcon aria-hidden="true" size={17} />
        <span>{LANGUAGE_NAMES[locale]}</span>
        <CaretDownIcon
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          size={14}
          weight="bold"
        />
      </button>

      {open ? (
        <>
          {/* A native select popup cannot use RepoDitor's themed full-row interaction state. */}
          {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
          <div
            aria-label={t("app.language")}
            className="absolute right-0 z-30 mt-1.5 w-max min-w-44 max-w-[calc(100vw-2rem)] overflow-hidden rounded-sm border border-control bg-surface-raised p-1 shadow-panel"
            id={listboxId}
            role="listbox"
          >
            {LOCALES.map((entry, index) => (
              /* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */
              <button
                aria-label={LANGUAGE_NAMES[entry]}
                aria-selected={locale === entry}
                className={`grid w-full grid-cols-[1rem_minmax(0,1fr)] items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-surface hover:text-ink ${
                  locale === entry ? "bg-accent-muted text-accent" : "text-secondary"
                }`}
                key={entry}
                onClick={() => selectLocale(entry)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                ref={(node) => {
                  if (node) options.current.set(entry, node);
                  else options.current.delete(entry);
                }}
                role="option"
                type="button"
              >
                {locale === entry ? (
                  <CheckIcon aria-hidden="true" size={14} weight="bold" />
                ) : (
                  <span />
                )}
                <span>{LANGUAGE_NAMES[entry]}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
