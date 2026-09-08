export const WINDOWS_RUN_PATH = "%USERPROFILE%\\AppData\\LocalLow\\semiwork\\Repo\\saves";
export const WINDOWS_META_PATH = "%USERPROFILE%\\AppData\\LocalLow\\semiwork\\Repo";
export const PROTON_REPO_SUFFIX =
  "steamapps/compatdata/3241660/pfx/drive_c/users/steamuser/AppData/LocalLow/semiwork/Repo";

export type GuidancePlatform = "windows" | "linux";

export function detectInitialGuidancePlatform(
  userAgent = globalThis.navigator?.userAgent ?? "",
): GuidancePlatform {
  const normalized = userAgent.toLowerCase();
  return normalized.includes("linux") && !normalized.includes("android") ? "linux" : "windows";
}
