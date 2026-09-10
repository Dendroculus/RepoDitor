import { DOMParser, onWarningStopParsing } from "@xmldom/xmldom";

const RESPONSE_SIZE_LIMIT_MESSAGE = "Response exceeded its size limit.";

const STEAM_ID64_MIN = 76_561_197_960_265_728n;
const STEAM_ID64_MAX = STEAM_ID64_MIN + 2n ** 32n - 1n;
const STEAM_AVATAR_HOSTS = new Set([
  "avatars.akamai.steamstatic.com",
  "avatars.fastly.steamstatic.com",
]);
const MAX_STEAM_IDS = 16;
export const MAX_AVATAR_REQUEST_BYTES = 2 * 1024;
const MAX_PROFILE_BYTES = 256 * 1024;
const STEAM_REQUEST_TIMEOUT_MS = 1_500;

type AvatarUrls = Readonly<Record<string, string>>;

class AvatarRequestError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlausibleSteamId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{17}$/u.test(value) &&
    BigInt(value) >= STEAM_ID64_MIN &&
    BigInt(value) <= STEAM_ID64_MAX
  );
}

function parseSteamIds(value: unknown): string[] {
  if (!isRecord(value) || !Object.hasOwn(value, "steamIds") || !Array.isArray(value.steamIds)) {
    throw new AvatarRequestError("A steamIds array is required.");
  }
  if (value.steamIds.length > MAX_STEAM_IDS) {
    throw new AvatarRequestError(`At most ${MAX_STEAM_IDS} Steam IDs may be requested.`);
  }
  return [...new Set(value.steamIds.filter(isPlausibleSteamId))];
}

function profileUrl(playerId: string): string {
  return `https://steamcommunity.com/profiles/${playerId}/?xml=1`;
}

function isExpectedProfileResponse(rawUrl: string, playerId: string): boolean {
  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === "https:" &&
      url.hostname === "steamcommunity.com" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      url.pathname === `/profiles/${playerId}/` &&
      url.searchParams.size === 1 &&
      url.searchParams.get("xml") === "1"
    );
  } catch {
    return false;
  }
}

function safeAvatarUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      !STEAM_AVATAR_HOSTS.has(url.hostname) ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443")
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function avatarFromProfile(xml: string): string | null {
  if (xml.includes("<!DOCTYPE")) {
    return null;
  }
  const document = new DOMParser({ locator: false, onError: onWarningStopParsing }).parseFromString(
    xml,
    "text/xml",
  );
  const root = document.documentElement;
  const avatars = root
    ? Array.from(root.childNodes).filter(
        ({ nodeName, nodeType }) => nodeType === 1 && nodeName === "avatarMedium",
      )
    : [];
  const avatar = avatars[0];
  const textOnly = avatar
    ? Array.from(avatar.childNodes).every(({ nodeType }) => nodeType === 3 || nodeType === 4)
    : false;
  return document.doctype ||
    root?.nodeName !== "profile" ||
    avatars.length !== 1 ||
    !avatar ||
    !textOnly
    ? null
    : safeAvatarUrl(avatar.textContent?.trim() ?? "");
}

async function readBoundedText(source: Request | Response, maximumBytes: number): Promise<string> {
  const declaredLength = Number(source.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new AvatarRequestError(RESPONSE_SIZE_LIMIT_MESSAGE);
  }
  if (!source.body) {
    return "";
  }

  const reader = source.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";
  while (true) {
    const result = await reader.read();
    if (result.done) {
      return text + decoder.decode();
    }
    bytesRead += result.value.byteLength;
    if (bytesRead > maximumBytes) {
      await reader.cancel();
      throw new AvatarRequestError(RESPONSE_SIZE_LIMIT_MESSAGE);
    }
    text += decoder.decode(result.value, { stream: true });
  }
}

async function resolveOneAvatar(
  playerId: string,
  fetchProfile: typeof fetch,
): Promise<string | null> {
  try {
    const response = await fetchProfile(profileUrl(playerId), {
      headers: { Accept: "application/xml", "User-Agent": "RepoDitor-Web/0.1" },
      redirect: "error",
      signal: AbortSignal.timeout(STEAM_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok || !isExpectedProfileResponse(response.url, playerId)) {
      return null;
    }
    return avatarFromProfile(await readBoundedText(response, MAX_PROFILE_BYTES));
  } catch {
    return null;
  }
}

async function resolveAvatars(
  playerIds: readonly string[],
  fetchProfile: typeof fetch,
): Promise<AvatarUrls> {
  const resolved = await Promise.all(
    playerIds.map(
      async (playerId) => [playerId, await resolveOneAvatar(playerId, fetchProfile)] as const,
    ),
  );
  return Object.fromEntries(
    resolved.filter((entry): entry is readonly [string, string] => entry[1] !== null),
  );
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function handleSteamAvatarRequest(
  request: Request,
  fetchProfile: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }
  if (request.headers.get("content-type")?.split(";", 1)[0]?.trim() !== "application/json") {
    return json({ error: "Expected application/json." }, 415);
  }

  try {
    const body = JSON.parse(await readBoundedText(request, MAX_AVATAR_REQUEST_BYTES)) as unknown;
    const steamIds = parseSteamIds(body);
    return json({ avatars: await resolveAvatars(steamIds, fetchProfile) });
  } catch (error) {
    if (error instanceof AvatarRequestError || error instanceof SyntaxError) {
      return json({ error: "Invalid avatar request." }, 400);
    }
    return json({ avatars: {} });
  }
}

export default { fetch: handleSteamAvatarRequest };
