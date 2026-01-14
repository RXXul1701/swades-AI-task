# Architecture & Design Decisions

## System Overview

This is a monorepo-based fullstack application with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Hono + Node.js + PostgreSQL
- **AI**: Claude 3.5 Sonnet via Vercel AI SDK
- **Orchestration**: Turborepo for task management

## Key Architectural Patterns

### 1. Controller-Service Pattern (Backend)

**Routes (Controllers)** → **Prisma (Database)** → **Agents (Business Logic)**

```
Request Flow:
POST /api/chat/messages
  → chatRoutes (controller)
  → RouterAgent.classifyIntent() (service)
  → selectAgent() → execute tools (database queries)
  → Response with agent-specific handling
```

**Separation of Concerns:**
- `routes/`: HTTP endpoints, request validation
- `agents/`: Business logic, intent classification
- `tools/`: Database access, external integrations
- `middleware/`: Cross-cutting concerns

### 2. Multi-Agent System Architecture

**Router Agent Pattern:**
```
User Query
    ↓
RouterAgent.classifyIntent()
    ↓
    ├→ Support Keywords? → SupportAgent (FAQs, history)
    ├→ Order Keywords? → OrderAgent (tracking, status)
    └→ Billing Keywords? → BillingAgent (invoices, refunds)
    ↓
Execute Tools
    ↓
Stream Response back to user
```

**Agent Composition:**
```typescript
interface Agent {
  type: "support" | "order" | "billing"
  name: string
  systemPrompt: string (Claude gets this)
  tools: Record<string, ToolDefinition>
}
```

### 3. Tool-Based Agent Execution

Each agent has access to specific tools via Vercel AI SDK:

```typescript
supportTools = {
  query_conversation_history: tool({...}),
  get_faq: tool({...}),
  create_support_ticket: tool({...})
}
```

**Tool Execution Flow:**
1. Claude model receives tool definitions
2. Based on user query, Claude decides which tools to call
3. Tools execute and return results
4. Claude generates final response using tool outputs
5. Response streamed to frontend

### 4. Conversation Context Management

**Schema:**
```
User → Conversation (1-to-Many)
Conversation → Messages (1-to-Many)
Message includes: role, content, agent, timestamp
```

**Context Preservation:**
- Last 20 messages loaded per conversation
- Passed to Claude as conversation history
- Enables multi-turn dialogues
- Agent information tracked per message

### 5. Monorepo with Turborepo

**Workspace Structure:**
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev --parallel"
  }
}
```

**Benefits:**
- Shared tsconfig and dependencies
- Unified build process
- Type-safe across packages
- Single deployment unit

### 6. Error Handling Architecture

**Middleware-First Approach:**

```typescript
app.use("*", errorHandler)
app.use("*", rateLimiter)

// All routes benefit from error handling:
try {
  // route logic
} catch (error) {
  return c.json({ error: error.message }, 500)
}
```

### 7. Rate Limiting Strategy

**In-Memory Rate Limiter:**
- 100 requests per 60 seconds per IP
- Returns HTTP 429 with retry-after header
- Protects against abuse without external service

## Data Flow

### 1. Chat Message Flow

```
Frontend
  ↓ axios.post("/api/chat/messages")
Backend Chat Route
  ↓
Create User Message in DB
  ↓
Load Conversation History (last 20 messages)
  ↓
RouterAgent.classifyIntent()
  ↓
selectAgent() based on intent
  ↓
streamText() with Claude
  - System Prompt from agent
  - Messages from history
  - Tools from agent.tools
  ↓
Tool Execution (if needed)
  - Query database
  - Return results to Claude
  ↓
Stream Response to Frontend
  ↓
Frontend updates UI
  ↓
Store Assistant Message in DB
```

### 2. Tool Execution

Each tool is a function that:
1. Receives parameters
2. Queries database or external service
3. Returns structured result
4. Result goes back to Claude
5. Claude incorporates into response

Example:
```typescript
fetch_order_details: tool({
  parameters: { orderId: string },
  execute: ({ orderId }) => {
    return mockOrders.find(o => o.id === orderId)
  }
})
```

## Database Design

**Normalized Schema:**
- Users: Profile data
- Conversations: User sessions
- Messages: Individual messages with metadata
- Orders, Invoices, Refunds: Mock data for tools

**Relationships:**
```
User (1) ──→ (Many) Conversation
Conversation (1) ──→ (Many) Message
```

**Indexes:**
- userId on Conversation (for queries)
- conversationId on Message (for sorting)
- agent field on Message (for filtering)

## Frontend State Management

**Zustand Store:**
```typescript
{
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  
  actions: {
    addMessage()
    setCurrentConversation()
    createConversation()
    loadConversations()
    loadMessages()
  }
}
```

**UI Components:**
- Sidebar: List conversations
- Chat Header: Current conversation title
- Messages: Display with agent badges
- Input: Message form with send button
- Typing Indicator: Shows agent is responding

## Security Considerations

1. **Input Validation**: Zod schemas on all endpoints
2. **Rate Limiting**: Prevents abuse
3. **CORS Enabled**: Secure frontend-backend communication
4. **Error Handling**: No sensitive info leaked
5. **Environment Variables**: API keys never exposed

## Scalability Patterns

1. **Streaming Responses**: Doesn't wait for full response
2. **Context Windowing**: Only last 20 messages in context
3. **Tool Caching**: Reuse tool results within session
4. **Stateless API**: Any server instance can handle requests
5. **Database Connection Pooling**: Prisma manages this

## Future Enhancements

1. **Authentication**: JWT-based user auth
2. **Vector Database**: For semantic search of FAQs
3. **Tool Orchestration**: Workflow.dev integration
4. **Caching Layer**: Redis for frequent queries
5. **Analytics**: Track agent performance
6. **Fine-tuning**: Agent-specific model instruction tuning
7. **Multi-language**: Support i18n
8. **WebSockets**: Real-time updates

## Testing Strategy

1. **Unit Tests**: Individual tool functions
2. **Integration Tests**: Agent + tools flow
3. **API Tests**: Route handlers
4. **E2E Tests**: Full user journeys

## Deployment Architecture

```
Docker Container
├── Backend (Hono on port 3000)
├── Database Connection Pool
└── Frontend (Vite build)

Environment:
- DATABASE_URL
- ANTHROPIC_API_KEY
- NODE_ENV
```

---

**Total Implementation Time:** ~4-6 hours
**Complexity:** Medium-High (multi-agent + streaming + database)
**Extensibility:** High (easy to add new agents/tools)
