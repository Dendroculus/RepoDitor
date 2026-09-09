import { CheckIcon, CopyIcon, FolderOpenIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import {
  detectInitialGuidancePlatform,
  PROTON_REPO_SUFFIX,
  type GuidancePlatform,
  WINDOWS_META_PATH,
  WINDOWS_RUN_PATH,
} from "@/features/save-file/saveLocations";

const PLATFORM_LABELS: Readonly<Record<GuidancePlatform, string>> = {
  linux: "Linux / Proton",
  windows: "Windows",
};

interface CopyPathButtonProps {
  readonly label: string;
  readonly onCopy: (path: string, label: string) => void;
  readonly path: string;
}

function CopyPathButton({ label, onCopy, path }: CopyPathButtonProps) {
  return (
    <button
      aria-label={`Copy ${label}`}
      className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-control px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
      onClick={() => onCopy(path, label)}
      type="button"
    >
      <CopyIcon aria-hidden="true" size={15} />
      Copy path
    </button>
  );
}

interface PathBlockProps {
  readonly children: ReactNode;
  readonly copyLabel: string;
  readonly heading: string;
  readonly onCopy: (path: string, label: string) => void;
  readonly path: string;
}

function PathBlock({ children, copyLabel, heading, onCopy, path }: PathBlockProps) {
  const headingId = `${copyLabel.toLowerCase().replaceAll(" ", "-")}-title`;
  return (
    <section aria-labelledby={headingId} className="border-t border-line pt-4">
      <h3 className="text-sm font-semibold text-ink" id={headingId}>
        {heading}
      </h3>
      <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <code className="min-w-0 select-text whitespace-normal break-all rounded-sm bg-app px-3 py-2 font-mono text-xs/5 text-secondary">
          {path}
        </code>
        <CopyPathButton label={copyLabel} onCopy={onCopy} path={path} />
      </div>
      {children}
    </section>
  );
}

export function FindSaveDialog() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<GuidancePlatform>(detectInitialGuidancePlatform);
  const [copyStatus, setCopyStatus] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const windowsTabRef = useRef<HTMLButtonElement>(null);
  const linuxTabRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
      closeRef.current?.focus();
      return;
    }
    if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    if (returnFocus.current) {
      triggerRef.current?.focus();
      returnFocus.current = false;
    }
  }, [open]);

  function closeDialog(): void {
    returnFocus.current = true;
    setOpen(false);
  }

  function choosePlatform(next: GuidancePlatform): void {
    setPlatform(next);
    setCopyStatus("");
  }

  function movePlatformTab(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const next = platform === "windows" ? "linux" : "windows";
    choosePlatform(next);
    (next === "windows" ? windowsTabRef : linuxTabRef).current?.focus();
  }

  async function copyPath(path: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(path);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus("Copy failed. Select the path and copy it manually.");
    }
  }

  return (
    <>
      <button
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm border border-control px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <FolderOpenIcon aria-hidden="true" size={17} />
        Find my save
      </button>

      <dialog
        aria-labelledby="find-save-title"
        aria-modal="true"
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-sm border border-line bg-surface p-0 text-ink shadow-panel backdrop:bg-app/85"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeDialog();
          }
        }}
        ref={dialogRef}
      >
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
            <div>
              <h2
                className="font-display text-4xl font-semibold uppercase leading-none text-ink"
                id="find-save-title"
              >
                Find my save
              </h2>
              <p className="mt-2 max-w-xl text-sm/6 text-secondary">
                RepoDitor Web does not scan your files. Use this guide, then choose the save
                manually.
              </p>
            </div>
            <button
              aria-label="Close save location guide"
              className="grid size-10 place-items-center rounded-sm border border-control text-secondary transition-colors hover:border-accent hover:text-accent"
              onClick={closeDialog}
              ref={closeRef}
              type="button"
            >
              <XIcon aria-hidden="true" size={18} />
            </button>
          </header>

          <div
            className="min-h-0 min-w-0 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6"
            data-testid="find-save-scroll-region"
          >
            <div
              aria-label="Save location platform"
              className="mt-5 flex border-b border-line"
              role="tablist"
            >
              {(["windows", "linux"] as const).map((entry) => (
                <button
                  aria-controls={`find-save-${entry}-panel`}
                  aria-selected={platform === entry}
                  className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-secondary transition-colors hover:text-ink aria-selected:border-accent aria-selected:text-accent"
                  id={`find-save-${entry}-tab`}
                  key={entry}
                  onClick={() => choosePlatform(entry)}
                  onKeyDown={movePlatformTab}
                  ref={entry === "windows" ? windowsTabRef : linuxTabRef}
                  role="tab"
                  tabIndex={platform === entry ? 0 : -1}
                  type="button"
                >
                  {PLATFORM_LABELS[entry]}
                </button>
              ))}
            </div>

            {platform === "windows" ? (
              <div
                aria-labelledby="find-save-windows-tab"
                className="mt-5 grid gap-5"
                id="find-save-windows-panel"
                role="tabpanel"
              >
                <PathBlock
                  copyLabel="Windows Run saves path"
                  heading="Run saves"
                  onCopy={(path, label) => void copyPath(path, label)}
                  path={WINDOWS_RUN_PATH}
                >
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm/6 text-secondary">
                    <li>Press Win + R.</li>
                    <li>Paste the path.</li>
                    <li>Press Enter.</li>
                    <li>Select the desired Run .es3 save in RepoDitor Web.</li>
                  </ol>
                </PathBlock>

                <PathBlock
                  copyLabel="Windows MetaSave path"
                  heading="Cosmetics"
                  onCopy={(path, label) => void copyPath(path, label)}
                  path={WINDOWS_META_PATH}
                >
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm/6 text-secondary">
                    <li>Press Win + R.</li>
                    <li>Paste the path.</li>
                    <li>Press Enter.</li>
                    <li>
                      For cosmetics, select <strong className="text-ink">MetaSave.es3</strong>.
                    </li>
                  </ol>
                </PathBlock>
              </div>
            ) : (
              <div
                aria-labelledby="find-save-linux-tab"
                className="mt-5 grid gap-5"
                id="find-save-linux-panel"
                role="tabpanel"
              >
                <p className="text-sm/6 text-secondary">
                  Locate the Steam library containing R.E.P.O. (Steam App ID{" "}
                  <strong className="font-mono text-ink">3241660</strong>), then navigate to:
                </p>
                <PathBlock
                  copyLabel="Linux Proton Repo path"
                  heading="Proton save directory"
                  onCopy={(path, label) => void copyPath(path, label)}
                  path={PROTON_REPO_SUFFIX}
                >
                  <p className="mt-3 text-sm/6 text-secondary">
                    Press Ctrl + L in your file manager to enter a path. Open{" "}
                    <strong className="font-mono text-ink">saves/</strong> for Run saves, or select{" "}
                    <strong className="font-mono text-ink">MetaSave.es3</strong> for cosmetics.
                  </p>
                </PathBlock>
                <section className="border-t border-line pt-4">
                  <h3 className="text-sm font-semibold text-ink">Common Steam root examples</h3>
                  <div className="mt-2 grid gap-1 font-mono text-xs/5 text-secondary">
                    <code>~/.local/share/Steam/</code>
                    <code>~/.steam/steam/</code>
                  </div>
                  <p className="mt-2 text-sm/6 text-secondary">
                    These are examples only. Custom Steam libraries may be on another disk or in
                    another location.
                  </p>
                </section>
              </div>
            )}

            <output
              aria-live="polite"
              className={
                copyStatus
                  ? "mt-4 flex min-h-5 items-center gap-2 text-xs text-secondary"
                  : "sr-only"
              }
            >
              {copyStatus ? (
                <CheckIcon aria-hidden="true" className="text-accent" size={15} />
              ) : null}
              {copyStatus}
            </output>
          </div>
        </div>
      </dialog>
    </>
  );
}
