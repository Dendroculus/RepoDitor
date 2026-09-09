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

## Privacy and browser storage

Save contents are processed locally and are not persisted by RepoDitor Web. Loaded sessions live
only in memory and clear on refresh. Save bytes, decrypted JSON, staged edits, and exported content
are never written to localStorage, sessionStorage, or IndexedDB. The only persisted browser value is
the optional `repoditor-theme` UI preference.

The editor makes no save-related network request. Optional Steam avatar enrichment is isolated from
save processing and sends only validated SteamID64 values to the same-origin endpoint described
above.

## Quality gates

```powershell
npm run imports:check
npm run format:check
npm run lint
npm test
npm run build
npm run test:e2e
npm run lighthouse
```

Playwright uses committed synthetic encrypted fixtures. Lighthouse runs five Desktop and five Mobile
audits against the production preview, enforcing a 95 performance mean, 90 per-run performance floor,
and 100 for accessibility, Best Practices, and SEO.

## Production hardening

`vercel.json` applies the production CSP and browser security headers. The static HTML includes a
matching CSP baseline and pre-paint theme bootstrap. Production source maps are disabled. The 16 MiB
save-size limit is enforced before file reads when browser metadata is available and again on the
byte buffer.

A minimal permissive `robots.txt` keeps the static baseline valid. No canonical URL is included
until the production hostname is confirmed; that value must not be guessed.
