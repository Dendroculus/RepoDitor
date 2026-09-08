import { CheckCircleIcon, FileArrowUpIcon, XIcon } from "@phosphor-icons/react";
import type { ChangeEvent } from "react";

import {
  PendingChangesBar,
  type WorkspaceExportState,
} from "@/features/save-file/PendingChangesBar";
import type { EditSession } from "@/features/save-file/session";
import { getRunPendingEdits } from "@/features/run-save/pendingEdits";
import { RunEditor } from "@/features/run-save/RunEditor";

interface SaveWorkspaceProps {
  readonly busy: boolean;
  readonly exportState: WorkspaceExportState;
  readonly onClear: () => void;
  readonly onDownload: () => void;
  readonly onReset: () => void;
  readonly onSelectFile: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onSessionChange: (session: EditSession) => void;
  readonly session: EditSession;
}

export function SaveWorkspace({
  busy,
  exportState,
  onClear,
  onDownload,
  onReset,
  onSelectFile,
  onSessionChange,
  session,
}: SaveWorkspaceProps) {
  const edits = getRunPendingEdits(session);
  const saveKind = session.originalKind === "run" ? "Run save" : "MetaSave";

  return (
    <section
      aria-busy={exportState.status === "preparing"}
      aria-labelledby="workspace-title"
      className="min-w-0 pb-4"
      data-testid="save-workspace"
    >
      <header className="grid gap-4 border-b border-line pb-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Selected save
          </p>
          <h1
            className="font-display mt-1 truncate text-4xl font-semibold uppercase leading-none tracking-[-0.02em] text-ink"
            id="workspace-title"
            title={session.originalFileName}
          >
            {session.originalFileName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-secondary">
            <span>{saveKind}</span>
            <span className="inline-flex items-center gap-1.5 text-accent">
              <CheckCircleIcon aria-hidden="true" size={15} />
              Validated locally
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <label className="relative inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-sm border border-control bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
            <input
              accept=".es3"
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
              disabled={busy}
              onChange={onSelectFile}
              type="file"
            />
            <FileArrowUpIcon aria-hidden="true" size={17} />
            Change file
          </label>
          <button
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm border border-control px-3 py-2.5 text-sm font-semibold text-secondary transition-colors hover:border-accent hover:text-ink disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            onClick={onClear}
            type="button"
          >
            <XIcon aria-hidden="true" size={17} />
            Clear
          </button>
        </div>
      </header>

      {session.originalKind === "run" ? (
        <RunEditor onSessionChange={onSessionChange} session={session} />
      ) : (
        <section className="py-12" aria-labelledby="metasave-title">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Account save
          </p>
          <h2
            className="font-display mt-1 text-4xl font-semibold uppercase leading-none text-ink"
            id="metasave-title"
          >
            MetaSave loaded
          </h2>
          <p className="mt-3 max-w-xl text-sm/6 text-secondary">
            MetaSave editing is not available in this phase. You can still download a verified copy
            or choose another file.
          </p>
        </section>
      )}

      <PendingChangesBar
        busy={busy}
        edits={edits}
        exportState={exportState}
        onDownload={onDownload}
        onReset={onReset}
      />
    </section>
  );
}
