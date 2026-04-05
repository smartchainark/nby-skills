# Jimeng API Detailed Parameters & Responses

## Text-to-Image

**POST /v1/images/generations**

纯文生图端点。**注意：该端点的 `images` 参数不生效（源码未处理），不支持图生图。** 如需图生图请使用 `/v1/images/compositions`。

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| model | string | No | jimeng-4.5 | Model name |
| prompt | string | Yes | - | Image description |
| negative_prompt | string | No | "" | Negative prompt |
| ratio | string | No | 1:1 | Aspect ratio: 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9 |
| resolution | string | No | 2k | Resolution: 1k, 2k, 4k |
| sample_strength | number | No | 0.5 | Refinement strength 0-1 |
| response_format | string | No | url | `url` or `b64_json` |

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

---

## Image-to-Image (Composition)

**POST /v1/images/compositions**

图生图专用端点。支持两种请求格式：JSON 模式和 multipart/form-data 文件上传模式。

### Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| model | string | No | jimeng-4.5 | Model name |
| prompt | string | Yes | - | Image description / transformation instruction |
| images | array | No | - | 参考图 URL 数组 (1-10)，用于 JSON 模式 |
| negative_prompt | string | No | "" | Negative prompt |
| ratio | string | No | 1:1 | Aspect ratio: 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9 |
| resolution | string | No | 2k | Resolution: 1k, 2k, 4k |
| sample_strength | number | No | 0.5 | Refinement strength 0-1（**注意：multipart 模式下可能报错 "Params body.sample_strength invalid"，建议用 JSON 模式**） |
| response_format | string | No | url | `url` or `b64_json` |

### Request Format 1: JSON（推荐）

`Content-Type: application/json`，通过 `images` 字段传入参考图 URL 数组。

```bash
curl -s -X POST http://localhost:8000/v1/images/compositions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -d '{
    "model": "jimeng-4.6",
    "prompt": "将图片转换为水彩画风格",
    "images": ["https://example.com/input.jpg"],
    "sample_strength": 0.5
  }'
```

### Request Format 2: multipart/form-data（文件上传）

通过 `images` 字段上传本地文件。

```bash
curl -s -X POST http://localhost:8000/v1/images/compositions \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -F "model=jimeng-4.6" \
  -F "prompt=将图片转换为水彩画风格" \
  -F "images=@/path/to/input.jpg"
```

### Success Response

成功的图生图返回会额外包含 `input_images` 和 `composition_type` 字段，可用来验证参考图是否生效：

```json
{
  "created": 1774966621,
  "input_images": ["https://..."],
  "composition_type": "...",
  "data": [
    {"url": "https://p26-dreamina-sign.byteimg.com/.../image.png"},
    {"url": "https://p3-dreamina-sign.byteimg.com/.../image.png"},
    {"url": "https://p26-dreamina-sign.byteimg.com/.../image.png"},
    {"url": "https://p26-dreamina-sign.byteimg.com/.../image.png"}
  ]
}
```

### 两个端点的区别总结

| | `/v1/images/generations` | `/v1/images/compositions` |
|---|---|---|
| 用途 | 纯文生图 | 图生图（参考图 + 提示词） |
| `images` 参数 | **不生效**（源码未处理） | 生效，支持 URL 数组或文件上传 |
| 请求格式 | JSON | JSON 或 multipart/form-data |
| 返回特有字段 | - | `input_images`, `composition_type` |

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
