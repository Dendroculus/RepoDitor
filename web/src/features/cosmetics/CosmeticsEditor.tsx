import { SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { useI18n } from "@/app/i18n/context";
import {
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

export function CosmeticsEditor({ busy, onSessionChange, session }: CosmeticsEditorProps) {
  const { formatNumber, t } = useI18n();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const unavailableMessage = t("cosmetics.unavailableMessage");

  let state: MetaCosmeticsState;
  try {
    state = inspectMetaCosmetics(session.working);
  } catch {
    return (
      <section aria-labelledby="cosmetics-title" className="py-12">
        <h2
          className="font-display text-4xl font-semibold uppercase leading-none text-ink"
          id="cosmetics-title"
        >
          {t("cosmetics.unavailable")}
        </h2>
        <p className="mt-3 text-sm text-accent" role="alert">
          {unavailableMessage}
        </p>
      </section>
    );
  }

  const complete = state.remainingSupportedCount === 0;
  const statusText = complete
    ? t("cosmetics.complete")
    : t(
        "cosmetics.remaining",
        { count: formatNumber(state.remainingSupportedCount) },
        state.remainingSupportedCount,
      );

  function unlockRemaining(): void {
    try {
      if (unlockRemainingCosmetics(session.working)) {
        onSessionChange({ ...session });
      }
      setMutationError(null);
    } catch {
      setMutationError(unavailableMessage);
    }
  }

  return (
    <section aria-labelledby="cosmetics-title" className="py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
        {t("cosmetics.eyebrow")}
      </p>
      <h2
        className="font-display mt-1 text-4xl font-semibold uppercase leading-none text-ink"
        id="cosmetics-title"
      >
        {t("cosmetics.title")}
      </h2>

      <div className="mt-7 max-w-xl border-y border-line py-5">
        <p className="text-lg font-semibold text-ink">
          {t("cosmetics.unlocked", {
            owned: formatNumber(state.ownedSupportedCount),
            total: formatNumber(state.totalSupportedCount),
          })}
        </p>
        <p className="mt-1 text-sm/6 text-secondary">{statusText}</p>
        <p className="mt-1 text-xs/5 text-secondary">{t("cosmetics.presets")}</p>

        <button
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-colors hover:bg-focus disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy || complete}
          onClick={unlockRemaining}
          type="button"
        >
          <SparkleIcon aria-hidden="true" size={18} weight="bold" />
          {t("cosmetics.action")}
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
