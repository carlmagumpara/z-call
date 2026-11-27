// Everything is served from one origin (the Vercel deployment). VITE_SERVER_URL
// is only needed when the API lives on a different host.
export const base_url = import.meta.env.VITE_SERVER_URL || window.location.origin;

// The single Socket.IO server is a Vercel Function. In dev, Vite proxies this
// path to the local server on PORT (4000).
export const socket_path = import.meta.env.VITE_SOCKET_PATH || '/api/socket-io';

export const api_url = `${base_url}/api`;
