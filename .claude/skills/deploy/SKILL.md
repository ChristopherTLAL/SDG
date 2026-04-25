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

## Commit and Push via GitHub MCP

**ALWAYS use the GitHub MCP (`mcp__github`) for git operations.** Do NOT use local `git` commands — the local disk I/O frequently stalls and causes timeouts.

### Step 1: Read the current file from GitHub to confirm the diff

```
mcp__github__get_file_contents({owner: "ChristopherTLAL", repo: "SDG", path: "<file_path>"})
```

### Step 2: Push changes using GitHub MCP

For each changed file, use `create_or_update_file` to commit and push directly:

```
mcp__github__create_or_update_file({
  owner: "ChristopherTLAL",
  repo: "SDG",
  path: "<file_path>",
  content: "<file_content_base64_or_text>",
  message: "commit message",
  branch: "main",
  sha: "<current_file_sha>"  // from get_file_contents
})
```

For multiple files in one commit, use `push_files`:

```
mcp__github__push_files({
  owner: "ChristopherTLAL",
  repo: "SDG",
  branch: "main",
  message: "commit message",
  files: [
    { path: "src/pages/example.astro", content: "..." },
    ...
  ]
})
```

### Fallback: Local git (only if GitHub MCP is unavailable)

If the GitHub MCP is down, use local git with the temp-index trick to avoid disk I/O issues:

```bash
rm -f /tmp/git_temp_idx
GIT_INDEX_FILE=/tmp/git_temp_idx git read-tree HEAD
GIT_INDEX_FILE=/tmp/git_temp_idx git add <files>
TREE=$(GIT_INDEX_FILE=/tmp/git_temp_idx git write-tree)
COMMIT=$(printf 'message\n' | git commit-tree "$TREE" -p HEAD)
git update-ref refs/heads/main "$COMMIT"
git push
```

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

If something is seriously broken, revert via GitHub MCP by pushing the previous version of the file. Always confirm with the user before reverting.
