---
name: sanity-content
description: Manage content in the Sanity CMS for the Chinese SDGs Institute website. Use this skill when the user wants to create, edit, delete, or publish posts, projects, or dialogues in Sanity. Also use when the user asks about content management, bulk operations on Sanity documents, or querying existing content. Covers GROQ queries, document patching, publishing drafts, and schema operations.
---

# Sanity Content Management

Manage content for the Chinese SDGs Institute website via Sanity MCP.

## Connection Details
- Project ID: `waxbya4l`
- Dataset: `production`
- Workspace: `default`

## Content Types

### Post (news/research/policy-brief)
Fields: `title` (localizedString), `slug`, `contentType`, `sdgTags` (SDG 1-17), `mainImage`, `excerpt` (localizedText), `body` (localizedBlockContent), `author` (ref), `publishedAt`, `readingTime`

### Project
Fields: `title` (localizedString), `slug`, `status` (active|recruiting|ongoing|completed), `description` (localizedText), `body` (localizedBlockContent), `mainImage`, `team`, `sdgTags`, `icon` (Material Symbol name)

### Dialogue (events)
Fields: `title` (localizedString), `slug`, `eventType` (assembly|panel|workshop|forum), `date`, `endDate`, `location` (localizedString), `description` (localizedText), `body` (localizedBlockContent), `featured`, `sdgTags`

## Common Operations

### Query documents
Use `query_documents` with GROQ. Always call `get_schema` first to verify field names.

```groq
// All posts sorted by date
*[_type == "post"] | order(publishedAt desc) { title, slug, contentType, publishedAt }

// Posts by SDG tag
*[_type == "post" && "SDG 13" in sdgTags] { title, slug }

// Active projects
*[_type == "project" && status == "active"] { title, slug, icon }
```

### Create documents
Use `create_documents_from_json`. Localized fields use `{en: "...", zh: "..."}` structure.

### Patch documents
Use `patch_document_from_json` with `set`, `unset`, or `append` operations.
- Patching a published document creates a draft
- Always `publish_documents` after patching to make changes live

### Bulk operations
When patching multiple documents (e.g., removing a field from all posts):
1. Query all document IDs first
2. Patch in batches of 8 (MCP parallel call limit)
3. Publish all patched documents in one call

### Image handling
The site uses a deterministic illustration fallback system (`src/utils/illustrations.ts`). If no `mainImage` is set on a post, an illustration is automatically assigned based on the post's slug and SDG tags. Only set `mainImage` when the user explicitly uploads a custom image via Sanity Studio.

## i18n Pattern
All user-facing text fields use localized variants:
```json
{
  "title": { "en": "English Title", "zh": "Chinese Title" },
  "excerpt": { "en": "English excerpt", "zh": "Chinese excerpt" }
}
```
Body content uses `localizedBlockContent` with `en` and `zh` keys containing Portable Text blocks.
