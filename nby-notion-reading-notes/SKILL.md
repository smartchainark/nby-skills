---
name: nby-notion-reading-notes
version: 0.2.0
description: This skill should be used when the user asks to "AI精读", "精读", "reading notes", "process inbox articles", "生成阅读笔记", "inbox整理", "文章总结", or wants to generate deep reading notes for Notion Inbox pages. Automatically generates structured notes including one-line summary, key insights table, resource links extraction, and actionable suggestions.
allowed-tools: Bash, WebFetch
---

# Notion Inbox AI Reading Notes Generator

Generate deep reading notes for articles under a Notion Inbox page using the Notion REST API directly. No MCP plugin required. Default fast mode: batch parallel processing, no web search.

## Language

Match the user's language: respond in the same language the user uses.

## Configuration

### Credentials (.env)

Check `.env` existence (priority order):

```bash
# Project-level
test -f .nby-skills/nby-notion-reading-notes/.env && echo "project"
# User-level
test -f "$HOME/.nby-skills/nby-notion-reading-notes/.env" && echo "user"
```

| Path | Location |
|------|----------|
| `.nby-skills/nby-notion-reading-notes/.env` | Project directory |
| `$HOME/.nby-skills/nby-notion-reading-notes/.env` | User home |

| Result | Action |
|--------|--------|
| Found | Load credentials, continue |
| Not found | Run first-time setup → save → continue |

Required keys:

```bash
NOTION_TOKEN=your_notion_api_token
```

### Preferences (EXTEND.md)

Check `EXTEND.md` existence (same priority order):

```bash
test -f .nby-skills/nby-notion-reading-notes/EXTEND.md && echo "project"
test -f "$HOME/.nby-skills/nby-notion-reading-notes/EXTEND.md" && echo "user"
```

| Result | Action |
|--------|--------|
| Found | Read, parse, apply settings |
| Not found | Run first-time setup → save → continue |

Supported keys:

| Key | Default | Description |
|-----|---------|-------------|
| `inbox_id` | (required) | Inbox page ID containing articles to process |
| `target_id` | (required) | Destination page ID for processed articles |
| `batch_size` | 3 | Articles per batch |
| `note_language` | zh | Note language: zh or en |

Example `EXTEND.md`:

```yaml
inbox_id: your_inbox_page_id
target_id: your_target_page_id
batch_size: 3
note_language: zh
```

### First-Time Setup

When neither `.env` nor `EXTEND.md` is found, guide the user:

```
Notion Reading Notes — First-Time Setup

Step 1: API Token
  → Visit https://www.notion.so/my-integrations
  → Create an integration, copy the token
  → Share target Notion pages with the integration

Step 2: Page IDs
  → Open Inbox page in browser, copy the 32-char ID from URL
  → Open target page (e.g., "AI精读") in browser, copy its ID

Where to save?
  A) Project-level: .nby-skills/nby-notion-reading-notes/
  B) User-level: ~/.nby-skills/nby-notion-reading-notes/
```

After collecting values, create both `.env` (token only) and `EXTEND.md` (page IDs and preferences).

### Value Priority

```
CLI arguments > EXTEND.md (project) > EXTEND.md (user) > Skill defaults
```

## API Quick Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List Inbox children | GET | `/v1/blocks/{inbox_id}/children?page_size=100` |
| Get page content | GET | `/v1/blocks/{id}/children?page_size=100` |
| **Move page** | **POST** | **`/v1/pages/{id}/move`** |
| Append notes | PATCH | `/v1/blocks/{id}/children` |

**Important: Use POST `/move` for moving pages. PATCH to set parent is silently ignored by Notion.**

## Core Workflow (Batch Parallel)

```
Round 1: List all Inbox child pages, record IDs and titles
── Per batch (configurable, default 3) ──
Round 2: Read all articles in batch in parallel (N concurrent Bash calls)
Round 2.5 (if needed): Fetch external link content via Jina WebFetch
Round 3: Analyze batch → write JSON + append notes in parallel (N Bash calls)
Round 4: Move to target page in parallel (N Bash calls)
── Next batch ──
```

**Key principles:**
- **No detection needed**: Everything in Inbox is unprocessed
- **No web search**: Extract resource links only from article content
- **Batch size**: Balance speed with Notion API rate limit (3 req/s)
- **Append then move**: Append notes (Round 3) before moving (Round 4) to avoid 429 errors
- **Non-blocking failures**: Log failures, continue to next article

## Execution Steps

### Round 1: List Inbox Children

```bash
curl -s "https://api.notion.com/v1/blocks/${INBOX_ID}/children?page_size=100" \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H "Notion-Version: 2022-06-28" \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
for r in d['results']:
    if r['type']=='child_page': print(f\"{r['id']} → {r['child_page']['title']}\")
"
```

Split results into batches per configured `batch_size`.

### Round 2: Read Article Content in Parallel

For each article in the batch, launch a concurrent Bash call:

```bash
curl -s "https://api.notion.com/v1/blocks/{PAGE_ID}/children?page_size=100" \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H "Notion-Version: 2022-06-28" \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
types=['paragraph','heading_1','heading_2','heading_3','bulleted_list_item','numbered_list_item','quote','callout','toggle','code']
for r in d['results']:
    t=r['type']
    if t in types:
        print(''.join(x.get('plain_text','') for x in r[t].get('rich_text',[])))
    elif t=='bookmark': print(f\"[link: {r[t].get('url','')}]\")
    elif t=='image': print('[image]')
    elif t=='table': print('[table]')
if d.get('has_more'): print(f'has_more, cursor={d[\"next_cursor\"]}')
"
```

- **Pagination**: Use `&start_cursor={next_cursor}` for additional pages
- **Link-only pages**: Mark as "⚠️ Insufficient content, skipped"

### Round 2.5 (If Needed): Fetch External Content

For articles whose body is primarily a bookmark link, fetch via Jina:

```
WebFetch: https://r.jina.ai/{LINK_URL}
```

Launch multiple WebFetch calls in parallel. Mark as "insufficient content" on failure. Skip for articles with adequate content.

### Round 3: Analyze + Append Notes in Parallel

Analyze all articles in batch, generate note JSON. Launch concurrent Bash calls:

```bash
cat <<'NOTEJSON' > /tmp/notion_note_{PAGE_ID}.json
{note JSON content}
NOTEJSON
curl -s -X PATCH "https://api.notion.com/v1/blocks/{PAGE_ID}/children" \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d @/tmp/notion_note_{PAGE_ID}.json
```

For JSON template details, refer to `references/note-template.md`.

### Round 4: Move to Target Page in Parallel

```bash
curl -s -X POST "https://api.notion.com/v1/pages/{PAGE_ID}/move" \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d "{\"parent\":{\"type\":\"page_id\",\"page_id\":\"${TARGET_ID}\"}}"
```

### Completion Report

```
✅ AI Reading Notes Complete: X succeeded, Y failed
1. 《Title A》- Core: xxx
2. 《Title B》- Core: xxx
```

## Note Generation Guidelines

- Design table columns dynamically based on article type (technical/opinion/tools/methodology)
- Bold first column with `"annotations": {"bold": true}`
- **🔗 Resources**: Conditional — only when article contains tool/library links; extract only, no web search
- **💡 Insights**: Required — 2-4 actionable bullet points, personalized, concise

For full JSON templates: `references/note-template.md`

## Error Handling

- **Insufficient content**: Move to target, append "⚠️ Insufficient content, skipped"
- **Pagination**: Continue with `start_cursor` until `has_more=false`
- **Single failure**: Log, skip to next
- **API 429**: Wait 2s, retry up to 3 times
- **File conflicts**: Each article uses `/tmp/notion_note_{PAGE_ID}.json`

## Additional Resources

- **`references/note-template.md`** — Notion Block JSON templates, formatting rules, optional sections
