import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { PreferencesProvider } from "@/app/PreferencesProvider";
import { usePlayers } from "./usePlayers";

const saveId = "REPO_SAVE_2026_08_08_10_20_30";
const player = { id: "111", name: "Alpha", health: 80, maxHealth: 100 };

function wrapper({ children }: { readonly children: ReactNode }) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}

describe("usePlayers health edits", () => {
  it("keeps every pending health value within the player bounds", () => {
    const { result } = renderHook(() => usePlayers(saveId, { ok: true, data: [player] }), {
      wrapper,
    });

    act(() => result.current.updateHealth(player, 101));
    expect(result.current.pendingByPlayer[player.id]?.after).toBe(100);

    act(() => result.current.updateHealth(player, -1));
    expect(result.current.pendingByPlayer[player.id]?.after).toBe(0);

    act(() => result.current.updateHealth(player, Number.NaN));
    expect(result.current.pendingByPlayer[player.id]?.after).toBe(0);

    act(() => result.current.updateHealth(player, player.health));
    expect(result.current.pendingByPlayer[player.id]).toBeUndefined();
  });
});
