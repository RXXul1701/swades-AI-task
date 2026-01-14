# AI Support System - Setup Instructions

## 1. Initial Setup

### Clone or Navigate to Project
```bash
cd c:\Users\rahul\OneDrive\Desktop\swades\ task
```

### Install Dependencies
```bash
npm install
```

This installs:
- Root packages (turbo, typescript)
- Server dependencies (hono, prisma, ai sdk)
- Client dependencies (react, vite, zustand)

## 2. Environment Configuration

### Create .env file
```bash
cp .env.example .env
```

### Edit .env with your settings
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_support
API_PORT=3000
NODE_ENV=development
ANTHROPIC_API_KEY=your_claude_api_key
```

**Get API Key:**
1. Go to https://console.anthropic.com
2. Create/login to your account
3. Generate an API key
4. Add to .env file

## 3. Database Setup

### Install PostgreSQL
Windows: Download from https://www.postgresql.org/download/windows/

### Create Database
```bash
psql -U postgres
CREATE DATABASE ai_support;
\q
```

### Run Migrations
```bash
cd apps/server
npx prisma migrate dev
npx prisma db seed
```

This will:
- Create all tables
- Seed sample data (orders, invoices, conversations)

## 4. Development

### Start Development Servers
```bash
npm run dev
```

This runs in parallel:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

### Individual Server Start
```bash
# Terminal 1: Backend
cd apps/server && npm run dev

# Terminal 2: Frontend
cd apps/client && npm run dev
```

## 5. Testing the System

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# List agents
curl http://localhost:3000/api/agents

# Send message (stream)
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "content": "Where is my order?"
  }'
```

### Test Frontend
1. Open http://localhost:5173
2. Type a message in the chat
3. Messages are routed to correct agent
4. View streaming response

## 6. Project Structure Tour

**Backend Architecture:**
```
apps/server/src/
├── agents/
│   ├── index.ts          # Agent definitions
│   ├── RouterAgent.ts    # Intent classification
│   └── tools/            # Agent tools
│       ├── support.ts
│       ├── order.ts
│       └── billing.ts
├── routes/
│   ├── chat.ts           # Chat endpoints
│   ├── agents.ts         # Agent info endpoints
│   └── health.ts
├── middleware/
│   ├── errorHandler.ts   # Global error handling
│   └── rateLimiter.ts    # Rate limiting
├── lib/
│   └── prisma.ts         # Database client
└── index.ts              # Server entry point
```

**Frontend Structure:**
```
apps/client/src/
├── App.tsx               # Main chat component
├── store/
│   └── conversation.ts   # Zustand store
├── index.css             # Dark theme styles
└── main.tsx              # React entry point
```

## 7. Key Features to Try

### 1. Multi-Agent Routing
Send these messages to test routing:
- "Where is my order?" → Order Agent
- "I need help with my account" → Support Agent
- "Can I get a refund?" → Billing Agent

### 2. Agent Tools
Each agent uses specific tools:
- **Support**: Query history, FAQ lookup, ticket creation
- **Order**: Fetch details, check status, modify, cancel
- **Billing**: Invoices, refunds, subscriptions

### 3. Conversation Persistence
- Conversations saved to database
- Full history accessible
- Context maintained across messages

### 4. Streaming Responses
- Real-time message streaming
- Typing indicator shows agent is thinking
- Smooth user experience

## 8. Build for Production

```bash
npm run build
```

Creates optimized builds:
- Backend: `apps/server/dist/`
- Frontend: `apps/client/dist/`

## 9. Docker Deployment

Create `Dockerfile` in root:
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]
```

Build and run:
```bash
docker build -t ai-support .
docker run -p 3000:3000 -p 5173:5173 ai-support
```

## 10. Troubleshooting

### Database connection failed
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run `npx prisma db push`

### API key error
- Verify ANTHROPIC_API_KEY is set
- Check key is valid at console.anthropic.com
- Restart server after updating .env

### CORS errors
- Backend has CORS middleware enabled
- Frontend proxy configured in vite.config.ts
- Check API_URL in frontend matches backend

### Port already in use
- Backend (3000): `npx kill-port 3000`
- Frontend (5173): `npx kill-port 5173`

## 11. Next Steps

1. Customize agent prompts in `agents/index.ts`
2. Add more tools to each agent
3. Enhance UI/UX styling
4. Implement unit tests
5. Add authentication
6. Deploy to production

## 12. Support

For issues:
1. Check logs in terminal
2. Verify .env configuration
3. Ensure database is seeded
4. Check API key validity
5. Review README.md for architecture

---

**Ready to start?** Run `npm run dev` and open http://localhost:5173!
