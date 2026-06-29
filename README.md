<div align="center">

# TeleFlow-Backend

**Open-source REST API backend for Telegram UserBot via MTProto**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org)

<img src="./assets/showcase.gif" alt="TeleFlow-Backend showcase" width="600" />

</div>

---

## Overview

TeleFlow-Backend provides a complete REST API, OpenAPI documentation, Webhooks, and Event Streaming to control Telegram User Accounts (UserBot) through MTProto — without directly using GramJS, Telethon, or Pyrogram.

## Features

- 🔌 **REST API** — Complete HTTP API for all Telegram operations
- 📖 **OpenAPI 3.1** — Full Swagger documentation at `/docs`
- 🔗 **Webhooks** — Event-driven notifications with retry & signature verification
- ⚡ **WebSocket & SSE** — Real-time event streaming
- 🔐 **Authentication** — JWT + API Key with role-based access
- 📱 **Multi-Session** — Manage multiple Telegram accounts simultaneously
- 🐳 **Docker Ready** — One-command deployment
- 🏗️ **Production Ready** — Structured logging, health checks, graceful shutdown

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 22 LTS |
| Language | TypeScript |
| Framework | Fastify |
| Telegram | GramJS (MTProto) |
| Validation | Zod |
| ORM | Prisma |
| Database | SQLite (default) |
| Logging | Pino |
| Docs | OpenAPI 3.1 + Swagger UI |

## Quick Start

### Prerequisites

- Node.js >= 22
- Telegram API credentials from [my.telegram.org](https://my.telegram.org)

### Installation

```bash
# Clone
git clone https://github.com/your-org/TeleFlow-Backend.git
cd TeleFlow-Backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Telegram API credentials

# Setup database
npx prisma db push

# Start development server
npm run dev
```

### Docker

```bash
# Using Docker Compose
cp .env.example .env
# Edit .env with your credentials

docker compose up -d
```

### Docker (GHCR)

```bash
docker pull ghcr.io/your-org/teleflow-backend:latest

docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e API_KEY=your-api-key \
  -e SESSION_ENCRYPTION_KEY=your-encryption-key \
  -e TELEGRAM_API_ID=your-api-id \
  -e TELEGRAM_API_HASH=your-api-hash \
  -v teleflow_data:/app/data \
  ghcr.io/your-org/teleflow-backend:latest
```

## API Overview

Once running, visit **http://localhost:3000/docs** for full interactive API documentation.

### Health

```
GET /health          # Health check
GET /version         # Version info
```

### Authentication

```
POST /api/v1/auth/login     # Get API key & JWT
POST /api/v1/auth/logout    # Revoke access
GET  /api/v1/auth/me        # Current user info
```

### Sessions

```
GET    /api/v1/sessions              # List sessions
POST   /api/v1/sessions              # Create session (start login)
GET    /api/v1/sessions/:id          # Get session
DELETE /api/v1/sessions/:id          # Delete session
POST   /api/v1/sessions/:id/connect  # Reconnect session
POST   /api/v1/sessions/:id/disconnect  # Disconnect
POST   /api/v1/sessions/verify-code     # Verify phone code
POST   /api/v1/sessions/verify-password # Verify 2FA
POST   /api/v1/sessions/import          # Import session string
POST   /api/v1/sessions/:id/export      # Export session string
```

### Messages

```
POST /api/v1/messages/send      # Send message
POST /api/v1/messages/reply     # Reply to message
POST /api/v1/messages/edit      # Edit message
POST /api/v1/messages/delete    # Delete messages
POST /api/v1/messages/forward   # Forward messages
POST /api/v1/messages/react     # React to message
POST /api/v1/messages/pin       # Pin message
POST /api/v1/messages/unpin     # Unpin message
POST /api/v1/messages/read      # Mark as read
GET  /api/v1/messages/history   # Get message history
```

### Chats

```
GET  /api/v1/chats               # List chats
GET  /api/v1/chats/:id           # Get chat info
POST /api/v1/chats/join          # Join chat
POST /api/v1/chats/leave         # Leave chat
GET  /api/v1/chats/:id/members   # Get members
POST /api/v1/chats/search        # Search messages
```

### Webhooks

```
GET    /api/v1/webhooks       # List webhooks
POST   /api/v1/webhooks       # Create webhook
PUT    /api/v1/webhooks/:id   # Update webhook
DELETE /api/v1/webhooks/:id   # Delete webhook
```

### Events

```
GET /api/v1/events    # SSE stream
GET /api/v1/ws        # WebSocket
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | **required** |
| `API_KEY` | Default API key | **required** |
| `DATABASE_URL` | Database connection | `file:./teleflow.db` |
| `SESSION_ENCRYPTION_KEY` | Session encryption key | **required** |
| `TELEGRAM_API_ID` | Telegram API ID | **required** |
| `TELEGRAM_API_HASH` | Telegram API Hash | **required** |
| `LOG_LEVEL` | Log level | `info` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `RATE_LIMIT_MAX` | Rate limit max requests | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` |

## Event Types

### Session Events
- `session.connected` / `session.disconnected`
- `session.authorized` / `session.expired`

### Message Events
- `message.created` / `message.edited` / `message.deleted`
- `message.read` / `message.reaction`

### Chat Events
- `chat.joined` / `chat.left` / `chat.updated`

## Error Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "MESSAGE_NOT_FOUND",
    "message": "Message not found"
  }
}
```

## Architecture

```
Client → REST API → Controllers → Services → Telegram Adapter → GramJS → MTProto
```

## Project Structure

```
src/
├── config/         # Environment configuration
├── controllers/    # Route handlers
├── database/       # Prisma client
├── events/         # Event dispatcher
├── middlewares/     # Auth, error handling
├── plugins/        # Fastify plugins
├── routes/         # Route definitions
├── schemas/        # Zod validation schemas
├── services/       # Business logic
├── telegram/       # GramJS adapter
├── types/          # TypeScript types
├── utils/          # Logger, crypto, errors
├── webhooks/       # Webhook delivery
├── server.ts       # Fastify server setup
└── index.ts        # Entry point
```

## License

[Apache License 2.0](LICENSE)
