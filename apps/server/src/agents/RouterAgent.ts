import { agents, AgentType } from "@/agents/index";

export class RouterAgent {
  private keywords: Record<AgentType, string[]> = {
    support: [
      "help",
      "support",
      "faq",
      "question",
      "issue",
      "problem",
      "troubleshoot",
      "how",
      "guide",
      "tutorial",
      "bug",
      "error",
      "not working",
    ],
    order: [
      "order",
      "tracking",
      "delivery",
      "shipping",
      "track",
      "status",
      "where is my",
      "when will",
      "modify",
      "cancel order",
      "change order",
    ],
    billing: [
      "payment",
      "invoice",
      "refund",
      "charge",
      "bill",
      "subscription",
      "card",
      "pay",
      "price",
      "cost",
      "fee",
      "coupon",
      "discount",
    ],
    
  };

  async classifyIntent(query: string): Promise<AgentType> {
    const lowerQuery = query.toLowerCase();

    // Score each agent based on keyword matches
    const scores: Record<AgentType, number> = {
      support: 0,
      order: 0,
      billing: 0,
    };

    for (const [agentType, keywords] of Object.entries(
      this.keywords
    ) as Array<[AgentType, string[]]>) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          scores[agentType]++;
        }
      }
    }

    // Find agent with highest score
    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) {
      // Default to support for unknown queries
      return "support";
    }

    return (Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || "support") as AgentType;
  }

  selectAgent(agentType: AgentType) {
    const agent = agents.find((a) => a.type === agentType);

    if (!agent) {
      // Fallback to support agent
      return agents[0];
    }

    return agent;
  }
}
