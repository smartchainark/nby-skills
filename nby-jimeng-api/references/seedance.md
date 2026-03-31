# Seedance 2.0 Multimodal Video Generation

Seedance 2.0 is Jimeng's advanced multimodal video model. It supports mixed image/video/audio uploads for intelligent video generation.

## Models

| Model | Internal | Speed | Description |
|-------|----------|-------|-------------|
| `jimeng-video-seedance-2.0` | `dreamina_seedance_40_pro` | Standard | Full quality, recommended |
| `seedance-2.0` | same | Standard | Alias |
| `seedance-2.0-pro` | same | Standard | Alias |
| `jimeng-video-seedance-2.0-fast` | `dreamina_seedance_40` | Fast | Faster generation |
| `seedance-2.0-fast` | same | Fast | Alias |

## Parameters

**POST /v1/videos/generations** (multipart/form-data)

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| model | string | Yes | - | Must be a seedance model |
| prompt | string | No | - | Use @1, @2 to reference uploaded files |
| ratio | string | No | 4:3 | Aspect ratio |
| duration | number | No | 4 | Duration: 4-15 seconds |
| files | file[] | Yes* | - | Uploaded media files (multipart) |
| file_paths | array | Yes* | - | Media URLs (JSON mode) |

*Either `files` or `file_paths` must be provided.

## Supported Media Types

| Type | Formats | Upload Method |
|------|---------|---------------|
| Image | jpg, png, webp, gif, bmp | ImageX channel |
| Video | mp4, mov, m4v | VOD channel |
| Audio | mp3, wav | VOD channel |

## Prompt Placeholders

Reference uploaded files by order:
- `@1` / `@图1` / `@image1` — first uploaded file
- `@2` / `@图2` / `@image2` — second uploaded file
- And so on...

## Usage Examples

### Multi-image video

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

### Fast mode

```bash
curl -X POST http://localhost:8000/v1/videos/generations \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -F "model=jimeng-video-seedance-2.0-fast" \
  -F "prompt=@1 图片中的人物开始微笑" \
  -F "ratio=4:3" \
  -F "duration=5" \
  -F "files=@/path/to/image1.jpg"
```

### Image + Audio mixing

```bash
curl -X POST http://localhost:8000/v1/videos/generations \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -F "model=jimeng-video-seedance-2.0-fast" \
  -F "prompt=@1 图片中的人物随着音乐 @2 开始跳舞" \
  -F "ratio=9:16" \
  -F "duration=5" \
  -F "files=@/path/to/image.png" \
  -F "files=@/path/to/audio.wav"
```

### JSON mode (with URLs instead of file upload)

```bash
curl -s -X POST http://localhost:8000/v1/videos/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -d '{
    "model": "seedance-2.0-fast",
    "prompt": "@1 图片中的人物开始微笑",
    "ratio": "4:3",
    "duration": 4,
    "file_paths": ["https://example.com/image.jpg"]
  }'
```

### Async Seedance (recommended for production)

```bash
# Submit
curl -s -X POST http://localhost:8000/v1/videos/generations/async \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -F "model=seedance-2.0" \
  -F "prompt=@1 和 @2 两人开始跳舞" \
  -F "ratio=4:3" \
  -F "duration=4" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg"

# Query (returns task_id in submit response)
curl -s "http://localhost:8000/v1/videos/generations/async/TASK_ID" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID"
```

## Troubleshooting

### "shark not pass" error

Seedance requests go through a Playwright browser proxy to bypass ByteDance's `a_bogus` signature check. If you see this error:

1. Ensure container is **v0.8.4 or later** (image includes Chromium)
2. First Seedance request auto-launches headless browser (~seconds warmup)
3. Each sessionId gets its own browser session; idle sessions auto-cleanup after 10 minutes
4. Only Seedance generate requests use the browser proxy; all other endpoints (image gen, normal video, polling) use direct Node.js requests

### Image size limit

Uploaded images must be < 10MB. Larger files may cause upload failure.

## Session Security

If sessionid is compromised, use the project's logout tool to forcibly invalidate it:

```bash
# Clone the project (if not already)
git clone https://github.com/wwwzhouhui/jimeng-free-api-all.git

# Install deps
pip install playwright && playwright install chromium

# Force logout leaked sessionid
python3 scripts/logout-sessions.py <leaked_sessionid>
```

Note: ByteDance accounts allow multiple concurrent sessions. Re-logging in does NOT invalidate old sessionids. You must explicitly logout.
