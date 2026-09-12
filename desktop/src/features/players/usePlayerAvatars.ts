/** Session-scoped avatar loading keyed only by stable player identity. */
import { useCallback, useEffect, useRef, useState } from "react";

interface AvatarAttempt {
  readonly requests: number;
  readonly failedAt: number | null;
}

const AVATAR_RETRY_COOLDOWN_MS = 30_000;
const MAX_AVATAR_REQUESTS = 2;

export function usePlayerAvatars(
  saveId: string,
  selectedPlayerId: string | null,
  initialAvatarUrls: Readonly<Record<string, string | null>> = {},
) {
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string | null>>(() => ({
    ...initialAvatarUrls,
  }));
  const avatarUrlsRef = useRef(avatarUrls);
  const mounted = useRef(false);
  const requests = useRef(new Set<string>());
  const attempts = useRef(new Map<string, AvatarAttempt>());

  const updateAvatar = useCallback((playerId: string, avatarUrl: string | null) => {
    avatarUrlsRef.current = { ...avatarUrlsRef.current, [playerId]: avatarUrl };
    if (mounted.current) setAvatarUrls(avatarUrlsRef.current);
  }, []);

  const markFailure = useCallback(
    (playerId: string) => {
      const attempt = attempts.current.get(playerId);
      attempts.current.set(playerId, {
        requests: Math.max(attempt?.requests ?? 0, 1),
        failedAt: Date.now(),
      });
      updateAvatar(playerId, null);
    },
    [updateAvatar],
  );

  const loadAvatar = useCallback(
    async (playerId: string) => {
      const previous = attempts.current.get(playerId);
      if (
        typeof avatarUrlsRef.current[playerId] === "string" ||
        requests.current.has(playerId) ||
        (previous?.requests ?? 0) >= MAX_AVATAR_REQUESTS ||
        previous?.failedAt === null ||
        (previous?.failedAt !== undefined &&
          Date.now() - previous.failedAt < AVATAR_RETRY_COOLDOWN_MS)
      ) {
        return;
      }
      requests.current.add(playerId);
      attempts.current.set(playerId, {
        requests: (previous?.requests ?? 0) + 1,
        failedAt: null,
      });
      if (mounted.current && previous?.failedAt !== undefined) {
        const next = { ...avatarUrlsRef.current };
        delete next[playerId];
        avatarUrlsRef.current = next;
        setAvatarUrls(next);
      }
      try {
        const result = await window.repoditor.players.avatar(saveId, playerId);
        if (!result.ok || result.data.avatarUrl === null) {
          markFailure(playerId);
        } else {
          updateAvatar(playerId, result.data.avatarUrl);
        }
      } catch {
        markFailure(playerId);
      } finally {
        requests.current.delete(playerId);
      }
    },
    [markFailure, saveId, updateAvatar],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (selectedPlayerId !== null && avatarUrls[selectedPlayerId] === undefined) {
      void loadAvatar(selectedPlayerId);
    }
  }, [avatarUrls, loadAvatar, selectedPlayerId]);

  return {
    avatarUrls,
    loadAvatar,
    rejectAvatar: markFailure,
  };
}
