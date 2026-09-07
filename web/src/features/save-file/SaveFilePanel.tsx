import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState, type ChangeEvent } from "react";

import {
  downloadVerifiedExport,
  prepareVerifiedExport,
  SaveExportError,
} from "@/features/save-file/export";
import { loadSaveFile, SavePipelineError } from "@/features/save-file/pipeline";
import {
  createEditSession,
  hasPendingChanges,
  type EditSession,
} from "@/features/save-file/session";

const DESKTOP_URL = "https://github.com/Yoruxyv/RepoDitor/releases/latest";

type LoadState =
  | { readonly status: "idle" }
  | { readonly fileName: string; readonly status: "loading" }
  | { readonly session: EditSession; readonly status: "ready" }
  | { readonly message: string; readonly status: "error" };

type ExportState =
  | { readonly status: "idle" }
  | { readonly status: "preparing" }
  | { readonly message: string; readonly status: "error" | "success" };

function readyLabel(session: EditSession): string {
  return session.originalKind === "run" ? "Run save ready" : "MetaSave ready";
}

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

function isBusy(state: LoadState, exportState: ExportState): boolean {
  return state.status === "loading" || exportState.status === "preparing";
}

function panelHeading(state: LoadState): string {
  switch (state.status) {
    case "ready":
      return readyLabel(state.session);
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
      return "or choose a .es3 file";
  }
}

function StatusIcon({ state }: { readonly state: LoadState }) {
  if (state.status === "ready") {
    return <CheckCircleIcon aria-hidden="true" className="text-accent" size={56} />;
  }
  if (state.status === "error") {
    return <WarningCircleIcon aria-hidden="true" className="text-accent" size={56} />;
  }
  return (
    <span className="flex size-14 items-center justify-center rounded-sm border border-line bg-app text-accent transition-transform motion-safe:group-hover:-translate-y-1">
      <FileArrowUpIcon aria-hidden="true" size={30} />
    </span>
  );
}

function ExportFeedback({ state }: { readonly state: ExportState }) {
  if (state.status === "idle") {
    return null;
  }
  return (
    <output
      aria-live={state.status === "error" ? "assertive" : "polite"}
      className="mt-4 block text-sm text-secondary"
    >
      {state.status === "preparing" ? "Encrypting and verifying the copy locally." : state.message}
    </output>
  );
}

export function SaveFilePanel() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });
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
      setState({ session: createEditSession(await loadSaveFile(file)), status: "ready" });
    } catch (error) {
      setState({ message: errorMessage(error), status: "error" });
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
  }

  return (
    <section aria-label="Choose a save" className="min-w-0">
      <label className="group relative flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-control bg-surface px-6 py-12 text-center shadow-panel transition-colors hover:border-accent hover:bg-surface-raised focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-focus sm:min-h-80">
        <input
          accept=".es3"
          aria-describedby="save-file-help save-file-status"
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
          Select one R.E.P.O. ES3 save file from this device. Processing stays in this browser.
        </span>
      </label>

      {state.status === "ready" ? (
        <div
          aria-busy={exportState.status === "preparing"}
          className="mt-5 rounded-sm border border-line bg-surface-raised p-4 sm:p-5"
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-secondary">File</dt>
              <dd className="mt-1 break-all font-semibold text-ink">
                {state.session.originalFileName}
              </dd>
            </div>
            <div>
              <dt className="text-secondary">Save type</dt>
              <dd className="mt-1 font-semibold text-ink">
                {state.session.originalKind === "run" ? "Run" : "MetaSave"}
              </dd>
            </div>
            <div>
              <dt className="text-secondary">Changes</dt>
              <dd className="mt-1 font-semibold text-ink">
                {hasPendingChanges(state.session) ? "Pending" : "Clean"}
              </dd>
            </div>
            <div>
              <dt className="text-secondary">Validation</dt>
              <dd className="mt-1 font-semibold text-ink">Passed</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-colors hover:bg-focus disabled:cursor-wait disabled:opacity-60"
              disabled={busy}
              onClick={() => void downloadCopy(state.session)}
              type="button"
            >
              <DownloadSimpleIcon aria-hidden="true" size={18} weight="bold" />
              {exportState.status === "preparing"
                ? "Preparing verified copy"
                : "Download verified copy"}
            </button>
            <button
              className="rounded-sm border border-control px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
              disabled={busy}
              onClick={clear}
              type="button"
            >
              Clear
            </button>
          </div>

          <ExportFeedback state={exportState} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">Want automatic save discovery?</p>
        <a
          className="inline-flex w-fit items-center gap-2 rounded-sm border border-control bg-surface-raised px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          href={DESKTOP_URL}
          rel="noreferrer"
          target="_blank"
        >
          Get RepoDitor Desktop
          <ArrowSquareOutIcon aria-hidden="true" size={17} weight="bold" />
        </a>
      </div>
    </section>
  );
}
