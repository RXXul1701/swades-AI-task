import { Hono } from "hono";
import { agents } from "@/agents/index";

const agentRoutes = new Hono();

// GET /api/agents
agentRoutes.get("/", (c) => {
  const agentList = agents.map((agent) => ({
    id: agent.type,
    name: agent.name,
    description: agent.description,
  }));

  return c.json(agentList);
});

// GET /api/agents/:type/capabilities
agentRoutes.get("/:type/capabilities", (c) => {
  const type = c.req.param("type");
  const agent = agents.find((a) => a.type === type);

  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }

  return c.json({
    type: agent.type,
    name: agent.name,
    description: agent.description,
    tools: Object.keys(agent.tools),
  });
});

export { agentRoutes };
