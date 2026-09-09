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

  try {
    const baseline = inspectMetaCosmetics(parseSaveJson(session.baselineSource));
    const working = inspectMetaCosmetics(session.working);
    if (baseline.ownedSupportedCount === working.ownedSupportedCount) {
      return [];
    }
    return [
      {
        after: t("cosmetics.pendingValue", { count: formatNumber(working.ownedSupportedCount) }),
        before: t("cosmetics.pendingValue", {
          count: formatNumber(baseline.ownedSupportedCount),
        }),
        field: t("cosmetics.pendingField"),
        id: "cosmetics:supported-ownership",
        subject: t("cosmetics.title"),
      },
    ];
  } catch {
    return [];
  }
}
