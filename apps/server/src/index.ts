import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { errorHandler } from "@/middleware/errorHandler";
import { rateLimiter } from "@/middleware/rateLimiter";
import { chatRoutes } from "@/routes/chat";
import { agentRoutes } from "@/routes/agents";
import { healthRoutes } from "@/routes/health";

const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", rateLimiter);
app.use("*", errorHandler);

// Routes
app.route("/api/chat", chatRoutes);
app.route("/api/agents", agentRoutes);
app.route("/api/health", healthRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

const port = 3000;
console.log(`🚀 Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
