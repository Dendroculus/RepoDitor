import { isInteger, LosslessNumber } from "lossless-json";

import { isSaveNumber, isSaveObject, type SaveObject } from "@/features/save-file/serialization";

export const SAVE_INT32_MIN = -2_147_483_648;
export const SAVE_INT32_MAX = 2_147_483_647;
export const DISPLAY_LEVEL_MAX = SAVE_INT32_MAX + 1;

const UPGRADE_PREFIX = "playerUpgrade";
const UPGRADE_LABELS: Readonly<Record<string, string>> = {
  playerUpgradeLaunch: "Tumble Launch",
  playerUpgradeSpeed: "Sprint Speed",
};

export type ResumeLocation = "normal" | "shop";

export const RESUME_LOCATION_LABELS: Readonly<Record<ResumeLocation, string>> = {
  normal: "Normal",
  shop: "Shop / Service Station",
};

export interface RunPlayer {
  readonly health: number;
  readonly id: string;
  readonly name: string;
}

export interface RunUpgrade {
  readonly key: string;
  readonly label: string;
  readonly values: ReadonlyMap<string, number>;
}

export interface RunSaveState {
  readonly currency: number;
  readonly level: number;
  readonly players: readonly RunPlayer[];
  readonly resumeLocation: ResumeLocation | null;
  readonly resumeValue: number;
  readonly upgrades: readonly RunUpgrade[];
}

export class RunEditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunEditError";
  }
}

function typedObject(data: SaveObject, key: string, label: string): SaveObject {
  const entry = Object.hasOwn(data, key) ? data[key] : undefined;
  if (!isSaveObject(entry) || !Object.hasOwn(entry, "value") || !isSaveObject(entry.value)) {
    throw new RunEditError(`${label} is not a supported save dictionary.`);
  }
  return entry.value;
}

function dictionaries(data: SaveObject): SaveObject {
  return typedObject(data, "dictionaryOfDictionaries", "Run data");
}

function runStats(data: SaveObject): SaveObject {
  const values = dictionaries(data);
  const stats = Object.hasOwn(values, "runStats") ? values.runStats : undefined;
  if (!isSaveObject(stats)) {
    throw new RunEditError("Run stats are not a supported save dictionary.");
  }
  return stats;
}

function optionalObject(data: SaveObject, key: string, label: string): SaveObject | null {
  if (!Object.hasOwn(data, key)) {
    return null;
  }
  const value = data[key];
  if (!isSaveObject(value)) {
    throw new RunEditError(`${label} is not a supported save dictionary.`);
  }
  return value;
}

function storedInteger(data: SaveObject, key: string, fallback: number, label: string): number {
  if (!Object.hasOwn(data, key)) {
    return fallback;
  }
  const value = data[key];
  if (!isSaveNumber(value) || !isInteger(value.value)) {
    throw new RunEditError(`${label} is not stored as an integer.`);
  }
  const parsed = Number(value.value);
  if (!Number.isSafeInteger(parsed) || parsed < SAVE_INT32_MIN || parsed > SAVE_INT32_MAX) {
    throw new RunEditError(`${label} is outside the signed Int32 save range.`);
  }
  return parsed;
}

function editableInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new RunEditError(
      `${label} must be a whole number between ${minimum.toLocaleString("en-US")} and ${maximum.toLocaleString("en-US")}.`,
    );
  }
  return value;
}

function writeInteger(
  data: SaveObject,
  key: string,
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): void {
  const next = editableInteger(value, minimum, maximum, label);
  storedInteger(data, key, next, label);
  data[key] = new LosslessNumber(String(next));
}

function playerNames(data: SaveObject): SaveObject {
  return typedObject(data, "playerNames", "Player names");
}

function requirePlayer(data: SaveObject, playerId: string): void {
  const names = playerNames(data);
  if (!Object.hasOwn(names, playerId) || typeof names[playerId] !== "string") {
    throw new RunEditError("The selected player does not exist in this save.");
  }
}

function upgradeLabel(key: string): string {
  const fallback = key
    .slice(UPGRADE_PREFIX.length)
    .replaceAll("_", " ")
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .trim();
  return (UPGRADE_LABELS[key] ?? fallback) || key;
}

function discoveredUpgrades(data: SaveObject): [string, SaveObject][] {
  return Object.entries(dictionaries(data))
    .filter(
      (entry): entry is [string, SaveObject] =>
        entry[0].startsWith(UPGRADE_PREFIX) &&
        entry[0] !== UPGRADE_PREFIX &&
        isSaveObject(entry[1]),
    )
    .sort(([left], [right]) => upgradeLabel(left).localeCompare(upgradeLabel(right)));
}

function resumeLocation(value: number): ResumeLocation | null {
  if (value === 0) {
    return "normal";
  }
  if (value === 1) {
    return "shop";
  }
  return null;
}

export function describeResumeLocation(value: ResumeLocation | null, raw: number): string {
  return value ? RESUME_LOCATION_LABELS[value] : `Unsupported saved value (${raw})`;
}

export function inspectRunSave(data: SaveObject): RunSaveState {
  const names = playerNames(data);
  const savedHealth = optionalObject(dictionaries(data), "playerHealth", "Player health") ?? {};
  const players = Object.entries(names).map(([id, name]) => {
    if (typeof name !== "string") {
      throw new RunEditError(`Player '${id}' does not have a supported name.`);
    }
    return {
      health: storedInteger(savedHealth, id, 0, `Current health for ${name}`),
      id,
      name,
    };
  });
  const upgrades = discoveredUpgrades(data).map(([key, values]) => ({
    key,
    label: upgradeLabel(key),
    values: new Map(
      players.map((player) => [
        player.id,
        storedInteger(values, player.id, 0, `${upgradeLabel(key)} for ${player.name}`),
      ]),
    ),
  }));
  const stats = runStats(data);
  const resumeValue = storedInteger(stats, "save level", 0, "Resume location");
  if (!Object.hasOwn(stats, "level")) {
    throw new RunEditError("Run level is not present in this save.");
  }

  return {
    currency: storedInteger(stats, "currency", 0, "Currency"),
    level: storedInteger(stats, "level", 0, "Run level") + 1,
    players,
    resumeLocation: resumeLocation(resumeValue),
    resumeValue,
    upgrades,
  };
}

export function setPlayerHealth(data: SaveObject, playerId: string, value: unknown): void {
  const next = editableInteger(value, 0, SAVE_INT32_MAX, "Current health");
  requirePlayer(data, playerId);
  const values = dictionaries(data);
  let health = optionalObject(values, "playerHealth", "Player health");
  if (health) {
    storedInteger(health, playerId, next, "Current health");
  } else {
    health = {};
    values.playerHealth = health;
  }
  health[playerId] = new LosslessNumber(String(next));
}

export function setPlayerUpgrade(
  data: SaveObject,
  playerId: string,
  key: string,
  value: unknown,
): void {
  const next = editableInteger(value, 0, SAVE_INT32_MAX, "Upgrade value");
  requirePlayer(data, playerId);
  const values = dictionaries(data);
  const upgrade =
    Object.hasOwn(values, key) &&
    key.startsWith(UPGRADE_PREFIX) &&
    key !== UPGRADE_PREFIX &&
    isSaveObject(values[key])
      ? values[key]
      : null;
  if (!upgrade) {
    throw new RunEditError("This upgrade is not present as a supported field in the save.");
  }
  storedInteger(upgrade, playerId, next, "Upgrade value");
  upgrade[playerId] = new LosslessNumber(String(next));
}

export function setCurrency(data: SaveObject, value: unknown): void {
  writeInteger(runStats(data), "currency", value, SAVE_INT32_MIN, SAVE_INT32_MAX, "Currency");
}

export function setRunLevel(data: SaveObject, value: unknown): void {
  const displayed = editableInteger(value, 1, DISPLAY_LEVEL_MAX, "Run level");
  const stats = runStats(data);
  if (!Object.hasOwn(stats, "level")) {
    throw new RunEditError("Run level is not present in this save.");
  }
  writeInteger(stats, "level", displayed - 1, 0, SAVE_INT32_MAX, "Run level");
}

export function setResumeLocation(data: SaveObject, value: unknown): void {
  if (value !== "normal" && value !== "shop") {
    throw new RunEditError(
      `Resume location must be ${RESUME_LOCATION_LABELS.normal} or ${RESUME_LOCATION_LABELS.shop}.`,
    );
  }
  writeInteger(runStats(data), "save level", value === "normal" ? 0 : 1, 0, 1, "Resume location");
}
