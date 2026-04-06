---
name: deploy
description: Build, commit, push, and monitor deployment of the Chinese SDGs Institute website to Vercel. Use this skill whenever the user says "deploy", "push", "ship it", "go live", or asks to publish changes to production. Also use when the user wants to check deployment status or build logs.
---

# Deploy to Production

This skill handles the full deployment pipeline for the Chinese SDGs Institute Astro website on Vercel.

## Pre-flight Checks

Before deploying, verify the build succeeds locally:

```bash
npm run build
```

If the build fails, fix errors before proceeding. Common issues:
- esbuild parse errors from Chinese smart quotes in inline JS (replace `"..."` with `「...」`)
- Missing imports after adding new utilities
- TypeScript errors in `.astro` frontmatter

## Commit and Push

1. Run `git status` and `git diff --stat` to review changes
2. Stage only relevant files (avoid `.env`, `node_modules`, credentials)
3. Write a concise commit message describing what changed and why
4. Push to `main` branch — Vercel auto-deploys from main

## Monitor Deployment

After pushing, use the Vercel MCP to check deployment status:
- Project ID: `prj_w18fCX7v0HehmmcniPudW14KT1jd`
- Team: `team_sY07tF50KEQ5trHhwXaRBuC5`

Use `list_deployments` to find the latest deployment, then `get_deployment` to check its status. If the deployment fails, use `get_deployment_build_logs` to diagnose.

## Post-deploy Verification

After successful deployment, verify key pages load:
- Homepage
- Research index
- A post detail page
- Tools page
- Certificate verification page (standalone, must remain functional)

## Rollback

If something is seriously broken, the user can revert via:
```bash
git revert HEAD
git push
```
Always confirm with the user before reverting.
