const cache = new Map<string, { expires: number; data: unknown }>();

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
