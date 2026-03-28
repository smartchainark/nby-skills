---
name: nby-notion-smart-categorize
version: 0.2.0
description: This skill should be used when the user asks to "归类", "整理到Resources", "分类", "categorize", "organize pages", or provides a Notion link asking to place it in the correct location. Intelligently categorizes Notion pages into the appropriate subdirectory under a Resources page using content analysis and keyword matching.
allowed-tools: Bash, Read, Write, WebSearch, WebFetch
---

# Notion Smart Categorizer

Intelligently categorize Notion pages into the correct subdirectory under a Resources page using the Notion REST API directly. No MCP plugin required.

## Language

Match the user's language: respond in the same language the user uses.

## Configuration

### Credentials (.env)

Check `.env` existence (priority order):

```bash
# Project-level
test -f .nby-skills/nby-notion-smart-categorize/.env && echo "project"
# User-level
test -f "$HOME/.nby-skills/nby-notion-smart-categorize/.env" && echo "user"
```

| Path | Location |
|------|----------|
| `.nby-skills/nby-notion-smart-categorize/.env` | Project directory |
| `$HOME/.nby-skills/nby-notion-smart-categorize/.env` | User home |

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
test -f .nby-skills/nby-notion-smart-categorize/EXTEND.md && echo "project"
test -f "$HOME/.nby-skills/nby-notion-smart-categorize/EXTEND.md" && echo "user"
```

| Result | Action |
|--------|--------|
| Found | Read, parse, apply settings |
| Not found | Run first-time setup → save → continue |

Supported keys:

| Key | Default | Description |
|-----|---------|-------------|
| `resources_id` | (required) | Resources root page ID |

Category definitions (add as many as needed):

```yaml
resources_id: your_resources_page_id

categories:
  - name: AI开发
    id: your_ai_dev_page_id
    keywords: Claude,GPT,Gemini,LLM,MCP,Skills,Cursor,AI工具,前端,UI
  - name: Web3相关
    id: your_web3_page_id
    keywords: DeFi,链上,套利,合约,代币,钱包,Web3,Solana,ETH
  - name: 内容创作
    id: your_content_page_id
    keywords: 小红书,公众号,视频,播客,内容,文案,剪辑
```

### First-Time Setup

When neither `.env` nor `EXTEND.md` is found, guide the user:

```
Notion Smart Categorizer — First-Time Setup

Step 1: API Token
  → Visit https://www.notion.so/my-integrations
  → Create an integration, copy the token
  → Share target Notion pages with the integration

Step 2: Resources Page
  → Open Resources root page in browser, copy the 32-char ID from URL

Step 3: Categories
  → For each sub-category under Resources:
    - Open the page, copy its ID
    - Define a name and comma-separated keywords

Where to save?
  A) Project-level: .nby-skills/nby-notion-smart-categorize/
  B) User-level: ~/.nby-skills/nby-notion-smart-categorize/
```

After collecting values, create `.env` (token only) and `EXTEND.md` (page IDs and categories).

### Value Priority

```
CLI arguments > EXTEND.md (project) > EXTEND.md (user) > Skill defaults
```

## Classification Rules

### Priority Order (High to Low)

1. **Explicit keyword matching** — Match title and content against `keywords` from each category in `EXTEND.md`
2. **Content semantic analysis** — Analyze the primary topic and domain
3. **Boundary cases** — For cross-domain content, determine primary purpose

For the complete keyword reference and edge case guidance: `references/keyword-mapping.md`

## Execution Workflow

### Step 1: Retrieve Page Information

```bash
# Get title and parent
curl -s "https://api.notion.com/v1/pages/{PAGE_ID}" \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H "Notion-Version: 2022-06-28" \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
for v in d['properties'].values():
    if v.get('type')=='title' and v.get('title'): print('Title:', v['title'][0]['plain_text'])
print('Parent:', d['parent'].get('page_id',''))
"

# Get content (blocks → plain text)
curl -s "https://api.notion.com/v1/blocks/{PAGE_ID}/children?page_size=100" \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H "Notion-Version: 2022-06-28" \
  | python3 -c "
import sys,json; d=json.load(sys.stdin)
types=['paragraph','heading_1','heading_2','heading_3','bulleted_list_item','numbered_list_item','quote','callout']
for r in d['results']:
    t=r['type']
    if t in types:
        print(''.join(x.get('plain_text','') for x in r[t].get('rich_text',[])))
    elif t=='bookmark': print(f\"[link: {r[t].get('url','')}]\")
"
```

- For link-only pages, fetch via Jina: `WebFetch: https://r.jina.ai/{LINK_URL}`
- If fetch fails, classify based on title and link domain only

### Step 2: Analyze and Classify

Based on title and content, apply classification rules:
- Match keywords against configured categories
- Analyze content topic
- Determine best matching subdirectory

### Step 3: Check Current Location

From the parent ID in Step 1:
- Already in target subdirectory → Inform user, no move needed
- In another location → Proceed to move

### Step 4: Execute Classification

```bash
curl -s -X POST "https://api.notion.com/v1/pages/{PAGE_ID}/move" \
  -H "Authorization: Bearer ${NOTION_TOKEN}" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d "{\"parent\": {\"type\": \"page_id\", \"page_id\": \"${TARGET_CATEGORY_ID}\"}}"
```

### Step 5: Report Result

```
✅ Categorization complete

📄 Page: 《Page Title》
📁 From: xxx
📂 To: 📖 Resources → [Category Name]
💡 Reason: [Brief classification rationale]
```

## Batch Mode

When processing multiple pages:

1. Retrieve page information for each, analyze classification
2. Group by target category
3. Execute `POST /move` per page (parallel within same group)
4. Report summary

```
✅ Batch categorization complete

📊 Summary:
- Total: X pages
- [Category 1]: Y pages
- [Category 2]: Z pages

📝 Details:
[Category 1]
  - 《Page 1》- Reason
  - 《Page 2》- Reason
```

## Special Cases

- **Cannot determine category**: Ask user preference, or default to most relevant with explanation
- **Already in correct location**: Report no move needed
- **Adding new categories**: Add a new entry under `categories:` in `EXTEND.md`

## Additional Resources

- **`references/keyword-mapping.md`** — Complete keyword-to-category mapping table with edge case guidance
