---
name: nby-jimeng-api
version: 0.1.0
description: |
  Jimeng AI (即梦) image and video generation via locally deployed jimeng-free-api-all
  Docker service. Covers text-to-image, image-to-image, text-to-video, and multimodal
  Seedance 2.0 video generation using an OpenAI-compatible API at localhost:8000.
  Supports models including jimeng-5.0, jimeng-4.6, jimeng-video-3.5-pro, and seedance-2.0.
  This skill should be used when the user asks to generate images or videos with Jimeng,
  manage the jimeng-free-api-all Docker container, or troubleshoot Jimeng API issues.
  Trigger phrases: "即梦生图", "即梦视频", "jimeng generate", "jimeng image",
  "jimeng video", "用即梦画", "即梦 API", "generate image with jimeng",
  "create video with jimeng", "text to image jimeng", "图生图", "文生视频".
allowed-tools: [Bash, Read, Write]
---

# Jimeng API - 即梦 AI 图片/视频生成

通过本地 Docker 部署的 jimeng-free-api-all 服务（OpenAI 兼容接口），调用即梦 AI 生成图片和视频。

## Workflow Overview

Every Jimeng generation task follows these steps:

1. **Confirm service** — check Docker container `jimeng-free-api-all` is running on `localhost:8000`
2. **Obtain session ID** — check `$JIMENG_SESSION_ID` env var; if not set, ask the user for their Jimeng sessionid
3. **Select endpoint & model** — pick the right API endpoint and model for the task (see quick reference below)
4. **Call API** — execute the curl command with exact headers, endpoint path, and JSON payload (low freedom: follow precisely)
5. **Download & save** — generated URLs are temporary; immediately download to the user's desired location

## Configuration

### Credentials (.env)

Check `.env` existence (priority order):

```bash
# Project-level
test -f .nby-skills/nby-jimeng-api/.env && echo "project"
# User-level
test -f "$HOME/.nby-skills/nby-jimeng-api/.env" && echo "user"
```

| Path | Scope |
|------|-------|
| `.nby-skills/nby-jimeng-api/.env` | Project-level |
| `~/.nby-skills/nby-jimeng-api/.env` | User-level |

If neither exists, ask the user for their Jimeng session ID and offer to save it.

Load credentials:
```bash
# Source .env (project-level first, then user-level)
if [ -f .nby-skills/nby-jimeng-api/.env ]; then
  source .nby-skills/nby-jimeng-api/.env
elif [ -f "$HOME/.nby-skills/nby-jimeng-api/.env" ]; then
  source "$HOME/.nby-skills/nby-jimeng-api/.env"
fi
```

Auth header format: `Authorization: Bearer $JIMENG_SESSION_ID`

Multiple accounts supported (comma-separated): `JIMENG_SESSION_ID=sid1,sid2,sid3`

## Quick Reference

| Task | Endpoint | Recommended Model |
|------|----------|-------------------|
| Text-to-image | `POST /v1/images/generations` | `jimeng-4.6` or `jimeng-5.0` |
| Image-to-image | `POST /v1/images/generations` (add `images` param) | `jimeng-4.6` |
| Text-to-video (sync) | `POST /v1/videos/generations` | `jimeng-video-3.5-pro` |
| Text-to-video (async) | `POST /v1/videos/generations/async` | `jimeng-video-3.5-pro` |
| Query async result | `GET /v1/videos/generations/async/:taskId` | - |
| Seedance multimodal video | `POST /v1/videos/generations` (multipart) | `seedance-2.0` or `seedance-2.0-fast` |
| List models | `GET /v1/models` | - |

For full model list and resolution tables, see [references/models.md](references/models.md).
For detailed API parameters and response formats, see [references/api-detail.md](references/api-detail.md).
For Seedance multimodal details, see [references/seedance.md](references/seedance.md).

## Docker Container Management

```bash
# Check status
docker ps --filter name=jimeng-free-api-all

# Start (if not running)
docker run -it -d --init --name jimeng-free-api-all \
  -p 8000:8000 -e TZ=Asia/Shanghai \
  wwwzhouhui569/jimeng-free-api-all:latest

# Stop / Restart / Logs
docker stop jimeng-free-api-all
docker start jimeng-free-api-all
docker logs jimeng-free-api-all --tail 50
```

## Text-to-Image

```bash
curl -s -X POST http://localhost:8000/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -d '{
    "model": "jimeng-4.6",
    "prompt": "图片描述",
    "ratio": "1:1",
    "resolution": "2k"
  }'
```

Key params: `model`, `prompt` (required), `ratio` (1:1/4:3/16:9/9:16/...), `resolution` (1k/2k/4k), `negative_prompt`, `sample_strength` (0-1).

Returns `data[]` with multiple image URLs (typically 4). Download immediately:
```bash
curl -s -o output.png "IMAGE_URL"
```

## Image-to-Image

Same endpoint, add `images` array (1-10 image URLs):

```bash
curl -s -X POST http://localhost:8000/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -d '{
    "model": "jimeng-4.6",
    "prompt": "将图片转换为水彩画风格",
    "images": ["https://example.com/input.jpg"],
    "ratio": "1:1",
    "resolution": "2k"
  }'
```

## Video Generation (Sync)

Blocks until video is ready. May take several minutes.

```bash
curl -s -X POST http://localhost:8000/v1/videos/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -d '{
    "model": "jimeng-video-3.5-pro",
    "prompt": "视频描述",
    "ratio": "16:9",
    "resolution": "720p",
    "duration": 5
  }'
```

Key params: `duration` (5 or 10 sec for normal models, 4-15 for Seedance), `file_paths` (first/last frame URLs).

## Video Generation (Async) — Recommended for long tasks

**Submit task:**
```bash
curl -s -X POST http://localhost:8000/v1/videos/generations/async \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -d '{
    "model": "jimeng-video-3.5-pro",
    "prompt": "视频描述",
    "ratio": "16:9",
    "resolution": "720p",
    "duration": 5
  }'
```

Returns `{"task_id": "...", "status": "processing"}`.

**Query result (blocks until done):**
```bash
curl -s "http://localhost:8000/v1/videos/generations/async/TASK_ID" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID"
```

Limits: max 10 concurrent async tasks. Tasks auto-expire after 24 hours.

## Seedance 2.0 Multimodal Video

Supports mixed image/video/audio upload. Use `@1`, `@2` placeholders in prompt to reference uploaded files.

```bash
curl -X POST http://localhost:8000/v1/videos/generations \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -F "model=jimeng-video-seedance-2.0" \
  -F "prompt=@1 和 @2 两人开始跳舞" \
  -F "ratio=4:3" \
  -F "duration=4" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg"
```

For full Seedance details (supported formats, fast mode, audio mixing), see [references/seedance.md](references/seedance.md).

## Error Handling

| HTTP/Response | Meaning | Action |
|---------------|---------|--------|
| Service unreachable | Container not running | `docker start jimeng-free-api-all` |
| 401 / token error | sessionid expired | Ask user to re-login and get new sessionid |
| `credit prededuct failed` | Insufficient credits | Switch account or wait (66 free credits/day) |
| `[API_CONTENT_FILTERED]` | Content policy violation | Revise prompt to avoid sensitive content |
| `[API_IMAGE_GENERATION_FAILED]` | Generation timeout/failure | Retry or use async endpoint |
| `shark not pass` | Seedance anti-crawl block | Ensure container is v0.8.4+, has Chromium installed |
| Async task limit exceeded | >10 concurrent tasks | Wait for existing tasks to complete |

## Troubleshooting

```bash
# Check container status and logs
docker ps --filter name=jimeng-free-api-all
docker logs jimeng-free-api-all --tail 30

# Test service connectivity
curl -s http://localhost:8000/v1/models | python3 -m json.tool | head -10

# Check if port is in use by another process
lsof -i :8000
```
