import { isInteger } from "lossless-json";

import { decryptEs3, encryptEs3, Es3CryptoError } from "@/features/save-file/es3";
import {
  isSaveObject,
  isSaveNumber,
  parseSaveJson,
  SaveSerializationError,
  serializeSaveJson,
  type SaveObject,
} from "@/features/save-file/serialization";

const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

export type SaveKind = "run" | "meta";
export type SaveClassification = SaveKind | "unsupported";

export interface LoadedSave {
  readonly data: SaveObject;
  readonly fileName: string;
  readonly kind: SaveKind;
}

export class SavePipelineError extends Error {
  readonly code: "unsupported-file" | "decrypt-failed" | "malformed-save" | "unsupported-save";

  constructor(
    code: "unsupported-file" | "decrypt-failed" | "malformed-save" | "unsupported-save",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "SavePipelineError";
  }
}

export interface LocalSaveFile {
  readonly name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

function typedValue(data: SaveObject, key: string): unknown {
  const entry = Object.hasOwn(data, key) ? data[key] : undefined;
  return isSaveObject(entry) && Object.hasOwn(entry, "value") ? entry.value : undefined;
}

function isRunSave(data: SaveObject): boolean {
  const players = typedValue(data, "playerNames");
  const dictionaries = typedValue(data, "dictionaryOfDictionaries");
  const runStats =
    isSaveObject(dictionaries) && Object.hasOwn(dictionaries, "runStats")
      ? dictionaries.runStats
      : undefined;
  return isSaveObject(players) && isSaveObject(runStats);
}

function isIntegerValue(value: unknown): boolean {
  return isSaveNumber(value) && isInteger(value.value);
}

function hasIntegerList(data: SaveObject, key: string): boolean {
  const value = typedValue(data, key);
  return Array.isArray(value) && value.every(isIntegerValue);
}

function isMetaSave(data: SaveObject): boolean {
  return (
    hasIntegerList(data, "cosmeticHistory") &&
    hasIntegerList(data, "cosmeticUnlocks") &&
    Array.isArray(typedValue(data, "cosmeticPresets"))
  );
}

export function classifySave(data: SaveObject): SaveClassification {
  const run = isRunSave(data);
  const meta = isMetaSave(data);
  if (run === meta) {
    return "unsupported";
  }
  if (run) {
    return "run";
  }
  return "meta";
}

export async function loadSaveBytes(bytes: Uint8Array, fileName: string): Promise<LoadedSave> {
  let plaintext: Uint8Array;
  try {
    plaintext = await decryptEs3(bytes);
  } catch (error) {
    if (error instanceof Es3CryptoError && error.code === "invalid-container") {
      throw new SavePipelineError("unsupported-file", error.message);
    }
    throw new SavePipelineError(
      "decrypt-failed",
      "This save could not be decrypted. It may be corrupted or unsupported.",
    );
  }

  let data: SaveObject;
  try {
    data = parseSaveJson(decoder.decode(plaintext));
  } catch (error) {
    if (error instanceof SaveSerializationError) {
      throw new SavePipelineError("malformed-save", error.message);
    }
    if (error instanceof TypeError) {
      throw new SavePipelineError(
        "malformed-save",
        "The file decrypted, but its save structure is malformed.",
      );
    }
    throw error;
  }

  const kind = classifySave(data);
  if (kind === "unsupported") {
    throw new SavePipelineError(
      "unsupported-save",
      "This is valid save data, but its save type is not supported yet.",
    );
  }

  return { data, fileName, kind };
}

export async function loadSaveFile(file: LocalSaveFile): Promise<LoadedSave> {
  if (!file.name.toLowerCase().endsWith(".es3")) {
    throw new SavePipelineError("unsupported-file", "Choose a R.E.P.O. .es3 save file.");
  }
  return loadSaveBytes(new Uint8Array(await file.arrayBuffer()), file.name);
}

export async function reencryptSave(save: LoadedSave): Promise<Uint8Array<ArrayBuffer>> {
  return encryptEs3(encoder.encode(serializeSaveJson(save.data)));
}
