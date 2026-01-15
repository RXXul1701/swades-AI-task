import { agents, AgentType } from "@/agents/index";

export class RouterAgent {
  /**
   * Agent priority order.
   * Higher index = higher priority when scores tie.
   */
  private readonly priority: AgentType[] = [
    "order",
    "billing",
    "support",
  ];

  /**
   * Keyword & phrase map.
   * Phrases are intentionally more specific than generic words.
   */
  private readonly keywords: Record<AgentType, string[]> = {
    order: [
      "order",
      "my order",
      "track order",
      "tracking",
      "delivery",
      "shipping",
      "where is my",
      "when will my",
      "order status",
      "modify order",
      "change order",
      "cancel order",
    ],

    billing: [
      "billing",
      "payment",
      "invoice",
      "refund",
      "charge",
      "charged",
      "subscription",
      "card",
      "credit card",
      "debit card",
      "payment failed",
      "pricing",
      "cost",
      "fee",
      "coupon",
      "discount",
    ],

    support: [
      "support",
      "faq",
      "question",
      "issue",
      "problem",
      "troubleshoot",
      "bug",
      "error",
      "not working",
      "how do i",
      "how to",
      "guide",
      "tutorial",
    ],
  };

  /**
   * Classify intent using deterministic keyword scoring.
   * No AI, no ambiguity.
   */
  async classifyIntent(query: string): Promise<AgentType> {
    const text = query.toLowerCase();

    const scores: Record<AgentType, number> = {
      support: 0,
      order: 0,
      billing: 0,
    };

    for (const agentType of Object.keys(this.keywords) as AgentType[]) {
      for (const phrase of this.keywords[agentType]) {
        if (text.includes(phrase)) {
          scores[agentType] += phrase.split(" ").length;
        }
      }
    }

    const maxScore = Math.max(...Object.values(scores));

    // No keywords matched → default to support
    if (maxScore === 0) {
      return "support";
    }

    // Resolve ties using priority
    const candidates = (Object.keys(scores) as AgentType[])
      .filter((agent) => scores[agent] === maxScore);

    for (const preferred of this.priority) {
      if (candidates.includes(preferred)) {
        return preferred;
      }
    }

    return "support";
  }

  /**
   * Select the agent configuration (systemPrompt, tools, etc.)
   */
  selectAgent(agentType: AgentType) {
    const agent = agents.find((a) => a.type === agentType);

    // Absolute fallback safety
    return agent ?? agents.find((a) => a.type === "support")!;
  }
}
