# 🎓 UniPortal V3 - The Best Educational Management System

A high-performance, real-time school portal built for professional environments. Powered by Node.js, React, PostgreSQL, and AI.

## 🌟 Top-Tier Features

- **🛡️ Iron-Clad Security:** Dual-layer authentication with Firebase Identity and Backend JWT verification.
- **🐘 Relational Mastery:** Full PostgreSQL database with Sequelize ORM for ACID-compliant transactions.
- **🤖 Contextual AI:** Google Gemini-powered tutor that understands student academic records and financial status.
- **📡 Real-Time Heartbeat:** Socket.io integration for instant treasury verification and registry updates.
- **📊 Admin Command Center:** Professional CRM-style dashboard for managing thousands of students and millions in revenue.
- **🪵 Forensic Logging:** Winston-powered logging for every critical action (Payments, Grades, Attendance).
- **🐋 Dockerized:** Production-ready `docker-compose` setup for one-click global deployment.

## 🛠️ Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS + Framer Motion
- **Backend:** Node.js (ESM) + Express
- **Database:** PostgreSQL 15
- **Real-time:** Socket.io
- **Identity:** Firebase Auth + Admin SDK
- **AI:** Google Generative AI (Gemini Pro)

## 🚀 One-Click Start (Docker)

Ensure Docker Desktop is running, then:
```bash
docker-compose up --build
```

## 🛠️ Manual Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   - Create `.env` based on `.env.example`.
   - Add your `GOOGLE_AI_KEY` and `DATABASE_URL`.
   - Place `serviceAccountKey.json` in the root.

### 🌐 Setting Environment Variables for Deployment

#### 1. Backend Web Service (`server.js` / `websocket_server.js`)
Set runtime environment variables on your hosting provider (Render, Railway, Heroku, AWS, DigitalOcean, etc.) or in `.env`:
- `PORT`: Port for Express & Socket.io server (default: `5000`)
- `WS_PORT`: Port for standalone WebSocket server (default: `8080`)
- `CORS_ORIGIN`: Allowed origins (e.g. `https://yourdomain.com` or `*`)
- `DATABASE_URL`: PostgreSQL connection string

#### 2. Frontend Static Files (Vite / React)
Vite environment variables prefixed with `VITE_` are embedded into the client bundle **at build time**:
- `VITE_API_URL`: Backend API base URL (e.g. `https://api.yourdomain.com`)
- `VITE_SOCKET_URL`: Socket.io server URL (e.g. `https://api.yourdomain.com`)

*Build static assets with env variables:*
```bash
VITE_API_URL=https://api.yourdomain.com VITE_SOCKET_URL=https://api.yourdomain.com npm run build
```

3. **Launch Everything:**
   ```bash
   npm run dev:all
   ```

## 🌐 Deploying to Render

This repository includes a `render.yaml` blueprint for automatic configuration on Render.

- **Root Directory:** `.` (the repository root)
- **Dockerfile Path:** `Dockerfile` (or `./Dockerfile`)
- **Docker Context:** `.`

---
**Institutional Registry • Digital Confirmation • 2025**
