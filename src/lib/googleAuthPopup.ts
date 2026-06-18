export const GOOGLE_POPUP_NAME = 'FlorivaGoogleLogin';
export const GOOGLE_AUTH_CHANNEL = 'floriva_google_auth';
export const GOOGLE_AUTH_STORAGE_KEY = 'floriva_google_auth_event';

export type GoogleAuthPayload = {
  token: string;
  name: string;
  email: string;
  countrySlug?: string;
};

const ALLOWED_ORIGINS = new Set([
  'https://florivagifts.com',
  'https://www.florivagifts.com',
  'http://localhost:3000',
]);

export function isGoogleOAuthPopup(): boolean {
  if (typeof window === 'undefined') return false;
  return window.name === GOOGLE_POPUP_NAME || Boolean(window.opener);
}

function isAllowedOrigin(origin: string): boolean {
  return origin === window.location.origin || ALLOWED_ORIGINS.has(origin);
}

export function notifyGoogleAuthSuccess(payload: GoogleAuthPayload) {
  const message = { type: 'FLORIVA_GOOGLE_SUCCESS' as const, payload };

  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, window.location.origin);
    }
  } catch {
    /* opener may be blocked after OAuth redirects */
  }

  try {
    const channel = new BroadcastChannel(GOOGLE_AUTH_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    /* BroadcastChannel unavailable */
  }

  try {
    localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify({ ...message, ts: Date.now() }));
    localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function notifyGoogleAuthError(error: string) {
  const message = { type: 'FLORIVA_GOOGLE_ERROR' as const, error };

  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, window.location.origin);
    }
  } catch {
    /* ignore */
  }

  try {
    const channel = new BroadcastChannel(GOOGLE_AUTH_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    /* ignore */
  }
}

function handleAuthMessage(
  data: unknown,
  onSuccess: (payload: GoogleAuthPayload) => void,
  onError: (msg: string) => void,
) {
  if (!data || typeof data !== 'object') return;
  const msg = data as { type?: string; payload?: GoogleAuthPayload; error?: string };

  if (msg.type === 'FLORIVA_GOOGLE_SUCCESS' && msg.payload?.token) {
    onSuccess(msg.payload);
  }
  if (msg.type === 'FLORIVA_GOOGLE_ERROR') {
    onError(msg.error || 'Google sign-in failed');
  }
}

export function subscribeGoogleAuth(
  onSuccess: (payload: GoogleAuthPayload) => void,
  onError: (msg: string) => void,
) {
  const onWindowMessage = (event: MessageEvent) => {
    if (!isAllowedOrigin(event.origin)) return;
    handleAuthMessage(event.data, onSuccess, onError);
  };

  window.addEventListener('message', onWindowMessage);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(GOOGLE_AUTH_CHANNEL);
    channel.onmessage = (event) => handleAuthMessage(event.data, onSuccess, onError);
  } catch {
    /* ignore */
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== GOOGLE_AUTH_STORAGE_KEY || !event.newValue) return;
    try {
      handleAuthMessage(JSON.parse(event.newValue), onSuccess, onError);
    } catch {
      /* ignore */
    }
  };

  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener('message', onWindowMessage);
    window.removeEventListener('storage', onStorage);
    channel?.close();
  };
}

export async function completeGoogleLogin(payload: GoogleAuthPayload) {
  const user = {
    username: payload.name,
    email: payload.email,
    countrySlug: payload.countrySlug || undefined,
  };

  localStorage.setItem('floriva_token', payload.token);
  localStorage.setItem('floriva_user', JSON.stringify(user));
  window.dispatchEvent(new Event('floriva-auth-changed'));

  const { syncCountryForUser, getSelectedCountrySlug } = await import('@/lib/userCountry');
  await syncCountryForUser(user).catch(() => {});
  const slug = user.countrySlug || getSelectedCountrySlug();

  if (window.location.pathname.startsWith('/google/callback')) {
    window.location.replace(`/country/${slug}`);
    return;
  }

  if (!window.location.pathname.startsWith(`/country/${slug}`)) {
    window.location.assign(`/country/${slug}`);
  }
}
