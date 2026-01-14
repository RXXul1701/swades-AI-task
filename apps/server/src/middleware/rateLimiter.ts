import { Context, Next } from "hono";

const requestCounts = new Map<string, number[]>();
const RATE_LIMIT = 100; // requests
const TIME_WINDOW = 60000; // 1 minute in ms

export async function rateLimiter(c: Context, next: Next) {
  const clientIp = c.req.header("x-forwarded-for") || "unknown";
  const now = Date.now();

  // Initialize or get request times for this client
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, []);
  }

  const times = requestCounts.get(clientIp)!;

  // Remove old requests outside the time window
  const recentRequests = times.filter((time) => now - time < TIME_WINDOW);
  requestCounts.set(clientIp, recentRequests);

  // Check if limit exceeded
  if (recentRequests.length >= RATE_LIMIT) {
    return c.json(
      {
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((recentRequests[0] + TIME_WINDOW - now) / 1000),
      },
      429
    );
  }

  // Add current request
  recentRequests.push(now);

  await next();
}
