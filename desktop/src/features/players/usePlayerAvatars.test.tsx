import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RepoDitorApi } from "@electron/contracts";
import { usePlayerAvatars } from "./usePlayerAvatars";

const saveId = "REPO_SAVE_2026_08_08_10_20_30";
const alpha = "76561197960287930";
const beta = "76561198000000001";

function installBridge(avatar: RepoDitorApi["players"]["avatar"]): void {
  Object.defineProperty(window, "repoditor", {
    configurable: true,
    value: { players: { avatar } },
  });
}

describe("usePlayerAvatars", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("fetches by stable identity once and reuses cached URLs across replacements and switches", async () => {
    const avatar = vi.fn((_saveId: string, playerId: string) =>
      Promise.resolve({
        ok: true as const,
        data: { playerId, avatarUrl: `https://avatars.fastly.steamstatic.com/${playerId}.jpg` },
      }),
    );
    installBridge(avatar);
    const { result, rerender } = renderHook(
      ({ selectedPlayerId }) => usePlayerAvatars(saveId, selectedPlayerId),
      { initialProps: { selectedPlayerId: alpha } },
    );

    await waitFor(() => expect(result.current.avatarUrls[alpha]).toContain(alpha));
    expect(avatar).toHaveBeenCalledTimes(1);

    rerender({ selectedPlayerId: alpha });
    expect(avatar).toHaveBeenCalledTimes(1);

    rerender({ selectedPlayerId: beta });
    await waitFor(() => expect(result.current.avatarUrls[beta]).toContain(beta));
    expect(avatar).toHaveBeenCalledTimes(2);

    rerender({ selectedPlayerId: alpha });
    expect(avatar).toHaveBeenCalledTimes(2);
  });

  it("reuses a preloaded URL and permits one source refresh after an image failure", async () => {
    let now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const initialUrl = "https://avatars.fastly.steamstatic.com/original.jpg";
    const refreshedUrl = "https://avatars.fastly.steamstatic.com/refreshed.jpg";
    const avatar = vi.fn().mockResolvedValue({
      ok: true,
      data: { playerId: alpha, avatarUrl: refreshedUrl },
    });
    installBridge(avatar);
    const { result } = renderHook(() => usePlayerAvatars(saveId, alpha, { [alpha]: initialUrl }));

    expect(result.current.avatarUrls[alpha]).toBe(initialUrl);
    expect(avatar).not.toHaveBeenCalled();

    act(() => result.current.rejectAvatar(alpha));
    expect(result.current.avatarUrls[alpha]).toBeNull();
    await act(async () => result.current.loadAvatar(alpha));
    expect(avatar).not.toHaveBeenCalled();

    now += 30_000;
    await act(async () => result.current.loadAvatar(alpha));
    await waitFor(() => expect(result.current.avatarUrls[alpha]).toBe(refreshedUrl));
    expect(avatar).toHaveBeenCalledTimes(1);
  });
});
