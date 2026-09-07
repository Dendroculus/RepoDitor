import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  FileArrowUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState, type ChangeEvent } from "react";

import { loadSaveFile, SavePipelineError, type LoadedSave } from "@/features/save-file/pipeline";

const DESKTOP_URL = "https://github.com/Yoruxyv/RepoDitor/releases/latest";

type LoadState =
  | { readonly status: "idle" }
  | { readonly fileName: string; readonly status: "loading" }
  | { readonly save: LoadedSave; readonly status: "ready" }
  | { readonly message: string; readonly status: "error" };

function readyLabel(save: LoadedSave): string {
  return save.kind === "run" ? "Run save ready" : "MetaSave ready";
}

function errorMessage(error: unknown): string {
  return error instanceof SavePipelineError
    ? error.message
    : "This save could not be read locally.";
}

function panelHeading(state: LoadState): string {
  switch (state.status) {
    case "ready":
      return readyLabel(state.save);
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
      return `${state.save.fileName} was decrypted and validated. No changes were made.`;
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

export function SaveFilePanel() {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  async function selectFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    setState({ fileName: file.name, status: "loading" });
    try {
      setState({ save: await loadSaveFile(file), status: "ready" });
    } catch (error) {
      setState({ message: errorMessage(error), status: "error" });
    } finally {
      input.value = "";
    }
  }

  return (
    <section aria-label="Choose a save" className="min-w-0">
      <label className="group relative flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-control bg-surface px-6 py-12 text-center shadow-panel transition-colors hover:border-accent hover:bg-surface-raised focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-focus sm:min-h-80">
        <input
          accept=".es3"
          aria-describedby="save-file-help save-file-status"
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
          disabled={state.status === "loading"}
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
