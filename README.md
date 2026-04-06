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
| [nby-article-illustrator](./nby-article-illustrator/) | Auto-illustrate Markdown articles — analyze structure, match brand assets, generate scene images via Jimeng image-to-image, insert at optimal positions |
| [nby-xhs-cover](./nby-xhs-cover/) | Xiaohongshu (小红书) style image generator — cover, content, and summary pages in 3:4 vertical format via Jimeng AI. Prompt design adapted from freestylefly/xiaohongshu-skills |
| [openclaw-task-worker](./openclaw-task-worker/) | OpenClaw Task Protocol — join the distributed task network as a worker (claim, execute, submit) or publisher (create tasks for other agents) |
| [nby-awesome-design-md](./nby-awesome-design-md/) | Apply real-world design systems (Stripe, Vercel, Notion, etc.) to your project via DESIGN.md — 54 brands from VoltAgent/awesome-design-md |

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
npx skills add smartchainark/nby-skills --skill nby-article-illustrator
npx skills add smartchainark/nby-skills --skill nby-xhs-cover
npx skills add smartchainark/nby-skills --skill openclaw-task-worker
```

### List available skills

```bash
npx skills add smartchainark/nby-skills --list
```

## Configuration

Each skill uses two config files stored **outside** the skill directory (safe from updates):

| File | Purpose | Contains |
|------|---------|----------|
| `.env` | Credentials | API tokens, session IDs |
| `EXTEND.md` | Preferences | Page IDs, default settings, options |

### Config File Locations (priority order)

| Path | Scope |
|------|-------|
| `.nby-skills/<skill-name>/.env` | Project-level |
| `~/.nby-skills/<skill-name>/.env` | User-level |

Same paths apply for `EXTEND.md`.

### First-Time Setup

No manual config needed — each skill will **automatically guide** setup on first use.

### Notion Skills Setup

<details>
<summary>Getting your Notion API Token & Page IDs</summary>

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the Internal Integration Secret
4. Share the relevant Notion pages with your integration

Page IDs can be found in the URL — the 32-character string after the page title:
```
https://www.notion.so/Your-Page-Title-{page_id_here}
```

Manual setup:
```bash
mkdir -p ~/.nby-skills/nby-notion-reading-notes
cp nby-notion-reading-notes/.env.example ~/.nby-skills/nby-notion-reading-notes/.env
cp nby-notion-reading-notes/EXTEND.md.example ~/.nby-skills/nby-notion-reading-notes/EXTEND.md
```
</details>

### Jimeng API Setup

<details>
<summary>Docker deployment & session ID</summary>

**1. Deploy the service (one command):**
```bash
docker run -it -d --init --name jimeng-free-api-all \
  -p 8000:8000 -e TZ=Asia/Shanghai \
  wwwzhouhui569/jimeng-free-api-all:latest
```

**2. Get your session ID:**
1. Visit [Jimeng AI](https://jimeng.jianying.com/) and log in
2. Press F12 → Application → Cookies
3. Copy the `sessionid` value

**3. Configure:**
```bash
mkdir -p ~/.nby-skills/nby-jimeng-api
cp nby-jimeng-api/.env.example ~/.nby-skills/nby-jimeng-api/.env
# Edit .env and set JIMENG_SESSION_ID=your_sessionid
```

Multiple accounts supported (comma-separated): `JIMENG_SESSION_ID=sid1,sid2`
</details>

## Usage

After installation and configuration, just use natural language in Claude Code. Each skill is triggered automatically based on your request. See individual skill directories for detailed usage and examples.

## License

MIT
