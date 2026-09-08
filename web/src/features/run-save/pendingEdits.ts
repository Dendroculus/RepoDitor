import type { PendingEdit } from "@/features/save-file/pendingEdits";
import type { EditSession } from "@/features/save-file/session";
import { parseSaveJson } from "@/features/save-file/serialization";
import { inspectRunSave, type ResumeLocation } from "@/features/run-save/runSave";

function resumeLabel(value: ResumeLocation | null, raw: number): string {
  if (value === "normal") {
    return "Normal";
  }
  if (value === "shop") {
    return "Shop / Service Station";
  }
  return `Unsupported saved value (${raw})`;
}

function getUpgradeEdits(
  baseline: ReturnType<typeof inspectRunSave>,
  working: ReturnType<typeof inspectRunSave>,
): PendingEdit[] {
  const edits: PendingEdit[] = [];
  const baselineUpgrades = new Map(baseline.upgrades.map((upgrade) => [upgrade.key, upgrade]));
  for (const upgrade of working.upgrades) {
    const baselineUpgrade = baselineUpgrades.get(upgrade.key);
    if (!baselineUpgrade) {
      continue;
    }
    for (const player of working.players) {
      const before = baselineUpgrade.values.get(player.id) ?? 0;
      const after = upgrade.values.get(player.id) ?? 0;
      if (before !== after) {
        edits.push({
          after,
          before,
          field: upgrade.label,
          id: `upgrade:${player.id}:${upgrade.key}`,
          subject: player.name,
        });
      }
    }
  }
  return edits;
}

export function getRunPendingEdits(session: EditSession): PendingEdit[] {
  if (session.originalKind !== "run") {
    return [];
  }

  const baseline = inspectRunSave(parseSaveJson(session.baselineSource));
  const working = inspectRunSave(session.working);
  const edits: PendingEdit[] = [];
  const baselinePlayers = new Map(baseline.players.map((player) => [player.id, player]));

  for (const player of working.players) {
    const before = baselinePlayers.get(player.id)?.health;
    if (before !== undefined && before !== player.health) {
      edits.push({
        after: player.health,
        before,
        field: "Current health",
        id: `player:${player.id}:health`,
        subject: player.name,
      });
    }
  }

  edits.push(...getUpgradeEdits(baseline, working));

  if (baseline.level !== working.level) {
    edits.push({
      after: working.level,
      before: baseline.level,
      field: "Run level",
      id: "run:level",
      subject: "Run",
    });
  }
  if (baseline.currency !== working.currency) {
    edits.push({
      after: working.currency,
      before: baseline.currency,
      field: "Currency",
      id: "run:currency",
      subject: "Run",
    });
  }

  const beforeResume = resumeLabel(baseline.resumeLocation, baseline.resumeValue);
  const afterResume = resumeLabel(working.resumeLocation, working.resumeValue);
  if (beforeResume !== afterResume) {
    edits.push({
      after: afterResume,
      before: beforeResume,
      field: "Next spawn",
      id: "run:resume-location",
      subject: "Run",
    });
  }

  return edits;
}
