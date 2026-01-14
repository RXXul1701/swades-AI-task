# 🚀 AI Support System - Getting Started Guide

## What You're Building

An AI-powered customer support chatbot that intelligently routes queries to specialized agents:
- **Support Agent** 🆘 - FAQs, troubleshooting, general help
- **Order Agent** 📦 - Order tracking, modifications, cancellations  
- **Billing Agent** 💳 - Invoices, refunds, payments

## Project Structure at a Glance

```
AI Support System (Monorepo)
├── Frontend (React + Vite)
│   └── Real-time chat UI
├── Backend (Hono + Node.js)
│   └── Multi-agent system with streaming
└── Database (PostgreSQL)
    └── Conversation history & mock data
```

## Step 1: Prerequisites

**Required:**
- Node.js 18+ (download from nodejs.org)
- PostgreSQL (download from postgresql.org)
- Code editor (VS Code recommended)

**Get Your API Key:**
1. Visit https://console.anthropic.com
2. Sign up/login
3. Generate API key
4. Keep it handy for later

## Step 2: Clone & Setup

```bash
# Navigate to project
cd c:\Users\rahul\OneDrive\Desktop\swades\ task

# Install all dependencies (installs root + apps)
npm install

# This installs:
# - Turbo (task runner)
# - Backend: Hono, Prisma, AI SDK
# - Frontend: React, Vite, Zustand
```

## Step 3: Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env file with your values:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_support
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

**Finding your PostgreSQL password:**
- Set during PostgreSQL installation
- Or reset: https://www.postgresql.org/docs/current/app-psql.html

## Step 4: Setup Database

```bash
# Navigate to server
cd apps/server

# Create tables & seed sample data
npx prisma migrate dev
npx prisma db seed

# Output should show:
# ✅ Database seeded successfully!
# 📦 Created 3 orders
# 💳 Created 3 invoices
```

**What was created:**
- 2 sample users (john@example.com, jane@example.com)
- 3 sample orders with various statuses
- 3 sample invoices
- 2 sample conversations

## Step 5: Start Development

**From project root:**

```bash
# Terminal 1 - Start backend & frontend together
npm run dev

# Or separately:

# Terminal 1 - Backend
cd apps/server && npm run dev

# Terminal 2 - Frontend  
cd apps/client && npm run dev
```

**Expected output:**
```
✅ Backend running on http://localhost:3000
✅ Frontend running on http://localhost:5173
```

## Step 6: Test It Out

### In Your Browser

1. Open http://localhost:5173
2. You should see a chat interface
3. Try these messages:

**Test Support Agent:**
```
"How do I return an item?"
```
→ Uses get_faq tool

**Test Order Agent:**
```
"Where is my order ORD-001?"
```
→ Uses check_delivery_status tool

**Test Billing Agent:**
```
"Can I get a refund?"
```
→ Uses process_refund tool

### API Testing (Terminal)

```bash
# Check health
curl http://localhost:3000/api/health

# List agents
curl http://localhost:3000/api/agents

# Send a message
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "content": "I need help tracking my order"
  }'
```

## Understanding the Flow

```
You type: "Where is my order?"
    ↓
RouterAgent reads message
    ↓
Detects keywords: "order" → Routes to Order Agent
    ↓
Order Agent's system prompt activates
    ↓
Claude gets tools: fetch_order_details, check_delivery_status
    ↓
Claude decides to call check_delivery_status
    ↓
Tool queries database, returns order info
    ↓
Claude generates response using tool output
    ↓
Response streams back to frontend
    ↓
You see: "Your order ORD-001 is in transit, arriving Jan 15..."
```

## File Organization

**Backend Key Files:**
- `src/agents/RouterAgent.ts` - Intent classification logic
- `src/agents/index.ts` - Agent definitions with tools
- `src/agents/tools/*.ts` - Tool implementations
- `src/routes/chat.ts` - Chat API endpoint
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Sample data seeding

**Frontend Key Files:**
- `src/App.tsx` - Main chat component
- `src/store/conversation.ts` - State management
- `src/index.css` - Styling

## Common Tasks

### Add a New Tool to Support Agent

Edit `apps/server/src/agents/tools/support.ts`:

```typescript
export const supportTools = {
  // ... existing tools
  
  new_tool: tool({
    description: "What this tool does",
    parameters: z.object({
      param1: z.string(),
    }),
    execute: async ({ param1 }) => {
      // Your logic here
      return { result: "data" }
    },
  }),
}
```

### Change Agent System Prompt

Edit `apps/server/src/agents/index.ts`:

```typescript
{
  type: "support",
  systemPrompt: `You are now a very angry support agent...`, // Edit this
  // ...
}
```

### Modify Database Schema

Edit `apps/server/prisma/schema.prisma`:

```prisma
model MyNewModel {
  id String @id @default(cuid())
  // ... fields
}
```

Then:
```bash
npx prisma migrate dev --name add_my_model
npx prisma generate
```

## Debugging

### Backend Issues

```bash
# Check if Hono server starts
cd apps/server && npm run dev

# Look for: "🚀 Server running on http://localhost:3000"

# Check database connection
npx prisma db execute --stdin < query.sql
```

### Frontend Issues

```bash
# Check if Vite dev server starts
cd apps/client && npm run dev

# Look for: "VITE v5... ready in 500ms"

# Check console (F12 in browser)
```

### API Connection Issues

```bash
# Verify backend is running on 3000
curl http://localhost:3000/api/health

# Check frontend env variable
# Should see http://localhost:3000 in vite config
```

## Production Build

```bash
# Build everything
npm run build

# Creates:
# - apps/server/dist/ (Node.js backend)
# - apps/client/dist/ (Static files)

# Deploy to your hosting
```

## What Each Agent Does

### 🆘 Support Agent
```
Handles: "I need help", "How do I...", "What's the FAQ?"
Tools:
  - query_conversation_history: Search past conversations
  - get_faq: Look up common questions
  - create_support_ticket: Create urgent ticket
```

### 📦 Order Agent  
```
Handles: "Where's my order?", "Can I cancel?", "Track my delivery"
Tools:
  - fetch_order_details: Get order info
  - check_delivery_status: Track shipment
  - modify_order: Change address/items
  - cancel_order: Cancel order
```

### 💳 Billing Agent
```
Handles: "My invoice...", "I want a refund", "Update payment"
Tools:
  - get_invoice_details: Look up invoice
  - check_refund_status: Check refund progress
  - process_refund: Request refund
  - get_subscription_info: Show subscription details
  - update_payment_method: Change card
```

## Architecture Overview

```
User (Browser)
    ↓ (HTTP with streaming)
Hono Server
    ├─ Rate Limiter (100 req/min per IP)
    ├─ Error Handler (try-catch wrapper)
    └─ Chat Route Handler
        ↓
    RouterAgent (Intent Classification)
        ↓
    Select SubAgent (Support/Order/Billing)
        ↓
    Claude 3.5 Sonnet (with tools)
        ↓
    Agent Tools (Query Database)
        ↓
    Prisma ORM
        ↓
    PostgreSQL Database
        ↓
    Stream Response back to User
```

## Next Steps After Setup

1. ✅ Get it running (you are here)
2. 🧪 Test all three agents
3. 📝 Review architecture docs (`ARCHITECTURE.md`)
4. 🔧 Customize agent prompts
5. 🎨 Enhance UI styling
6. 🚀 Deploy to production

## Need Help?

1. **Check Logs** - Terminal output usually has error details
2. **Read SETUP.md** - Detailed setup guide
3. **Check ARCHITECTURE.md** - System design explanation
4. **Review Code Comments** - Key files have inline docs

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start backend + frontend |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run lint` | Check code style |
| `npx prisma studio` | Visual database explorer |
| `npx prisma db seed` | Reseed database |

---

**You're all set! Start with `npm run dev` and open http://localhost:5173** 🎉
