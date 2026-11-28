# z-call

Peer-to-peer video/audio calls with a mesh WebRTC topology. The client is a Vite/React SPA; the whole realtime backend is **one server** (`api/socket-io.js`).

## Architecture

- **One Vercel project, one Function.** `api/socket-io.js` exports an `http.Server` with Socket.IO attached. Vercel's Fluid Compute accepts the WebSocket upgrade directly.
- **WebSocket transport only.** HTTP long-polling does not work on serverless functions, so the client is configured with `transports: ['websocket']` and connects on `/api/socket-io` — the exact path of the one Function.
- **Same origin.** The client connects to the deployment that served it — no hardcoded backend URL, no separate client/server deployments.
- The built SPA is served from `client/dist` by Vercel's CDN, with a catch-all rewrite to `index.html` for SPA routes such as `/r/:room_id` and `/chat`.
- No Redis, no adapter, no second server.
- The server calls `listen()` only when not running on Vercel (`process.env.VERCEL`); on Vercel the exported server is driven directly by the platform. Calling `listen()` there breaks upgrades.

## Chat (ephemeral, one-to-one)

Two entry points, one implementation:

- `/chat` — full-page messaging with a connected-user sidebar.
- The **Chat** button in a call header — the same UI as a slide-over drawer.

Both use the existing shared Socket.IO connection and the generated `user_id` / `username` from the presence context (there is no separate login system). Messages are relayed to the two participants' in-memory user rooms and held **only in React state**. There is no database, no history endpoint, no `localStorage` copy, and no offline queue: refresh, navigating away, or ending the conversation discards everything. A message to an offline user is dropped, never queued. Presence and active conversations likewise exist only in the server's memory and are re-registered on reconnect.

### Events

| Event | Direction | Payload | Purpose |
| --- | --- | --- | --- |
| `user_online` | client → server | `{ user_id, username }` | Register identity (existing presence event) |
| `users:list` | both | request → `[{ user_id, username, socket_id }]` | Request / receive connected users |
| `presence:update` | server → client | `{ user_id, username, online }` | Online/offline changes |
| `conversation:join` | both | `{ peer_id }` → `{ conversation_id, peer }` | Open a 1:1 conversation |
| `conversation:leave` | client → server | `{ peer_id }` | End the active conversation |
| `message:send` | client → server | `{ to, text }` | Send a live message |
| `message:new` | server → client | `{ id, conversation_id, from, to, text, created_at }` | Deliver only to the two participants |
| `typing:start`, `typing:stop` | both | `{ to }` → `{ from, conversation_id }` | Typing state |

The server derives the sender from the registered socket, never from a client-supplied `from` field, validates/rejects malformed ids and empty or oversized messages (4000 char limit), and drops any message whose recipient is not online. All listeners are removed and conversation rooms left on unmount, so there is one socket per client session and no retained state after it ends.

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

To try chat, open `http://localhost:5173/chat` in two different browser profiles (or one normal and one incognito window) — each gets its own generated identity. Pick each other in the sidebar and send messages; reload either tab to confirm nothing is restored. The same UI is available from the **Chat** button inside a call.

No extra environment variables or scripts are required for chat: it shares the existing socket path and the single Function. `VITE_SERVER_URL` / `VITE_SOCKET_PATH` / `CORS_ORIGIN` from the table above still apply if you split the deployment.

## Notes / limitations

- Presence and rooms are held in memory in the single function instance. Vercel may create more than one instance under load or after a deploy, so state is **not** shared across instances. This is intentional ("single server only"); add the Redis adapter if you later need multi-instance consistency.
- `settings.txt` is leftover Render configuration and is not used by the Vercel deployment.
- There is no authentication or message persistence. Room IDs are capabilities — treat links as private. The chat identity is a generated id/name kept in browser storage only for the session; messages themselves are never stored anywhere.
- Because chat state is per server instance, two clients connected to different Vercel instances will not see each other. This is intentional for the single-server design; a Redis adapter would be needed for multi-instance presence.
