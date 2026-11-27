# z-call

Peer-to-peer video/audio calls with a mesh WebRTC topology. The client is a Vite/React SPA; the whole realtime backend is **one server** (`api/socket-io.js`).

## Architecture

- **One Vercel project, one Function.** `api/socket-io.js` exports an `http.Server` with Socket.IO attached. Vercel's Fluid Compute accepts the WebSocket upgrade directly.
- **WebSocket transport only.** HTTP long-polling does not work on serverless functions, so the client is configured with `transports: ['websocket']` and connects on `/api/socket-io` — the exact path of the one Function.
- **Same origin.** The client connects to the deployment that served it — no hardcoded backend URL, no separate client/server deployments.
- The built SPA is served from `client/dist` by Vercel's CDN, with a catch-all rewrite to `index.html` for `/r/:room_id`.
- No Redis, no adapter, no second server.

## Deploy to Vercel

Import the repo at [vercel.com/new](https://vercel.com/new) (or run `vercel` in this directory). Settings are already in `vercel.json`:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Build Command | `npm --prefix client ci && npm --prefix client run build` |
| Output Directory | `client/dist` |
| Install Command | `npm install` (root) |
| Node.js version | 22 or newer |

Set these environment variables in the Vercel project if needed:

- `VITE_STUN_URL` — default `stun:stun.l.google.com:19302`
- `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` — your own TURN server; public demo TURN servers are unreliable
- `VITE_SERVER_URL` / `VITE_SOCKET_PATH` — only if the socket server is on a different origin/path (`VITE_SOCKET_PATH` defaults to `/api/socket-io`, matching the Function path)
- `CORS_ORIGIN` — only if clients connect from another origin

`maxDuration` for the function is 300s in `vercel.json`. On Pro/Enterprise you can raise it (calls are dropped when a connection reaches the limit; the client reconnects and rejoins automatically).

## Local development

Two terminals from the repo root:

```bash
npm install
npm run server          # socket server on http://localhost:4000
```

```bash
npm --prefix client install
npm run dev:client      # Vite on http://localhost:5173
```

Vite proxies `/api/socket-io` to the local server, so the client uses the same socket path in dev and production. `npm run build` builds the client exactly as Vercel does. `npm start` runs just the socket server. Use this two-terminal flow rather than `vercel dev` for websocket work — some Vercel CLI versions cannot proxy upgrades locally.

## Notes / limitations

- Presence and rooms are held in memory in the single function instance. Vercel may create more than one instance under load or after a deploy, so state is **not** shared across instances. This is intentional ("single server only"); add the Redis adapter if you later need multi-instance consistency.
- `settings.txt` is leftover Render configuration and is not used by the Vercel deployment.
- The app currently has no authentication or message persistence; room IDs are capabilities — treat links as private.
