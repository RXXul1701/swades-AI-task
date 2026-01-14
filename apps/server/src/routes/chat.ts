import { Hono } from "hono";
import { stream } from "hono/streaming";
import { prisma } from "@/lib/prisma";
import { RouterAgent } from "@/agents/RouterAgent";
import OpenAI from "openai";
import { z } from "zod";
import { supportTools, executeToolSupport } from "@/agents/tools/support";
import { orderTools, executeToolOrder } from "@/agents/tools/order";
import { billingTools, executeToolBilling } from "@/agents/tools/billing";

const chatRoutes = new Hono();

const messageSchema = z.object({
  conversationId: z.string().optional(),
  userId: z.string(),
  content: z.string(),
});

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

/* ---------------- POST /api/chat/messages ---------------- */

chatRoutes.post("/messages", async (c) => {
  try {
    const body = await c.req.json();
    const { conversationId, userId, content } = messageSchema.parse(body);

    /* ---------- Intent routing ---------- */
    const routerAgent = new RouterAgent();
    const intent = await routerAgent.classifyIntent(content);
    const selectedAgent = routerAgent.selectAgent(intent)!;

    let agentTools: any[] = [];
    if (intent === "support") agentTools = Object.values(supportTools);
    if (intent === "order") agentTools = Object.values(orderTools);
    if (intent === "billing") agentTools = Object.values(billingTools);

    const needsTools = agentTools.length > 0;

    /* ---------- Ensure user ---------- */
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@example.com` },
    });

    /* ---------- Conversation ---------- */
    let conversation =
      conversationId &&
      (await prisma.conversation.findUnique({
        where: { id: conversationId },
      }));

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: content.substring(0, 100),
        },
      });
    }

    /* ---------- Store user message ---------- */
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content,
        agent: "user",
      },
    });

    /* ---------- Load history ---------- */
    const conversationHistory = (
      await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 20,
      })
    ).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    /* ======================================================
       =============== NO TOOLS → STREAM ====================
       ====================================================== */
    if (!needsTools) {
      c.header("Content-Type", "text/event-stream");
      c.header("Cache-Control", "no-cache");
      c.header("Connection", "keep-alive");

      const streamResponse = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: selectedAgent.systemPrompt },
          ...conversationHistory,
        ],
        stream: true,
      });

      return stream(c, async (s) => {
        let fullResponse = "";

        

        let buffer = "";
        let lastFlush = Date.now();
        const FLUSH_INTERVAL = 120; // ms — increase to slow down

        for await (const chunk of streamResponse) {
        const delta = chunk.choices[0]?.delta?.content;
        if (!delta) continue;

        buffer += delta;
        fullResponse += delta;

        const now = Date.now();
        if (now - lastFlush >= FLUSH_INTERVAL) {
          await s.write(`data: ${JSON.stringify({ text: buffer })}\n\n`);
          buffer = "";
          lastFlush = now;
        }
      }

      if (buffer) {
        await s.write(`data: ${JSON.stringify({ text: buffer })}\n\n`);
      }





        await prisma.message.create({
          data: {
            conversationId: conversation!.id,
            role: "assistant",
            content: fullResponse,
            agent: selectedAgent.type,
          },
        });

        await prisma.conversation.update({
          where: { id: conversation!.id },
          data: { updatedAt: new Date() },
        });

        await s.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      });
    }

    /* ======================================================
       ================= TOOLS FLOW =========================
       ====================================================== */

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: selectedAgent.systemPrompt },
        ...conversationHistory,
      ],
      tools: agentTools,
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    let fullResponse = message.content ?? "";

    if (message.tool_calls?.length) {
      const toolMessages: any[] = [];

      for (const call of message.tool_calls) {
        if (call.type !== "function") continue;

        const { name, arguments: args } = call.function;
        let result: any;

        if (intent === "support") {
          result = await executeToolSupport(name, JSON.parse(args));
        } else if (intent === "order") {
          result = await executeToolOrder(name, JSON.parse(args));
        } else if (intent === "billing") {
          result = await executeToolBilling(name, JSON.parse(args));
        } else {
          result = { error: "Unknown tool" };
        }

        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      const followup = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: selectedAgent.systemPrompt },
          ...conversationHistory,
          message,
          ...toolMessages,
        ],
      });

      fullResponse = followup.choices[0].message.content ?? "";
    }

    /* ---------- Persist assistant ---------- */
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: fullResponse,
        agent: selectedAgent.type,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    /* ---------- Stream final text ---------- */
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return stream(c, async (s) => {
      const chunks = fullResponse.match(/.{1,40}/g) || [];
      for (const chunk of chunks) {
        await s.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        await new Promise((r) => setTimeout(r, 25));
      }
      await s.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    });
  } catch (error) {
    console.error("Chat error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});

// GET /api/chat/conversations/:id
chatRoutes.get("/conversations/:id", async (c) => {
  const conversationId = c.req.param("id");

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  return c.json(conversation);
});

// GET /api/chat/conversations
chatRoutes.get("/conversations", async (c) => {
  const userId = c.req.query("userId");

  if (!userId) {
    return c.json({ error: "userId required" }, 400);
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return c.json(conversations);
});

// DELETE /api/chat/conversations/:id
chatRoutes.delete("/conversations/:id", async (c) => {
  const conversationId = c.req.param("id");

  await prisma.message.deleteMany({
    where: { conversationId },
  });

  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  return c.json({ success: true });
});

export { chatRoutes };
