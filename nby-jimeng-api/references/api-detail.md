# Jimeng API Detailed Parameters & Responses

## Image Generation

**POST /v1/images/generations**

Unified endpoint for both text-to-image and image-to-image.

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| model | string | No | jimeng-4.5 | Model name |
| prompt | string | Yes | - | Image description |
| images | array | No | - | Image URLs (1-10). If provided, runs image-to-image mode |
| negative_prompt | string | No | "" | Negative prompt |
| ratio | string | No | 1:1 | Aspect ratio: 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9 |
| resolution | string | No | 2k | Resolution: 1k, 2k, 4k |
| sample_strength | number | No | 0.5 | Refinement strength 0-1 |
| response_format | string | No | url | `url` or `b64_json` |

### Request Formats

Supports both `application/json` (images as URL array) and `multipart/form-data` (file upload via `images` field).

### Success Response

```json
{
  "created": 1774966621,
  "data": [
    {"url": "https://p26-dreamina-sign.byteimg.com/.../image.png"},
    {"url": "https://p3-dreamina-sign.byteimg.com/.../image.png"},
    {"url": "https://p26-dreamina-sign.byteimg.com/.../image.png"},
    {"url": "https://p26-dreamina-sign.byteimg.com/.../image.png"}
  ]
}
```

Typically returns 4 images per request.

For image-to-image mode, response additionally includes `input_images` and `composition_type` fields.

---

## Image Composition (Legacy)

**POST /v1/images/compositions**

Backward-compatible image-to-image endpoint. Identical behavior to `/v1/images/generations` with `images` parameter.

---

## Video Generation (Sync)

**POST /v1/videos/generations**

Blocks until video is ready. Timeout can be 1-20 minutes depending on queue.

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| model | string | No | jimeng-video-3.0 | Video model name |
| prompt | string | Yes | - | Video description |
| ratio | string | No | 1:1 | Aspect ratio |
| resolution | string | No | 720p | Resolution: 480p, 720p, 1080p |
| duration | number | No | 5 | Duration in seconds |
| file_paths | array | No | [] | First/last frame image URLs |

### Success Response

```json
{
  "created": 1774778988,
  "data": [{
    "url": "https://v3-dreamnia.jimeng.com/.../video.mp4",
    "revised_prompt": "..."
  }]
}
```

---

## Video Generation (Async) — Recommended

### Submit Task

**POST /v1/videos/generations/async**

Same parameters as sync endpoint. Returns immediately.

### Submit Response

```json
{
  "created": 1774778941,
  "task_id": "4f2acc30-2b57-11f1-9361-e959a88411c4",
  "status": "processing",
  "message": "任务已提交，请使用 GET /v1/videos/generations/async/{task_id} 查询结果"
}
```

### Query Result

**GET /v1/videos/generations/async/:taskId**

Blocks until video is ready and returns result.

### Query Success Response

```json
{
  "created": 1774778988,
  "task_id": "4f2acc30-2b57-11f1-9361-e959a88411c4",
  "status": "succeeded",
  "data": [{
    "url": "https://v3-dreamnia.jimeng.com/.../video.mp4",
    "revised_prompt": "..."
  }]
}
```

### Query Failure Response

```json
{
  "created": 1774778988,
  "task_id": "4f2acc30-2b57-11f1-9361-e959a88411c4",
  "status": "failed",
  "error": "[API_IMAGE_GENERATION_FAILED] 视频生成超时"
}
```

### Async Constraints

- Max 10 concurrent async tasks; excess submissions return error
- Task data persisted in `tmp/async-tasks/` (survives restart)
- Processing tasks auto-resume on service restart
- Completed tasks auto-expire after 24 hours

---

## Models List

**GET /v1/models**

Returns all available models. No auth required.

```json
{
  "data": [
    {"id": "jimeng-5.0", "object": "model", "owned_by": "jimeng-free-api"},
    {"id": "jimeng-4.6", "object": "model", "owned_by": "jimeng-free-api"},
    ...
  ]
}
```

---

## Common Error Responses

### Token Expired
```json
{"error": {"message": "Token已失效", "code": -2002}}
```
**Action:** Ask user to re-login at jimeng.jianying.com and get new sessionid.

### Content Filtered
```json
{"error": {"message": "[API_CONTENT_FILTERED] 内容被过滤"}}
```
**Action:** Revise prompt to avoid sensitive/NSFW content.

### Credit Insufficient
```json
{"error": {"message": "credit prededuct failed"}}
```
**Action:** Switch to another account or wait for daily credit refresh (66 free credits/day).

### Generation Failed
```json
{"error": {"message": "[API_IMAGE_GENERATION_FAILED] 图像生成失败"}}
```
**Action:** Retry with simpler prompt. For video, try async endpoint.

### Shark Anti-Crawl (Seedance only)
Error contains "shark not pass".
**Action:** Ensure container is v0.8.4+ with Chromium installed. First Seedance request auto-launches browser (~seconds).
