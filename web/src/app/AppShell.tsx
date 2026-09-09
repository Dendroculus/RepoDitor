import {
  GithubLogoIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  TranslateIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const GITHUB_URL = "https://github.com/Yoruxyv/RepoDitor";
const THEME_KEY = "repoditor-theme";

type Theme = "dark" | "light";
type Policy = "privacy" | "security" | "terms";

const POLICIES: Readonly<Record<Policy, { readonly content: ReactNode; readonly title: string }>> =
  {
    privacy: {
      title: "Data & Privacy",
      content: (
        <>
          <p>Save contents are processed locally and are not persisted by RepoDitor Web.</p>
          <p>
            Save files and decrypted JSON are not uploaded. Optional Steam avatar enrichment sends
            only validated Steam IDs to the RepoDitor same-origin endpoint. Your theme preference is
            stored locally; save data never shares that storage.
          </p>
        </>
      ),
    },
    security: {
      title: "Security",
      content: (
        <>
          <p>
            RepoDitor validates supported save structures, stages changes in memory, and verifies
            each encrypted export before download.
          </p>
          <p>
            Report vulnerabilities privately through the repository security{" "}
            <a
              className="font-semibold text-accent underline underline-offset-4"
              href={`${GITHUB_URL}/security/advisories/new`}
              rel="noreferrer"
              target="_blank"
            >
              security advisory form
            </a>
            . Do not include real save files or decrypted data in public reports.
          </p>
        </>
      ),
    },
    terms: {
      title: "Terms",
      content: (
        <>
          <p>RepoDitor is an independent community tool and is not affiliated with semiwork.</p>
          <p>
            Use copies of your saves and review staged changes before export. You remain responsible
            for backups and for how you use downloaded files.
          </p>
        </>
      ),
    },
  };

function policyFromHash(): Policy | null {
  const hash = window.location.hash.slice(1);
  return hash === "privacy" || hash === "security" || hash === "terms" ? hash : null;
}

function initialTheme(): Theme {
  const rootTheme = document.documentElement.dataset.theme;
  if (rootTheme === "dark" || rootTheme === "light") {
    return rootTheme;
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeReady = "true";
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#f3f2ed" : "#0d1110");
}

export function AppHeader() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function toggleTheme(): void {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // The explicit preference still applies for this page when storage is unavailable.
    }
    setTheme(next);
  }

  return (
    <header className="border-b border-line bg-app">
      <div className="mx-auto flex min-h-16 w-full max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-8">
        <a
          className="mr-auto inline-flex items-center gap-3 text-ink"
          href="/"
          aria-label="RepoDitor Web home"
        >
          <img alt="" aria-hidden="true" className="size-8 rounded-sm" src="/icon.png" />
          <span className="font-display text-3xl font-semibold uppercase leading-none tracking-tight">
            RepoDitor <span className="text-accent">Web</span>
          </span>
        </a>

        <nav aria-label="Application" className="flex flex-wrap items-center justify-end gap-2">
          <a
            className="inline-flex items-center gap-2 rounded-sm px-2.5 py-2 text-sm font-semibold text-secondary transition-colors hover:text-accent"
            href={GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            <GithubLogoIcon aria-hidden="true" size={18} weight="bold" />
            GitHub
          </a>
          <button
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="inline-flex items-center gap-2 rounded-sm border border-control px-3 py-2 text-sm font-semibold text-secondary transition-colors hover:border-accent hover:text-accent"
            onClick={toggleTheme}
            type="button"
          >
            <span aria-hidden="true" className="relative size-[17px]">
              <MoonIcon
                className={`absolute inset-0 transition-[opacity,transform] ${
                  theme === "dark" ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
                }`}
                size={17}
              />
              <SunIcon
                className={`absolute inset-0 transition-[opacity,transform] ${
                  theme === "light" ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
                }`}
                size={17}
              />
            </span>
            {theme === "dark" ? "Dark" : "Light"}
          </button>
          <label className="inline-flex items-center gap-2 rounded-sm border border-control px-3 py-2 text-sm font-semibold text-secondary">
            <TranslateIcon aria-hidden="true" size={17} />
            <span className="sr-only">Language</span>
            <select aria-label="Language" className="bg-transparent text-ink" defaultValue="en">
              <option value="en">🇺🇸 English</option>
            </select>
          </label>
        </nav>
      </div>
    </header>
  );
}

interface PolicyDialogProps {
  readonly policy: Policy | null;
  readonly setPolicy: Dispatch<SetStateAction<Policy | null>>;
}

function PolicyDialog({ policy, setPolicy }: PolicyDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (policy) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      closeRef.current?.focus();
    } else if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
      previousFocus.current?.focus();
    }
  }, [policy]);

  function close(): void {
    const trigger = previousFocus.current;
    if (trigger instanceof HTMLAnchorElement && trigger.hash === window.location.hash) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      setPolicy(null);
    }
  }

  const details = policy ? POLICIES[policy] : null;
  return (
    <dialog
      aria-labelledby="policy-title"
      aria-modal="true"
      className="m-auto w-[calc(100%-2rem)] max-w-xl overflow-y-auto border border-control bg-surface p-0 text-ink shadow-panel backdrop:bg-app/85"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      ref={dialogRef}
    >
      {details ? (
        <div className="p-5 sm:p-7">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                RepoDitor Web
              </p>
              <h2
                className="font-display mt-1 text-4xl font-semibold uppercase leading-none"
                id="policy-title"
              >
                {details.title}
              </h2>
            </div>
            <button
              aria-label={`Close ${details.title}`}
              className="grid size-10 place-items-center rounded-sm border border-control text-secondary transition-colors hover:border-accent hover:text-accent"
              onClick={close}
              ref={closeRef}
              type="button"
            >
              <XIcon aria-hidden="true" size={18} />
            </button>
          </header>
          <div className="mt-5 grid gap-4 text-sm/6 text-secondary">{details.content}</div>
        </div>
      ) : null}
    </dialog>
  );
}

export function AppFooter() {
  const [policy, setPolicy] = useState<Policy | null>(policyFromHash);

  useEffect(() => {
    const syncHash = () => setPolicy(policyFromHash());
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 p-5 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="inline-flex items-center gap-2">
          <ShieldCheckIcon aria-hidden="true" className="text-accent" size={17} />
          Save contents stay local and are not persisted.
        </p>
        <nav aria-label="Policies" className="flex flex-wrap gap-x-4 gap-y-2">
          {(["security", "privacy", "terms"] as const).map((entry) => (
            <a
              className="font-semibold text-secondary transition-colors hover:text-accent"
              href={`#${entry}`}
              key={entry}
              onClick={(event) => {
                event.preventDefault();
                window.history.pushState(null, "", `#${entry}`);
                setPolicy(entry);
              }}
            >
              {POLICIES[entry].title}
            </a>
          ))}
          <a
            className="font-semibold text-secondary transition-colors hover:text-accent"
            href={GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>
      </div>
      <PolicyDialog policy={policy} setPolicy={setPolicy} />
    </footer>
  );
}
