const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

// TODO: in-memory only — resets on restart and won't work once this runs on
// more than one instance. move to redis before we scale out.
const hits = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);


  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}
