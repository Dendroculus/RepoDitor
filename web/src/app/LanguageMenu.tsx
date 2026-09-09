import { CaretDownIcon, CheckIcon, TranslateIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const option = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (open) option.current?.focus();
  }, [open]);

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

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={container}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Language: English"
        className={`inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          open
            ? "bg-surface-raised text-accent"
            : "text-secondary hover:bg-surface-raised hover:text-accent"
        }`}
        onClick={() => setOpen((current) => !current)}
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
        <span>English</span>
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
            aria-label="Language"
            className="absolute right-0 z-30 mt-1.5 min-w-full overflow-hidden rounded-sm border border-control bg-surface-raised p-1 shadow-panel"
            id={listboxId}
            role="listbox"
          >
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <button
              aria-label="English"
              aria-selected="true"
              className="grid w-full grid-cols-[1rem_minmax(0,1fr)] items-center gap-2 rounded-lg bg-accent-muted px-2.5 py-2 text-left text-sm font-semibold text-accent transition-colors hover:bg-surface hover:text-ink"
              onClick={() => closeMenu(true)}
              onKeyDown={handleOptionKeyDown}
              ref={option}
              role="option"
              type="button"
            >
              <CheckIcon aria-hidden="true" size={14} weight="bold" />
              <span>English</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
