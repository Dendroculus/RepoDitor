import { SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import {
  CosmeticEditError,
  inspectMetaCosmetics,
  type MetaCosmeticsState,
  unlockRemainingCosmetics,
} from "@/features/cosmetics/cosmetics";
import type { EditSession } from "@/features/save-file/session";

interface CosmeticsEditorProps {
  readonly busy: boolean;
  readonly onSessionChange: (session: EditSession) => void;
  readonly session: EditSession;
}

function errorMessage(error: unknown): string {
  return error instanceof CosmeticEditError
    ? error.message
    : "Cosmetics editing is unavailable for this MetaSave.";
}

export function CosmeticsEditor({ busy, onSessionChange, session }: CosmeticsEditorProps) {
  const [mutationError, setMutationError] = useState<string | null>(null);

  let state: MetaCosmeticsState;
  try {
    state = inspectMetaCosmetics(session.working);
  } catch (error) {
    return (
      <section aria-labelledby="cosmetics-title" className="py-12">
        <h2
          className="font-display text-4xl font-semibold uppercase leading-none text-ink"
          id="cosmetics-title"
        >
          Cosmetics unavailable
        </h2>
        <p className="mt-3 text-sm text-accent" role="alert">
          {errorMessage(error)}
        </p>
      </section>
    );
  }

  const complete = state.remainingSupportedCount === 0;
  const remainingNoun =
    state.remainingSupportedCount === 1 ? "cosmetic remains" : "cosmetics remain";
  const statusText = complete
    ? "All supported cosmetics are already unlocked."
    : `${state.remainingSupportedCount.toLocaleString("en-US")} supported ${remainingNoun} locked.`;

  function unlockRemaining(): void {
    try {
      if (unlockRemainingCosmetics(session.working)) {
        onSessionChange({ ...session });
      }
      setMutationError(null);
    } catch (error) {
      setMutationError(errorMessage(error));
    }
  }

  return (
    <section aria-labelledby="cosmetics-title" className="py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Account save</p>
      <h2
        className="font-display mt-1 text-4xl font-semibold uppercase leading-none text-ink"
        id="cosmetics-title"
      >
        Cosmetics
      </h2>

      <div className="mt-7 max-w-xl border-y border-line py-5">
        <p className="text-lg font-semibold text-ink">
          {state.ownedSupportedCount.toLocaleString("en-US")} of{" "}
          {state.totalSupportedCount.toLocaleString("en-US")} supported cosmetics unlocked
        </p>
        <p className="mt-1 text-sm/6 text-secondary">{statusText}</p>
        <p className="mt-1 text-xs/5 text-secondary">Presets are not modified.</p>

        <button
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-colors hover:bg-focus disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy || complete}
          onClick={unlockRemaining}
          type="button"
        >
          <SparkleIcon aria-hidden="true" size={18} weight="bold" />
          Unlock Remaining Cosmetics
        </button>
        {mutationError ? (
          <p className="mt-3 text-sm text-accent" role="alert">
            {mutationError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
