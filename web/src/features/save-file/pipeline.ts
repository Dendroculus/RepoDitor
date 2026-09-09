import { decryptEs3, encryptEs3, Es3CryptoError } from "@/features/save-file/es3";
import { classifySave, type SaveKind } from "@/features/save-file/classification";
import {
  parseSaveJson,
  SaveSerializationError,
  serializeSaveJson,
  type SaveObject,
} from "@/features/save-file/serialization";

const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();
export const MAX_SAVE_FILE_BYTES = 16 * 1024 * 1024;

export { classifySave } from "@/features/save-file/classification";
export type { SaveClassification, SaveKind } from "@/features/save-file/classification";

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
  readonly size?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function loadSaveBytes(bytes: Uint8Array, fileName: string): Promise<LoadedSave> {
  if (bytes.byteLength > MAX_SAVE_FILE_BYTES) {
    throw new SavePipelineError(
      "unsupported-file",
      "This save is larger than the 16 MiB browser safety limit.",
    );
  }
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
  if (file.size !== undefined && file.size > MAX_SAVE_FILE_BYTES) {
    throw new SavePipelineError(
      "unsupported-file",
      "This save is larger than the 16 MiB browser safety limit.",
    );
  }
  return loadSaveBytes(new Uint8Array(await file.arrayBuffer()), file.name);
}

export async function reencryptSave(save: LoadedSave): Promise<Uint8Array<ArrayBuffer>> {
  return encryptEs3(encoder.encode(serializeSaveJson(save.data)));
}
