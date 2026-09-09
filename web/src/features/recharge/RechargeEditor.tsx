import { BatteryChargingIcon } from "@phosphor-icons/react";
import { useState } from "react";

import {
  inspectRecharge,
  RechargeEditError,
  rechargeAllSupportedItems,
  type RechargeState,
} from "@/features/recharge/recharge";
import type { EditSession } from "@/features/save-file/session";

interface RechargeEditorProps {
  readonly busy: boolean;
  readonly onSessionChange: (session: EditSession) => void;
  readonly session: EditSession;
}

function errorMessage(error: unknown): string {
  return error instanceof RechargeEditError
    ? error.message
    : "Recharge editing is unavailable for this Run save.";
}

function rechargeStatus(state: RechargeState): string {
  if (state.supportedItemCount === 0) {
    return "No supported rechargeable items were found in this Run save.";
  }
  if (state.needingRechargeCount === 0) {
    return "All supported items fully charged.";
  }
  const needNoun = state.needingRechargeCount === 1 ? "item needs" : "items need";
  return `${state.needingRechargeCount.toLocaleString("en-US")} ${needNoun} recharging`;
}

export function RechargeEditor({ busy, onSessionChange, session }: RechargeEditorProps) {
  const [mutationError, setMutationError] = useState<string | null>(null);

  let state: RechargeState;
  try {
    state = inspectRecharge(session.working);
  } catch (error) {
    return (
      <section aria-labelledby="recharge-title">
        <h2 className="text-2xl font-semibold text-ink" id="recharge-title">
          Recharge unavailable
        </h2>
        <p className="mt-3 text-sm text-accent" role="alert">
          {errorMessage(error)}
        </p>
      </section>
    );
  }

  const itemNoun = state.supportedItemCount === 1 ? "item" : "items";

  function recharge(): void {
    try {
      if (rechargeAllSupportedItems(session.working)) {
        onSessionChange({ ...session });
      }
      setMutationError(null);
    } catch (error) {
      setMutationError(errorMessage(error));
    }
  }

  return (
    <section aria-labelledby="recharge-title">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
        Truck inventory
      </p>
      <h2 className="mt-1 text-2xl font-semibold text-ink" id="recharge-title">
        Recharge
      </h2>

      <div className="mt-7 max-w-xl border-y border-line py-5">
        <p className="text-lg font-semibold text-ink">
          {state.supportedItemCount.toLocaleString("en-US")} supported rechargeable {itemNoun}
        </p>
        <p className="mt-1 text-sm/6 text-secondary">{rechargeStatus(state)}</p>
        <p className="mt-1 text-xs/5 text-secondary">
          Unknown and unsupported item types remain unchanged.
        </p>

        <button
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-colors hover:bg-focus disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy || state.needingRechargeCount === 0}
          onClick={recharge}
          type="button"
        >
          <BatteryChargingIcon aria-hidden="true" size={18} weight="bold" />
          Recharge All Supported Items
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
