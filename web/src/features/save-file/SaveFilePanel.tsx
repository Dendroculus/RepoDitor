import { ArrowSquareOutIcon, FileArrowUpIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState, type ChangeEvent } from "react";

import {
  downloadVerifiedExport,
  prepareVerifiedExport,
  SaveExportError,
} from "@/features/save-file/export";
import type { WorkspaceExportState } from "@/features/save-file/PendingChangesBar";
import { FindSaveDialog } from "@/features/save-file/FindSaveDialog";
import { loadSaveFile, SavePipelineError } from "@/features/save-file/pipeline";
import {
  createEditSession,
  resetEditSession,
  type EditSession,
} from "@/features/save-file/session";
import { SaveWorkspace } from "@/features/save-file/SaveWorkspace";

const DESKTOP_URL = "https://github.com/Yoruxyv/RepoDitor/releases/latest";

type LoadState =
  | { readonly status: "idle" }
  | { readonly fileName: string; readonly status: "loading" }
  | { readonly session: EditSession; readonly status: "ready" }
  | { readonly message: string; readonly status: "error" };

function errorMessage(error: unknown): string {
  return error instanceof SavePipelineError
    ? error.message
    : "This save could not be read locally.";
}

function exportErrorMessage(error: unknown): string {
  return error instanceof SaveExportError
    ? error.message
    : "The encrypted copy could not be prepared safely.";
}

function isBusy(state: LoadState, exportState: WorkspaceExportState): boolean {
  return state.status === "loading" || exportState.status === "preparing";
}

function panelHeading(state: LoadState): string {
  switch (state.status) {
    case "ready":
      return "Save ready";
    case "loading":
      return "Reading locally";
    case "error":
      return "Save not loaded";
    case "idle":
      return "Drop a save here";
  }
}

function panelMessage(state: LoadState): string {
  switch (state.status) {
    case "ready":
      return `${state.session.originalFileName} was decrypted and validated.`;
    case "loading":
      return `Decrypting and validating ${state.fileName}`;
    case "error":
      return state.message;
    case "idle":
      return "or choose a supported .es3 save";
  }
}

function StatusIcon({ state }: { readonly state: LoadState }) {
  if (state.status === "error") {
    return <WarningCircleIcon aria-hidden="true" className="text-accent" size={56} />;
  }
  return (
    <span className="flex size-14 items-center justify-center rounded-sm border border-line bg-app text-accent transition-transform motion-safe:group-hover:-translate-y-1">
      <FileArrowUpIcon aria-hidden="true" size={30} />
    </span>
  );
}

interface SaveFilePanelProps {
  readonly onWorkspaceChange: (open: boolean) => void;
}

export function SaveFilePanel({ onWorkspaceChange }: SaveFilePanelProps) {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [exportState, setExportState] = useState<WorkspaceExportState>({ status: "idle" });
  const busy = isBusy(state, exportState);

  async function selectFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    setExportState({ status: "idle" });
    setState({ fileName: file.name, status: "loading" });
    try {
      const session = createEditSession(await loadSaveFile(file));
      setState({ session, status: "ready" });
      onWorkspaceChange(true);
    } catch (error) {
      setState({ message: errorMessage(error), status: "error" });
      onWorkspaceChange(false);
    } finally {
      input.value = "";
    }
  }

  async function downloadCopy(session: EditSession): Promise<void> {
    setExportState({ status: "preparing" });
    try {
      const output = await prepareVerifiedExport(session);
      downloadVerifiedExport(output);
      setExportState({
        message: `${output.fileName} was verified and downloaded.`,
        status: "success",
      });
    } catch (error) {
      setExportState({
        message: exportErrorMessage(error),
        status: "error",
      });
    }
  }

  function clear(): void {
    setState({ status: "idle" });
    setExportState({ status: "idle" });
    onWorkspaceChange(false);
  }

  function updateSession(session: EditSession): void {
    setState({ session, status: "ready" });
    setExportState({ status: "idle" });
  }

  if (state.status === "ready") {
    return (
      <SaveWorkspace
        busy={busy}
        exportState={exportState}
        session={state.session}
        onClear={clear}
        onDownload={() => void downloadCopy(state.session)}
        onReset={() => updateSession(resetEditSession(state.session))}
        onSelectFile={(event) => void selectFile(event)}
        onSessionChange={updateSession}
      />
    );
  }

  return (
    <section aria-label="Choose a save" className="min-w-0">
      <label className="group relative flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-control bg-surface px-6 py-12 text-center shadow-panel transition-colors hover:border-accent hover:bg-surface-raised focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-focus sm:min-h-80">
        <input
          accept=".es3"
          aria-describedby="save-file-help save-file-status supported-save-types"
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
          disabled={busy}
          onChange={(event) => void selectFile(event)}
          type="file"
        />
        <StatusIcon state={state} />

        <span className="font-display mt-6 text-3xl font-semibold uppercase leading-none tracking-tight sm:text-4xl">
          {panelHeading(state)}
        </span>
        <output
          aria-live={state.status === "error" ? "assertive" : "polite"}
          className="mt-3 text-sm font-medium text-secondary"
          id="save-file-status"
        >
          {panelMessage(state)}
        </output>
        <span className="sr-only" id="save-file-help">
          Select a supported R.E.P.O. Run save or MetaSave.es3 from this device. Processing stays in
          this browser.
        </span>
        <span className="mt-4 grid gap-1 text-xs/5 text-secondary" id="supported-save-types">
          <span>
            <strong className="font-semibold text-ink">Run saves</strong> - players, upgrades,
            currency, and Run settings
          </span>
          <span>
            <strong className="font-semibold text-ink">MetaSave.es3</strong> - supported cosmetics
          </span>
        </span>
      </label>

      <div className="mt-5 grid gap-3 border-t border-line pt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">Not sure where your save is?</p>
          <FindSaveDialog />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">Prefer automatic save discovery?</p>
          <a
            className="inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-sm border border-control bg-surface-raised px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            href={DESKTOP_URL}
            rel="noreferrer"
            target="_blank"
          >
            Get RepoDitor Desktop
            <ArrowSquareOutIcon aria-hidden="true" size={17} weight="bold" />
          </a>
        </div>
      </div>
    </section>
  );
}
