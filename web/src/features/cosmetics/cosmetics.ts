import { isInteger, LosslessNumber } from "lossless-json";

import snapshot from "@/features/cosmetics/known-cosmetics.v1.json";
import { classifySave } from "@/features/save-file/classification";
import { isSaveNumber, isSaveObject, type SaveObject } from "@/features/save-file/serialization";

export const KNOWN_COSMETIC_IDS: readonly number[] = Object.freeze([...snapshot.cosmeticIds]);

const KNOWN_COSMETIC_LEXEMES = new Set(KNOWN_COSMETIC_IDS.map(String));

export const COSMETIC_SNAPSHOT = Object.freeze({
  evidenceSha256: snapshot.evidenceSha256,
  gameCompatibility: snapshot.gameCompatibility,
  provenance: snapshot.provenance,
  snapshotVersion: snapshot.snapshotVersion,
});

export interface MetaCosmeticsState {
  readonly ownedSupportedCount: number;
  readonly remainingSupportedCount: number;
  readonly totalSupportedCount: number;
}

export class CosmeticEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmeticEditError";
  }
}

function ownershipList(data: SaveObject, key: string): LosslessNumber[] {
  const entry = Object.hasOwn(data, key) ? data[key] : undefined;
  const value = isSaveObject(entry) && Object.hasOwn(entry, "value") ? entry.value : undefined;
  if (
    !Array.isArray(value) ||
    !value.every((item) => isSaveNumber(item) && isInteger(item.value))
  ) {
    throw new CosmeticEditError(`'${key}.value' must contain only integer cosmetic IDs.`);
  }
  return value;
}

function requireSupportedMetaSave(data: SaveObject): {
  readonly history: LosslessNumber[];
  readonly unlocks: LosslessNumber[];
} {
  if (classifySave(data) !== "meta") {
    throw new CosmeticEditError("Cosmetics editing requires a supported MetaSave.");
  }
  return {
    history: ownershipList(data, "cosmeticHistory"),
    unlocks: ownershipList(data, "cosmeticUnlocks"),
  };
}

function ownedSupportedLexemes(unlocks: readonly LosslessNumber[]): Set<string> {
  return new Set(
    unlocks.map((item) => item.value).filter((value) => KNOWN_COSMETIC_LEXEMES.has(value)),
  );
}

export function inspectMetaCosmetics(data: SaveObject): MetaCosmeticsState {
  const { unlocks } = requireSupportedMetaSave(data);
  const ownedSupportedCount = ownedSupportedLexemes(unlocks).size;
  const totalSupportedCount = KNOWN_COSMETIC_IDS.length;
  return {
    ownedSupportedCount,
    remainingSupportedCount: totalSupportedCount - ownedSupportedCount,
    totalSupportedCount,
  };
}

export function unlockRemainingCosmetics(data: SaveObject): boolean {
  const { history, unlocks } = requireSupportedMetaSave(data);
  const owned = ownedSupportedLexemes(unlocks);
  const historyIds = new Set(history.map((item) => item.value));
  const missing = KNOWN_COSMETIC_IDS.filter((id) => !owned.has(String(id)));
  if (missing.length === 0) {
    return false;
  }

  for (const id of missing) {
    const value = String(id);
    if (!historyIds.has(value)) {
      history.push(new LosslessNumber(value));
      historyIds.add(value);
    }
    unlocks.push(new LosslessNumber(value));
  }
  return true;
}
