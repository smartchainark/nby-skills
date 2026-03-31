# nby-skills

> NBY Team Skills for Claude Code

A collection of Claude Code skills for productivity workflows — Notion, AI media generation, and more.

## Skills

| Skill | Description |
|-------|-------------|
| [nby-notion-reading-notes](./nby-notion-reading-notes/) | AI-powered deep reading notes for Notion Inbox articles |
| [nby-notion-smart-categorize](./nby-notion-smart-categorize/) | Intelligently categorize Notion pages into Resources subdirectories |
| [nby-skill-library-manager](./nby-skill-library-manager/) | Skill library manager — organizes skills in a Git-versioned library with symlink-based enable/disable. Works alongside the official `skill-creator` plugin (it handles HOW, this handles WHERE) |
| [nby-auto-edit](./nby-auto-edit/) | AI auto video editing — from raw recordings to finished video via ASR, green-screen, TTS, subtitles, and Remotion rendering |
| [nby-jimeng-api](./nby-jimeng-api/) | Jimeng AI (即梦) image & video generation — text-to-image, image-to-image, text-to-video, Seedance 2.0 multimodal via OpenAI-compatible API |

## Installation

### Install all skills

```bash
npx skills add smartchainark/nby-skills
```

### Install a specific skill

```bash
npx skills add smartchainark/nby-skills --skill nby-notion-reading-notes
npx skills add smartchainark/nby-skills --skill nby-notion-smart-categorize
npx skills add smartchainark/nby-skills --skill nby-jimeng-api
```

### List available skills

```bash
npx skills add smartchainark/nby-skills --list
```

## Configuration

Each skill uses two config files stored **outside** the skill directory (safe from updates):

| File | Purpose | Contains |
|------|---------|----------|
| `.env` | Credentials | Notion API token |
| `EXTEND.md` | Preferences | Page IDs, categories, options |

### Config File Locations (priority order)

| Path | Scope |
|------|-------|
| `.nby-skills/<skill-name>/.env` | Project-level |
| `~/.nby-skills/<skill-name>/.env` | User-level |

Same paths apply for `EXTEND.md`.

### First-Time Setup

No manual config needed — the skill will **automatically guide** setup on first use, asking for:

1. Notion API token
2. Page IDs
3. Where to save (project or user level)

### Manual Setup

```bash
# Create config directory
mkdir -p ~/.nby-skills/nby-notion-reading-notes

# Copy and edit templates
cp nby-notion-reading-notes/.env.example ~/.nby-skills/nby-notion-reading-notes/.env
cp nby-notion-reading-notes/EXTEND.md.example ~/.nby-skills/nby-notion-reading-notes/EXTEND.md
# Edit both files with your values
```

### Getting your Notion API Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the Internal Integration Secret
4. Share the relevant Notion pages with your integration

### Finding Page IDs

Open a Notion page in the browser. The page ID is the 32-character string in the URL:
```
https://www.notion.so/Your-Page-Title-{page_id_here}
```

## Usage

After configuration, use natural language in Claude Code:

```
# Reading Notes
> AI精读
> 精读 inbox 文章

# Smart Categorize
> 归类这个页面
> 整理到 Resources
```

## License

MIT
