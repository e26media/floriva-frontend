export type AuthUser = {
  email?: string;
  username?: string;
  countrySlug?: string;
};

const ENV_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('floriva_token');
  if (!raw) return null;
  const token = raw.replace(/^"|"$/g, '').trim();
  return token.length > 20 ? token : null;
}

export function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
  }
  return headers;
}

export function withAuthBody<T extends Record<string, unknown>>(body: T): T & { token?: string } {
  const token = getAuthToken();
  return token ? { ...body, token } : body;
}

export function getApiBase() {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:7000';
  }
  return ENV_API_BASE;
}

export function startGoogleLogin() {
  window.location.assign(`${getApiBase()}/api/google-login`);
}

export function finishLogin(token: string, user: AuthUser, redirectPath?: string | null) {
  const cleanToken = String(token || '').replace(/^"|"$/g, '').trim();
  localStorage.setItem('floriva_token', cleanToken);
  localStorage.setItem(
    'floriva_user',
    JSON.stringify({
      email: user.email,
      username: user.username,
      countrySlug: user.countrySlug,
    }),
  );
  window.dispatchEvent(new Event('floriva-auth-changed'));

  const params = new URLSearchParams(window.location.search);
  const redirect = redirectPath ?? params.get('redirect');
  if (redirect && redirect.startsWith('/')) {
    window.location.replace(redirect);
    return;
  }

  window.location.replace('/');
}

export function normalizeUserPayload(raw: Record<string, unknown> | null | undefined): AuthUser {
  if (!raw) return {};
  return {
    email: String(raw.email || '').trim().toLowerCase() || undefined,
    username: String(raw.username || raw.name || '').trim() || undefined,
    countrySlug: raw.countrySlug ? String(raw.countrySlug) : undefined,
  };
}
