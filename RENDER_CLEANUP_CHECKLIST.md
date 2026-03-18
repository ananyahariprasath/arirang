# Render Migration Cleanup Checklist

Use this only after Render has been stable for at least 1-2 weeks.

## Pre-checks

1. Confirm no production traffic is still hitting Vercel Functions.
2. Confirm auth, admin, topic rooms, cron sync, and email flows work from Render.
3. Keep one known-good rollback commit/tag.

## Cleanup steps

1. Keep frontend on Vercel and proxy `/api/*` to Render in `vercel.json`.
2. Remove Vercel-specific API runtime/deployment dependencies if no longer needed.
3. Remove unused scripts:
   - `dev:api` (if you no longer use `vercel dev`)
4. Keep `backend/server.js` as canonical backend entry.
5. Update docs to mark Render backend as primary.

## Validate after cleanup

1. `npm run build` passes.
2. Login/signup/password reset work.
3. Admin panel save actions work.
4. Region manager save/update/delete works.
5. Topic rooms create/join/chat works.
6. Last.fm sync and scheduled jobs still run.

## Rollback plan

1. Revert to rollback commit/tag.
2. Restore previous `vercel.json` API routing.
3. Redeploy frontend.
