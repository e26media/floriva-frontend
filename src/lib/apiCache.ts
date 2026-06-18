const cache = new Map<string, { expires: number; data: unknown }>();

export type ApiListPayload<T> = T[] | { data?: T[] };

export function normalizeApiList<T>(json: ApiListPayload<T> | unknown): T[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object' && Array.isArray((json as { data?: T[] }).data)) {
    return (json as { data: T[] }).data;
  }
  return [];
}

export async function fetchJsonCached<T = unknown>(
  url: string,
  ttlMs = 60_000,
  init?: RequestInit,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expires > now) {
    return hit.data as T;
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  const data = (await res.json()) as T;
  cache.set(url, { expires: now + ttlMs, data });
  return data;
}

export function invalidateCachedUrl(url: string) {
  cache.delete(url);
}
