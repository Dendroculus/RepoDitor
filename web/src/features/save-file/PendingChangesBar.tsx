import { ArrowCounterClockwiseIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import type { RunPendingEdit } from "@/features/run-save/pendingEdits";

export type WorkspaceExportState =
  | { readonly status: "idle" }
  | { readonly status: "preparing" }
  | { readonly message: string; readonly status: "error" | "success" };

interface PendingChangesBarProps {
  readonly busy: boolean;
  readonly edits: readonly RunPendingEdit[];
  readonly exportState: WorkspaceExportState;
  readonly onDownload: () => void;
  readonly onReset: () => void;
}

function pendingLabel(count: number): string {
  if (count === 0) {
    return "Clean";
  }
  return `${count} pending ${count === 1 ? "change" : "changes"}`;
}

function ExportFeedback({ state }: { readonly state: WorkspaceExportState }) {
  if (state.status === "idle") {
    return null;
  }
  if (state.status === "preparing") {
    return (
      <output aria-live="polite" className="text-xs/5 text-secondary">
        Encrypting and verifying the copy locally.
      </output>
    );
  }
  return (
    <output
      aria-live={state.status === "error" ? "assertive" : "polite"}
      className="text-xs/5 text-secondary"
    >
      {state.message}
    </output>
  );
}

export function PendingChangesBar({
  busy,
  edits,
  exportState,
  onDownload,
  onReset,
}: PendingChangesBarProps) {
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    if (edits.length === 0) {
      setReviewing(false);
    }
  }, [edits.length]);

  return (
    <footer className="mt-8 border-t border-line py-3">
      {edits.length > 0 ? (
        <section
          aria-label="Pending change review"
          className="mb-3 border-b border-line pb-3"
          data-testid="pending-changes-review"
          hidden={!reviewing}
          id="pending-changes-review"
        >
          <ul className="grid gap-3">
            {edits.map((edit) => (
              <li
                className="grid min-w-0 gap-1 border-l-2 border-accent pl-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"
                key={edit.id}
              >
                <span className="min-w-0 wrap-break-word text-secondary">
                  {edit.subject} · {edit.field}
                </span>
                <span className="break-all font-mono text-xs text-ink">
                  {edit.before} → {edit.after}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <output
            aria-atomic="true"
            aria-live="polite"
            className={`block text-sm font-semibold ${edits.length > 0 ? "text-accent" : "text-ink"}`}
            data-testid="pending-change-count"
          >
            {pendingLabel(edits.length)}
          </output>
          <ExportFeedback state={exportState} />
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row md:justify-end">
          {edits.length > 0 ? (
            <button
              aria-controls="pending-changes-review"
              aria-expanded={reviewing}
              className="rounded-sm border border-control px-3 py-2.5 text-sm font-semibold text-secondary transition-colors hover:border-accent hover:text-accent aria-expanded:border-accent aria-expanded:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
              type="button"
              onClick={() => setReviewing((current) => !current)}
            >
              Review changes
            </button>
          ) : null}
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-control px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || edits.length === 0}
            onClick={onReset}
            type="button"
          >
            <ArrowCounterClockwiseIcon aria-hidden="true" size={18} />
            Discard changes
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-colors hover:bg-focus disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            onClick={onDownload}
            type="button"
          >
            <DownloadSimpleIcon aria-hidden="true" size={18} weight="bold" />
            {exportState.status === "preparing"
              ? "Preparing verified copy"
              : "Download verified copy"}
          </button>
        </div>
      </div>
    </footer>
  );
}
