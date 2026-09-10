import { resolveLocalizedMessage, type Translate } from "@/app/i18n/catalog";
import { inspectMetaCosmetics } from "@/features/cosmetics/cosmetics";
import type { PendingEdit } from "@/features/save-file/pendingEdits";
import type { EditSession } from "@/features/save-file/session";
import { parseSaveJson } from "@/features/save-file/serialization";

export function getCosmeticPendingEdits(
  session: EditSession,
  t: Translate = (key, values, count) => resolveLocalizedMessage("en", key, values, count),
  formatNumber: (value: number) => string = String,
): PendingEdit[] {
  if (session.originalKind !== "meta") {
    return [];
  }

  const pendingValue = (count: number) =>
    t("cosmetics.pendingValue", { count: formatNumber(count) });

  try {
    const baseline = inspectMetaCosmetics(parseSaveJson(session.baselineSource));
    const working = inspectMetaCosmetics(session.working);
    if (baseline.ownedSupportedCount === working.ownedSupportedCount) {
      return [];
    }
    return [
      {
        after: pendingValue(working.ownedSupportedCount),
        before: pendingValue(baseline.ownedSupportedCount),
        field: t("cosmetics.pendingField"),
        id: "cosmetics:supported-ownership",
        subject: t("cosmetics.title"),
      },
    ];
  } catch {
    return [];
  }
}
