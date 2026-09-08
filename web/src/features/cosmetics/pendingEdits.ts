import { inspectMetaCosmetics } from "@/features/cosmetics/cosmetics";
import type { PendingEdit } from "@/features/save-file/pendingEdits";
import type { EditSession } from "@/features/save-file/session";
import { parseSaveJson } from "@/features/save-file/serialization";

export function getCosmeticPendingEdits(session: EditSession): PendingEdit[] {
  if (session.originalKind !== "meta") {
    return [];
  }

  try {
    const baseline = inspectMetaCosmetics(parseSaveJson(session.baselineSource));
    const working = inspectMetaCosmetics(session.working);
    if (baseline.ownedSupportedCount === working.ownedSupportedCount) {
      return [];
    }
    return [
      {
        after: `${working.ownedSupportedCount} unlocked`,
        before: `${baseline.ownedSupportedCount} unlocked`,
        field: "Supported cosmetics",
        id: "cosmetics:supported-ownership",
        subject: "Cosmetics",
      },
    ];
  } catch {
    return [];
  }
}
