# Vercel Deployment Guide

Now that you've connected your Git repository, follow these steps to launch **Arirarirang** on Vercel.

## 1. Project Configuration
When you import your repository on [Vercel](https://vercel.com/new), use these settings:

- **Framework Preset**: `Vite` (Vercel usually detects this automatically).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 2. Environment Variables
Add these in Vercel Project Settings -> **Environment Variables**:

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB_NAME`: database name (example: `lavender_cb`)

These are required for serverless APIs used by:
- `POST/GET/DELETE /api/support-tickets`
- `POST/GET /api/proof-submissions`

## 3. Automatic Deployments
- **Main Branch**: Every time you `git push` to your main branch, Vercel will automatically build and deploy the new version.
- **Preview Deployments**: Push to any other branch to get a unique "Preview URL" to test changes before merging.

## 4. SPA Routing (Already Added)
`vercel.json` is configured so API routes work first and SPA fallback works for everything else. This ensures:
- Refreshing the page doesn't show a 404 error.
- Direct navigation to paths works perfectly.
- `api/*` requests are routed to serverless functions (not `index.html`).

---
🚀 **Ready to launch?** Just click "Deploy" and your dashboard will be live in ~2 minutes!
