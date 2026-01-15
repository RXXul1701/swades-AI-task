import { prisma } from "@/lib/prisma";

export const supportTools: Record<string, any> = {
  query_conversation_history: {
    type: "function",
    function: {
      description:"INTERNAL SUPPORT TOOL. Use ONLY when explicitly instructed by the system prompt. NEVER call this tool to infer order, billing, or user intent.",
      name: "query_conversation_history",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Search keyword or topic" },
          limit: { type: "number", description: "Number of results", default: 5 },
        },
        required: ["keyword"],
      },
    },
  },

  get_faq: {
    type: "function",
    function: {
      description: "Get FAQ articles",
      name: "get_faq",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "FAQ topic (shipping, returns, account, technical, billing)" },
        },
        required: ["topic"],
      },
    },
  },

  create_support_ticket: {
    type: "function",
    function: {
      description: "Create a support ticket for complex issues",
      name: "create_support_ticket",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
        },
        required: ["subject", "description"],
      },
    },
  },
};

// Tool execution functions
export async function executeToolSupport(toolName: string, toolInput: any): Promise<any> {
  if (toolName === "query_conversation_history") {
    const { keyword, limit = 5 } = toolInput;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { content: { contains: keyword, mode: "insensitive" } },
          { agent: "support" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.map((m: any) => ({
      role: m.role,
      content: m.content,
      timestamp: m.createdAt,
    }));
  }

  if (toolName === "get_faq") {
    const { topic } = toolInput;
    const faqs: Record<string, string[]> = {
      shipping: [
        "How long does shipping take? Standard: 5-7 days, Express: 2-3 days",
        "Do you ship internationally? Yes, we ship to 50+ countries",
        "Can I track my order? Yes, tracking info is sent via email",
      ],
      returns: [
        "What is your return policy? 30 days money-back guarantee",
        "How do I return an item? Use our online return portal",
        "When will I get my refund? 5-10 business days after return",
      ],
      account: [
        "How do I reset my password? Click 'Forgot Password' on login",
        "Can I change my email? Yes, in Account Settings",
        "How do I delete my account? Contact support@example.com",
      ],
      technical: [
        "What browsers are supported? Chrome, Firefox, Safari, Edge",
        "Is the app mobile-friendly? Yes, fully responsive",
        "What if I encounter a bug? Email bugs@example.com with details",
      ],
    };

    if (!faqs[topic.toLowerCase()]) {
      return { error: "Unknown FAQ topic", availableTopics: Object.keys(faqs) };
    }

  }

  if (toolName === "create_support_ticket") {
    const { subject, description, priority = "medium" } = toolInput;
    return {
      ticketId: `TKT-${Date.now()}`,
      subject,
      status: "open",
      priority,
      createdAt: new Date(),
      message: "Support ticket created. We'll respond within 24 hours.",
    };
  }

  return { error: "Unknown tool" };
}
