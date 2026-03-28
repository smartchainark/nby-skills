# Notion Block JSON Templates

## Note Structure

Each article uses an independent file `/tmp/notion_note_{PAGE_ID}.json` to avoid parallel conflicts.

## Base Template

```json
{
  "children": [
    {"type": "divider", "divider": {}},
    {"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "📝 阅读笔记"}}]}},
    {"type": "paragraph", "paragraph": {"rich_text": [
      {"type": "text", "text": {"content": "核心一句话总结："}, "annotations": {"bold": true}},
      {"type": "text", "text": {"content": "[one-line summary]"}}
    ]}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "💎 最有价值的内容"}}]}},
    {"type": "table", "table": {"table_width": 3, "has_column_header": true, "has_row_header": false, "children": [
      {"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": "Dynamic Col 1"}}], [{"type": "text", "text": {"content": "Dynamic Col 2"}}], [{"type": "text", "text": {"content": "Dynamic Col 3"}}]]}},
      {"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": "Key Point"}}], [{"type": "text", "text": {"content": "Content"}}], [{"type": "text", "text": {"content": "Value"}}]]}}
    ]}},
    {"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "💡 对我的启发"}}]}},
    {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "[actionable suggestion 1]"}}]}},
    {"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": "[actionable suggestion 2]"}}]}},
    {"type": "divider", "divider": {}}
  ]
}
```

## Conditional Section: 🔗 Resources

Insert **before** the 💡 Insights section, only when the article contains tool/library links:

```json
{"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": "🔗 相关资源"}}]}},
{"type": "table", "table": {"table_width": 3, "has_column_header": true, "has_row_header": false, "children": [
  {"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": "名称"}}], [{"type": "text", "text": {"content": "类型"}}], [{"type": "text", "text": {"content": "链接"}}]]}},
  {"type": "table_row", "table_row": {"cells": [[{"type": "text", "text": {"content": "Tool Name"}}], [{"type": "text", "text": {"content": "Library/Tool"}}], [{"type": "text", "text": {"content": "URL from article"}}]]}}
]}}
```

**Rules for 🔗 Resources:**
- Only insert when article contains tool/library/platform links
- Extract from bookmarks and inline URLs — do not web search
- Identify tool/library/MCP/platform names, pair with existing links
- For tools without links in the article, list name only, leave link column empty
- Omit entire section when no relevant resources exist

## Optional Sections

Insert before 💡 Insights as needed:
- ⚠️ Important Warnings
- 📌 Action Items

## Table Design Rules

- Design column names dynamically based on article type:
  - **Technical articles**: Technology / Use Case / Key Insight
  - **Opinion articles**: Viewpoint / Evidence / Implication
  - **Tool articles**: Tool / Feature / Scenario
  - **Methodology articles**: Step / Method / Expected Result
- Extract row count from actual content
- Bold first column keywords: `"annotations": {"bold": true}`
- Enable column headers: `"has_column_header": true`

## 💡 Insights Section Rules (Required)

- 2-4 `bulleted_list_item` entries
- Personalize to user background
- Provide directly applicable suggestions for current projects
- Highlight tools/methods/ideas worth trying
- Connect to existing tech stack or workflows
- Keep tone concise and practical — avoid vague advice; each suggestion must be actionable
