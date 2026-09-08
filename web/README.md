# RepoDitor Web

RepoDitor Web is independently installable from this directory. Save selection, ES3 decryption,
validation, editing, re-encryption, and export run in the browser. Save files, encrypted bytes,
decrypted JSON, run values, and unknown fields are never sent to the avatar endpoint.

Player avatars are optional presentation enrichment. For a valid Run save, the browser sends one
same-origin `POST /api/steam-avatars` request containing only:

```json
{ "steamIds": ["7656119…"] }
```

The Vercel-compatible function in `api/steam-avatars.ts` validates and deduplicates at most 16
SteamID64 values, fetches fixed Steam Community profile URLs server-to-server, and returns only
allowlisted HTTPS Steam CDN avatar URLs. Results remain in memory. Endpoint or image failures keep
the initials fallback and never block editing or export.

## Development

```powershell
npm ci
npm run dev
```

The Vite development and preview servers expose the same local `/api/steam-avatars` handler used by
the serverless function, so no separate local backend process is required.

## Deployment requirement

Use `web/` as the Vercel project root. The Vite application remains a static client build and
`api/steam-avatars.ts` is its only serverless function. A different static host remains usable for
all editor features, but automatic avatars require an equivalent same-origin function with the same
contract and protections. Phase 7 deployment hardening must verify this route and must not introduce
server-side save processing.
