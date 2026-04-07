# Project Context: Advisor AI

## Overview
A wealth management demo app ("Advisor AI") that generates meeting prep briefs and follow-up emails for financial advisors. The frontend displays client data (portfolio, life events, action items) and sends prompts to a Node.js backend, which shells out to the Claude CLI (`claude -p`) to generate AI content.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS (custom navy/gold theme)
- **Backend**: Node.js + Express (single `/api/generate` endpoint)
- **AI**: Claude CLI (`@anthropic-ai/claude-code`) called via `child_process.execFile`
- **Containerization**: Docker Compose with `frontend` and `backend` services

## Key Files & Directories
- `src/App.jsx` — Main React app (client list, detail panel, AI panel)
- `src/data/clients.json` — Mock CRM client data
- `src/index.css` — Tailwind + custom styles
- `server/server.js` — Express backend with `/api/generate` endpoint
- `server/package.json` — Backend dependencies
- `server/Dockerfile` — Backend container (installs Claude CLI)
- `Dockerfile` — Frontend container (Vite dev server)
- `docker-compose.yml` — Orchestrates both services
- `vite.config.js` — Vite config with `/api` proxy to backend

## Architecture Notes
- Frontend proxies `/api/*` requests to the backend via Vite's dev server proxy
- In Docker, the proxy target is `http://backend:3001` (service name on shared network)
- For local dev without Docker, the proxy target falls back to `http://localhost:3001`
- The backend calls `claude -p "<prompt>" --output-format text` and returns the stdout
- `ANTHROPIC_API_KEY` is passed to the backend container via environment variable
- No streaming — simple request/response pattern for this POC
- The API key is never exposed to the browser
