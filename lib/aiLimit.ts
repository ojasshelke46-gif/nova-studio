// Global guard on outbound AI (DeepSeek) calls. Caps how many requests the whole
// app may send per minute and per day so a burst — or a runaway question loop —
// can't drain the shared BytePlus token budget. Independent of per-IP limiting
// in lib/rateLimit.ts: this protects the *account*, not a single client.
//
// In-memory, single-instance only (same constraint as lib/rateLimit.ts). Move to
// Redis before running more than one instance.

const PER_MIN = Number(process.env.AI_RATE_PER_MIN ?? 15);
const PER_DAY = Number(process.env.AI_RATE_PER_DAY ?? 300);

const MIN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const minute = { count: 0, resetAt: 0 };
const day = { count: 0, resetAt: 0 };

export class AiRateLimitError extends Error {
  constructor() {
    super("AI request budget exceeded");
    this.name = "AiRateLimitError";
  }
}

// Reserve one AI call against the budget. Throws AiRateLimitError when either the
// per-minute or per-day ceiling is hit. Both buckets are checked before either is
// incremented, so a rejected call never consumes budget.
export function consumeAiBudget(): void {
  const now = Date.now();

  if (now > minute.resetAt) {
    minute.count = 0;
    minute.resetAt = now + MIN_MS;
  }
  if (now > day.resetAt) {
    day.count = 0;
    day.resetAt = now + DAY_MS;
  }

  if (minute.count >= PER_MIN || day.count >= PER_DAY) {
    throw new AiRateLimitError();
  }

  minute.count += 1;
  day.count += 1;
}
