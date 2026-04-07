# Coding Agent Context

## Routing & Registration Rules
- Frontend has no router — it's a single-page app with state-driven panels
- Backend has one endpoint: `POST /api/generate` in `server/server.js`
- Any new API endpoints must be added to `server/server.js`
- The Vite proxy in `vite.config.js` forwards `/api/*` to the backend — no changes needed for new endpoints under `/api`

## File Naming & Structure
- Frontend components are all in `src/App.jsx` (single file for this POC)
- Client data lives in `src/data/clients.json`
- Backend code lives in `server/` directory
- Both `package.json` files use `"type": "module"` (ES module imports)

## Common Pitfalls
- Run `npm install` in **both** root (`/`) and `server/` directories after adding dependencies
- The Claude CLI requires `ANTHROPIC_API_KEY` in the environment — the Docker Compose passes it from the host's env
- When running locally (not Docker), start the backend first (`cd server && npm run dev`) then the frontend (`npm run dev`)
- The Claude CLI can take 30-60 seconds to respond — the frontend shows a loading state during this time
- Backend uses `execFile` (not `exec`) for safety — prompts are passed as arguments, not shell-interpolated
