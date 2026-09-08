// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { handleSteamAvatarRequest } from "./steam-avatars";

const FIRST_ID = "76561197960287930";
const SECOND_ID = "76561198000000001";
const FIRST_PROFILE = `https://steamcommunity.com/profiles/${FIRST_ID}/?xml=1`;
const AVATAR = "https://avatars.fastly.steamstatic.com/avatar.jpg";
const CLEAR_TEXT_AVATAR = ["http", "://avatars.fastly.steamstatic.com/avatar.jpg"].join("");

function request(steamIds: unknown): Request {
  return new Request("http://localhost/api/steam-avatars", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ steamIds }),
  });
}

function steamResponse(body: string, url = FIRST_PROFILE, status = 200): Response {
  const response = new Response(body, { status });
  Object.defineProperty(response, "url", { value: url });
  return response;
}

function profile(avatar = AVATAR): string {
  return `<profile><avatarMedium><![CDATA[${avatar}]]></avatarMedium></profile>`;
}

async function avatars(response: Response): Promise<Record<string, string>> {
  return ((await response.json()) as { avatars: Record<string, string> }).avatars;
}

describe("Steam avatar serverless endpoint", () => {
  it("accepts valid IDs, deduplicates them, and constructs the fixed Steam destination", async () => {
    const fetchProfile = vi.fn<typeof fetch>().mockResolvedValue(steamResponse(profile()));
    const response = await handleSteamAvatarRequest(
      request([FIRST_ID, FIRST_ID, "https://example.com", "111"]),
      fetchProfile,
    );

    expect(response.status).toBe(200);
    expect(await avatars(response)).toEqual({ [FIRST_ID]: AVATAR });
    expect(fetchProfile).toHaveBeenCalledOnce();
    const [url, options] = fetchProfile.mock.calls[0]!;
    expect(url).toBe(FIRST_PROFILE);
    expect(options).toMatchObject({ redirect: "error" });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects an oversized ID batch before making requests", async () => {
    const fetchProfile = vi.fn<typeof fetch>();
    const ids = Array.from({ length: 17 }, (_, index) =>
      (76_561_197_960_265_728n + BigInt(index)).toString(),
    );
    const response = await handleSteamAvatarRequest(request(ids), fetchProfile);

    expect(response.status).toBe(400);
    expect(fetchProfile).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed XML", "<profile><avatarMedium>broken"],
    ["missing avatar", "<profile />"],
    [
      "avatar outside the expected profile location",
      `<profile><nested>${profile()}</nested></profile>`,
    ],
    [
      "DOCTYPE/entity input",
      '<!DOCTYPE profile [<!ENTITY avatar "https://avatars.fastly.steamstatic.com/avatar.jpg">]><profile><avatarMedium>&avatar;</avatarMedium></profile>',
    ],
    ["unsafe scheme", profile(CLEAR_TEXT_AVATAR)],
    ["unsafe host", profile("https://example.com/avatar.jpg")],
    ["credentials", profile("https://user@avatars.fastly.steamstatic.com/avatar.jpg")],
    ["unexpected port", profile("https://avatars.fastly.steamstatic.com:444/avatar.jpg")],
  ])("fails soft for %s", async (_label, body) => {
    const fetchProfile = vi.fn<typeof fetch>().mockResolvedValue(steamResponse(body));
    expect(
      await avatars(await handleSteamAvatarRequest(request([FIRST_ID]), fetchProfile)),
    ).toEqual({});
  });

  it("fails soft for Steam non-2xx, redirects, oversized XML, and timeouts", async () => {
    const cases: Array<ReturnType<typeof vi.fn<typeof fetch>>> = [
      vi.fn<typeof fetch>().mockResolvedValue(steamResponse("unavailable", FIRST_PROFILE, 503)),
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(steamResponse(profile(), "https://example.com/redirect")),
      vi.fn<typeof fetch>().mockResolvedValue(steamResponse(profile() + "x".repeat(256 * 1024))),
      vi.fn<typeof fetch>(
        (_input, options) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), {
              once: true,
            });
          }),
      ),
    ];

    for (const fetchProfile of cases) {
      expect(
        await avatars(await handleSteamAvatarRequest(request([FIRST_ID]), fetchProfile)),
      ).toEqual({});
    }
  });

  it("keeps player failures independent", async () => {
    const fetchProfile = vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes(FIRST_ID)) {
        throw new TypeError("unavailable");
      }
      return steamResponse(
        profile("https://avatars.akamai.steamstatic.com/second.jpg"),
        `https://steamcommunity.com/profiles/${SECOND_ID}/?xml=1`,
      );
    });

    expect(
      await avatars(await handleSteamAvatarRequest(request([FIRST_ID, SECOND_ID]), fetchProfile)),
    ).toEqual({ [SECOND_ID]: "https://avatars.akamai.steamstatic.com/second.jpg" });
    expect(fetchProfile).toHaveBeenCalledTimes(2);
  });
});
