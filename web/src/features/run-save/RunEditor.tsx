import {
  ArrowUpIcon,
  CoinsIcon,
  HeartIcon,
  MapPinIcon,
  TrendUpIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useEffect, useState, type KeyboardEvent } from "react";

import { RechargeEditor } from "@/features/recharge/RechargeEditor";
import type { EditSession } from "@/features/save-file/session";
import { SelectedPlayerIdentity } from "@/features/run-save/PlayerIdentity";
import {
  DISPLAY_LEVEL_MAX,
  inspectRunSave,
  type RunPlayer,
  RunEditError,
  SAVE_INT32_MAX,
  SAVE_INT32_MIN,
  setCurrency,
  setPlayerHealth,
  setPlayerUpgrade,
  setResumeLocation,
  setRunLevel,
} from "@/features/run-save/runSave";
import { useSteamAvatars } from "@/features/run-save/useSteamAvatars";

type EditorSection = "players" | "recharge" | "run" | "upgrades";

const TABS: readonly EditorSection[] = ["players", "upgrades", "run", "recharge"];
const TAB_OFFSETS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1 };
const TAB_LABELS: Readonly<Record<EditorSection, string>> = {
  players: "Players",
  recharge: "Recharge",
  run: "Run",
  upgrades: "Upgrades",
};
const BASE_PLAYER_HEALTH = 100;
const HEALTH_PER_UPGRADE = 20;

interface RunEditorProps {
  readonly busy: boolean;
  readonly onSessionChange: (session: EditSession) => void;
  readonly session: EditSession;
}

interface IntegerInputProps {
  readonly error: string;
  readonly id: string;
  readonly maximum: number;
  readonly minimum: number;
  readonly onValueChange: (value: number) => void;
  readonly resetToken: object;
  readonly value: number;
}

function acceptedInteger(draft: string, minimum: number, maximum: number): number | null {
  const parsed = Number(draft);
  return draft.trim() !== "" &&
    Number.isSafeInteger(parsed) &&
    parsed >= minimum &&
    parsed <= maximum
    ? parsed
    : null;
}

function IntegerInput({
  error,
  id,
  maximum,
  minimum,
  onValueChange,
  resetToken,
  value,
}: IntegerInputProps) {
  const [draft, setDraft] = useState(String(value));
  const invalid = acceptedInteger(draft, minimum, maximum) === null;

  useEffect(() => setDraft(String(value)), [resetToken, value]);

  return (
    <>
      <input
        aria-describedby={invalid ? `${id}-error` : undefined}
        aria-invalid={invalid || undefined}
        className="block w-36 max-w-full rounded-sm border border-control bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-accent"
        id={id}
        inputMode="numeric"
        max={maximum}
        min={minimum}
        step="1"
        type="number"
        value={draft}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          const nextValue = acceptedInteger(nextDraft, minimum, maximum);
          if (nextValue !== null && nextValue !== value) {
            onValueChange(nextValue);
          }
        }}
      />
      {invalid ? (
        <p className="mt-2 text-xs text-accent" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

function mutationMessage(error: unknown): string {
  return error instanceof RunEditError ? error.message : "This edit could not be staged safely.";
}

function maximumHealth(player: RunPlayer, upgrades: ReturnType<typeof inspectRunSave>["upgrades"]) {
  const healthUpgrade =
    upgrades.find(({ key }) => key === "playerUpgradeHealth")?.values.get(player.id) ?? 0;
  return BASE_PLAYER_HEALTH + Math.max(healthUpgrade, 0) * HEALTH_PER_UPGRADE;
}

function inspectWorkingSave(
  data: EditSession["working"],
):
  | { readonly error: null; readonly state: ReturnType<typeof inspectRunSave> }
  | { readonly error: string; readonly state: null } {
  try {
    return { error: null, state: inspectRunSave(data) };
  } catch (error) {
    return { error: mutationMessage(error), state: null };
  }
}

function moveTab(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  select: (section: EditorSection) => void,
): void {
  const offset = TAB_OFFSETS[event.key] ?? 0;
  if (offset === 0) {
    return;
  }
  event.preventDefault();
  const nextIndex = (index + offset + TABS.length) % TABS.length;
  select(TABS[nextIndex]!);
  document.getElementById(`run-editor-tab-${nextIndex}`)?.focus();
}

function rechargeSection(section: EditorSection, props: RunEditorProps) {
  return section === "recharge" ? <RechargeEditor {...props} /> : null;
}

export function RunEditor({ busy, onSessionChange, session }: RunEditorProps) {
  const [section, setSection] = useState<EditorSection>("players");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const inspection = inspectWorkingSave(session.working);
  const state = inspection.state;
  const avatars = useSteamAvatars(state?.players ?? [], session.sessionToken);

  if (!state) {
    return (
      <section aria-labelledby="run-editor-title" className="py-12">
        <h2
          className="font-display text-4xl font-semibold uppercase leading-none text-ink"
          id="run-editor-title"
        >
          Run editor unavailable
        </h2>
        <p className="mt-2 text-sm text-accent" role="alert">
          {inspection.error}
        </p>
      </section>
    );
  }

  const player =
    state.players.find(({ id }) => id === selectedPlayerId) ?? state.players.at(0) ?? null;

  function apply(mutation: () => void): void {
    try {
      mutation();
      setMutationError(null);
      onSessionChange({ ...session });
    } catch (error) {
      setMutationError(mutationMessage(error));
    }
  }

  const resumeValue = state.resumeLocation ?? `unknown-${state.resumeValue}`;
  const activeIndex = TABS.indexOf(section);

  return (
    <section aria-label="Run save editor">
      <nav className="overflow-x-auto border-b border-line" aria-label="Run editor sections">
        <div className="flex min-w-max gap-1 py-2" role="tablist">
          {TABS.map((tab, index) => (
            <button
              aria-controls="run-editor-panel"
              aria-label={TAB_LABELS[tab]}
              aria-selected={section === tab}
              className={`rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors ${
                section === tab
                  ? "bg-accent text-accent-ink"
                  : "text-secondary hover:bg-surface hover:text-ink"
              }`}
              id={`run-editor-tab-${index}`}
              key={tab}
              role="tab"
              tabIndex={section === tab ? 0 : -1}
              type="button"
              onClick={() => setSection(tab)}
              onKeyDown={(event) => moveTab(event, index, setSection)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </nav>

      <div className="pt-6">
        {mutationError ? (
          <p
            className="mb-5 border-l-2 border-accent bg-accent-muted px-4 py-3 text-sm text-ink"
            role="alert"
          >
            {mutationError}
          </p>
        ) : null}

        <div
          aria-labelledby={`run-editor-tab-${activeIndex}`}
          className="min-w-0"
          id="run-editor-panel"
          role="tabpanel"
          tabIndex={0}
        >
          {section === "players" && player ? (
            <div className="grid min-w-0 gap-7 md:grid-cols-[15rem_minmax(0,1fr)]">
              <section aria-labelledby="player-list-title">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-xl font-semibold text-ink" id="player-list-title">
                    Players
                  </h2>
                  <span className="font-mono text-xs text-secondary">{state.players.length}</span>
                </div>
                <div className="mt-4 grid gap-2" aria-label="Players">
                  {state.players.map((option) => {
                    const selected = option.id === player.id;
                    return (
                      <button
                        aria-pressed={selected}
                        className={`min-w-0 rounded-sm border px-4 py-3 text-left transition-colors ${
                          selected
                            ? "border-accent bg-accent-muted text-ink"
                            : "border-control bg-surface text-secondary hover:border-accent hover:text-ink"
                        }`}
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedPlayerId(option.id)}
                      >
                        <span className="block truncate text-sm font-semibold">{option.name}</span>
                        <span className="mt-1 block truncate font-mono text-xs text-secondary">
                          {option.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section
                aria-labelledby="selected-player-health"
                className="min-w-0 border-t border-line pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-7"
              >
                <SelectedPlayerIdentity
                  avatarUrl={avatars.avatarUrl(player.id)}
                  player={player}
                  onRejectAvatar={() => avatars.reject(player.id)}
                />
                {(() => {
                  const maxHealth = maximumHealth(player, state.upgrades);
                  const visibleHealth = Math.min(Math.max(player.health, 0), maxHealth);
                  const healthPercent = Math.round((visibleHealth / maxHealth) * 100);
                  const editableMaximum = Math.min(maxHealth, SAVE_INT32_MAX);
                  return (
                    <div className="mt-7 max-w-sm border-t border-line pt-6">
                      <label
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink"
                        htmlFor="run-player-health"
                        id="selected-player-health"
                      >
                        <HeartIcon aria-hidden="true" className="text-secondary" size={15} />
                        Current health
                      </label>
                      <p className="mt-1 text-xs/5 text-secondary">
                        This creates an in-memory pending edit. It does not change your source file.
                      </p>
                      <div className="mt-3 flex flex-wrap items-start gap-3">
                        <div className="flex items-center gap-2">
                          <IntegerInput
                            error={`Current health must be a whole number between 0 and ${SAVE_INT32_MAX.toLocaleString("en-US")}.`}
                            id="run-player-health"
                            key={player.id}
                            maximum={SAVE_INT32_MAX}
                            minimum={0}
                            resetToken={session.working}
                            value={player.health}
                            onValueChange={(value) =>
                              apply(() => setPlayerHealth(session.working, player.id, value))
                            }
                          />
                          <span className="font-mono text-sm text-secondary">/ {maxHealth}</span>
                        </div>
                        <button
                          className="rounded-sm border border-control px-3 py-2 text-sm font-semibold text-secondary hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={player.health === editableMaximum}
                          type="button"
                          onClick={() =>
                            apply(() =>
                              setPlayerHealth(session.working, player.id, editableMaximum),
                            )
                          }
                        >
                          Heal to Full
                        </button>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <progress
                          aria-label="Current health"
                          className="sr-only"
                          max={maxHealth}
                          value={visibleHealth}
                        />
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                          <div
                            aria-hidden="true"
                            className="h-full bg-accent"
                            data-testid="player-health-progress-fill"
                            style={{ width: `${healthPercent}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-xs text-secondary">
                          {healthPercent}%
                        </span>
                      </div>
                      <p className="mt-4 flex items-center gap-2 text-xs text-secondary">
                        <UserIcon aria-hidden="true" size={15} /> Health and Health upgrade are
                        separate values.
                      </p>
                    </div>
                  );
                })()}
              </section>
            </div>
          ) : null}
          {section === "players" && !player ? (
            <p className="text-sm text-secondary">No players were found in this Run save.</p>
          ) : null}

          {section === "upgrades" ? (
            <section aria-labelledby="upgrades-title">
              <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                    Per-player values
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-ink" id="upgrades-title">
                    Upgrades
                  </h2>
                </div>
                {player ? (
                  <div className="flex min-w-0 flex-wrap items-end gap-4">
                    <SelectedPlayerIdentity
                      avatarUrl={avatars.avatarUrl(player.id)}
                      player={player}
                      onRejectAvatar={() => avatars.reject(player.id)}
                    />
                    <label className="min-w-0 text-sm font-semibold text-ink">
                      <span>Player</span>
                      <select
                        aria-label="Player"
                        className="mt-1 block min-w-52 max-w-full rounded-sm border border-control bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent"
                        value={player.id}
                        onChange={(event) => setSelectedPlayerId(event.target.value)}
                      >
                        {state.players.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>

              {player && state.upgrades.length > 0 ? (
                <div className="mt-6 grid min-w-0 gap-x-8 gap-y-5 xl:grid-cols-2">
                  {state.upgrades.map((upgrade, index) => (
                    <div
                      className="relative min-h-24 min-w-0 border-t border-line pt-4 pr-20"
                      key={`${player.id}:${upgrade.key}`}
                    >
                      <span className="absolute top-4 right-0 grid size-14 place-items-center rounded-sm border border-line bg-accent-muted text-accent">
                        <TrendUpIcon aria-hidden="true" size={24} />
                      </span>
                      <label
                        className="block min-w-0 truncate text-sm font-semibold text-ink"
                        htmlFor={`run-upgrade-${index}`}
                        title={upgrade.label}
                      >
                        {upgrade.label}
                      </label>
                      <div className="mt-3">
                        <IntegerInput
                          error={`Upgrade value must be a whole number between 0 and ${SAVE_INT32_MAX.toLocaleString("en-US")}.`}
                          id={`run-upgrade-${index}`}
                          maximum={SAVE_INT32_MAX}
                          minimum={0}
                          resetToken={session.working}
                          value={upgrade.values.get(player.id) ?? 0}
                          onValueChange={(value) =>
                            apply(() =>
                              setPlayerUpgrade(session.working, player.id, upgrade.key, value),
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-secondary">
                  No supported player upgrade dictionaries were found in this save.
                </p>
              )}
            </section>
          ) : null}

          {section === "run" ? (
            <section aria-labelledby="run-title">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Current expedition
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-ink" id="run-title">
                Run
              </h2>
              <p className="mt-2 max-w-[58ch] text-sm/6 text-secondary">
                Adjust the values below in memory. Your source file is never overwritten.
              </p>
              <div className="mt-7 grid min-w-0 gap-x-8 gap-y-5 sm:grid-cols-2">
                <div className="border-t border-line pt-4">
                  <label
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink"
                    htmlFor="run-level"
                  >
                    <ArrowUpIcon aria-hidden="true" className="text-secondary" size={15} /> Run
                    level
                  </label>
                  <div className="mt-3">
                    <IntegerInput
                      error={`Run level must be a whole number between 1 and ${DISPLAY_LEVEL_MAX.toLocaleString("en-US")}.`}
                      id="run-level"
                      maximum={DISPLAY_LEVEL_MAX}
                      minimum={1}
                      resetToken={session.working}
                      value={state.level}
                      onValueChange={(value) => apply(() => setRunLevel(session.working, value))}
                    />
                  </div>
                </div>
                <div className="border-t border-line pt-4">
                  <label
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink"
                    htmlFor="run-currency"
                  >
                    <CoinsIcon aria-hidden="true" className="text-secondary" size={15} /> Currency
                  </label>
                  <div className="mt-3">
                    <IntegerInput
                      error={`Currency must be a whole number between ${SAVE_INT32_MIN.toLocaleString("en-US")} and ${SAVE_INT32_MAX.toLocaleString("en-US")}.`}
                      id="run-currency"
                      maximum={SAVE_INT32_MAX}
                      minimum={SAVE_INT32_MIN}
                      resetToken={session.working}
                      value={state.currency}
                      onValueChange={(value) => apply(() => setCurrency(session.working, value))}
                    />
                  </div>
                </div>
                <div className="border-t border-line pt-4 sm:col-span-2">
                  <label
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink"
                    htmlFor="run-resume-location"
                  >
                    <MapPinIcon aria-hidden="true" className="text-secondary" size={15} /> Next
                    spawn
                  </label>
                  <select
                    className="mt-3 block min-w-56 max-w-full rounded-sm border border-control bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent"
                    id="run-resume-location"
                    value={resumeValue}
                    onChange={(event) =>
                      apply(() => setResumeLocation(session.working, event.target.value))
                    }
                  >
                    {state.resumeLocation === null ? (
                      <option disabled value={resumeValue}>
                        Unsupported saved value ({state.resumeValue})
                      </option>
                    ) : null}
                    <option value="normal">Normal</option>
                    <option value="shop">Shop / Service Station</option>
                  </select>
                </div>
              </div>
            </section>
          ) : null}
          {rechargeSection(section, { busy, onSessionChange, session })}
        </div>
      </div>
    </section>
  );
}
