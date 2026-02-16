# Vercel Deployment Guide

Now that you've connected your Git repository, follow these steps to launch **Arirarirang** on Vercel.

## 1. Project Configuration
When you import your repository on [Vercel](https://vercel.com/new), use these settings:

- **Framework Preset**: `Vite` (Vercel usually detects this automatically).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 2. Environment Variables
If you added any custom API keys or environment variables (e.g., `VITE_API_URL`), add them in the **"Environment Variables"** section during setup.

## 3. Automatic Deployments
- **Main Branch**: Every time you `git push` to your main branch, Vercel will automatically build and deploy the new version.
- **Preview Deployments**: Push to any other branch to get a unique "Preview URL" to test changes before merging.

## 4. SPA Routing (Already Added)
I've already created the [vercel.json](file:///c:/Users/anu/Desktop/BTS/lavender-cb-project/vercel.json) file in your root directory. This ensures that:
- Refreshing the page doesn't show a 404 error.
- Direct navigation to paths works perfectly.

---
🚀 **Ready to launch?** Just click "Deploy" and your dashboard will be live in ~2 minutes!
