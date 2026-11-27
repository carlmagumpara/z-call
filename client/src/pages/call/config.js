// Public STUN works for most networks; supply VITE_TURN_* for restrictive NATs.
// Public "free TURN" credentials found in old demos are unreliable — use your own.
const splitUrls = (value) =>
  value ? value.split(',').map((url) => url.trim()).filter(Boolean) : [];

const stunUrls = splitUrls(import.meta.env.VITE_STUN_URL || 'stun:stun.l.google.com:19302');
const turnUrls = splitUrls(import.meta.env.VITE_TURN_URL);

const iceServers = [{ urls: stunUrls }];

if (turnUrls.length) {
  iceServers.push({
    urls: turnUrls,
    username: import.meta.env.VITE_TURN_USERNAME || '',
    credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
  });
}

export const iceConfig = { iceServers };
