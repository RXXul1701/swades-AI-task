# AI-Powered Customer Support System

A fullstack multi-agent customer support system built with modern technologies.

## 🎯 Project Overview

This system implements an intelligent customer support platform with:
- **Router Agent**: Analyzes incoming queries and routes to appropriate sub-agents
- **Support Agent**: Handles FAQs, troubleshooting, and general inquiries
- **Order Agent**: Manages order tracking, modifications, and cancellations
- **Billing Agent**: Handles invoices, refunds, and subscription management

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development
- Zustand for state management
- Axios for API calls

**Backend:**
- Hono.dev lightweight web framework
- Node.js with TypeScript
- PostgreSQL database
- Prisma ORM for database access

**AI Integration:**
- Vercel AI SDK
- Claude 3.5 Sonnet (Anthropic)

**Infrastructure:**
- Turborepo for monorepo management
- Docker-ready setup

### Directory Structure

```
.
├── apps/
│   ├── client/              # React frontend
│   │   └── src/
│   │       ├── components/
│   │       ├── store/       # Zustand state management
│   │       └── App.tsx
│   └── server/              # Hono backend
│       ├── src/
│       │   ├── agents/      # Router & sub-agents
│       │   ├── tools/       # Agent tools
│       │   ├── routes/      # API endpoints
│       │   ├── middleware/  # Error handling & rate limiting
│       │   └── lib/         # Database & utilities
│       └── prisma/          # Database schema & seed
└── package.json             # Root workspace config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Anthropic API key (Claude)

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd swades-task
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
cd apps/server
npx prisma migrate dev
npx prisma db seed
```

### Development

Start both frontend and backend in parallel:

```bash
npm run dev
```

This runs:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:3000`

### Building

```bash
npm run build
```

## 📚 API Routes

### Chat Routes
- `POST /api/chat/messages` - Send a message (streams response)
- `GET /api/chat/conversations/:id` - Get conversation history
- `GET /api/chat/conversations` - List user conversations
- `DELETE /api/chat/conversations/:id` - Delete conversation

### Agent Routes
- `GET /api/agents` - List all agents
- `GET /api/agents/:type/capabilities` - Get agent capabilities

### Health
- `GET /api/health` - Health check

## 🤖 Agent System

### Router Agent
Classifies incoming queries using keyword matching and routes to appropriate sub-agent:
- **Support queries**: "help", "support", "question", "troubleshoot"
- **Order queries**: "order", "tracking", "delivery", "shipping"
- **Billing queries**: "payment", "invoice", "refund", "subscription"

### Sub-Agents

#### Support Agent
- Tools: `query_conversation_history`, `get_faq`, `create_support_ticket`
- Handles: FAQs, troubleshooting, general support

#### Order Agent
- Tools: `fetch_order_details`, `check_delivery_status`, `modify_order`, `cancel_order`
- Handles: Order management, tracking, modifications

#### Billing Agent
- Tools: `get_invoice_details`, `check_refund_status`, `process_refund`, `get_subscription_info`, `update_payment_method`
- Handles: Payments, refunds, subscriptions

## 🔧 Features Implemented

### Core Requirements ✅
- [x] Controller-Service pattern architecture
- [x] Clean separation of concerns
- [x] Error handling middleware
- [x] Multi-agent system with routing
- [x] Agent tools with database access
- [x] Conversation history persistence
- [x] RESTful API endpoints
- [x] Rate limiting middleware
- [x] Database seeding with mock data

### Bonus Features ✅
- [x] Hono RPC setup (type-safe)
- [x] Turborepo monorepo management
- [x] Rate limiting implementation
- [x] Streaming responses
- [x] Typing indicator
- [x] Modern UI with dark theme

## 📝 Database Schema

**Conversation** - Stores user conversations
**Message** - Individual messages with agent metadata
**Order** - Mock order data
**Invoice** - Payment invoices
**Refund** - Refund requests and tracking
**User** - User profiles

## 🧪 Testing

Run tests across all packages:
```bash
npm run test
```

## 📦 Deployment

The project is ready for Docker deployment. Create a `Dockerfile` in the root and build:

```bash
docker build -t ai-support-system .
docker run -p 3000:3000 -p 5173:5173 ai-support-system
```

## 🎓 Learning & Development

Key architectural decisions:
1. **Monorepo with Turborepo** - Shared type definitions and efficient builds
2. **Tool-based agents** - Structured, safe tool definitions with Zod
3. **Streaming responses** - Real-time updates for better UX
4. **Middleware-first** - Error handling and rate limiting at framework level
5. **State management** - Zustand for lightweight client state

## 📺 Demo

See `LOOM_DEMO.md` for video walkthrough (link to be added after recording)

## 📄 License

MIT

## 🤝 Contributing

This is an assessment project. Architecture and implementation details are manually created and reviewed during submission.
