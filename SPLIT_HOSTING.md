# Split Frontend + Backend (Safe Trial)

This repo now supports running backend separately without removing the current Vercel setup.

## Local trial

1. Start backend:
   - `npm run dev:backend`
   - Runs on `http://localhost:3001`
2. Start frontend:
   - `npm run dev`
   - Vite proxies `/api/*` to `http://localhost:3000` by default.
   - To point frontend to split backend, run:
     - PowerShell: `$env:VITE_API_PROXY_TARGET='http://localhost:3001'; npm run dev`

## Deploy split architecture

1. Deploy backend service from this repo with start command:
   - `node backend/server.js`
2. Set backend environment variables the same as Vercel API had:
   - `MONGODB_URI`, `JWT_SECRET`, mail creds, Last.fm keys, `CRON_SECRET`, etc.
3. Keep frontend on Vercel and rewrite `/api/*` to backend URL.
   - Example destination: `https://your-backend-domain/api/:path*`

## Instant rollback path

No existing Vercel serverless routes were removed.

To roll back to current behavior:
1. Keep using existing `vercel.json` rewrites to internal `/api/*`.
2. Ignore the new `backend/server.js`.

Optional full revert of split trial changes:
- `git restore package.json package-lock.json vite.config.js`
- `git clean -f backend/server.js SPLIT_HOSTING.md`
