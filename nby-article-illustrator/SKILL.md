---
name: article-illustrator
description: |
  自动为 Markdown 文章配图。分析文章结构和品牌调性，匹配实景参考图，
  通过即梦 API 图生图（/compositions）生成与实景高度一致的场景图，
  自动插入文章合适位置。支持品牌视觉规范、图文节奏控制、风格一致性审核。
  触发词："自动配图"、"文章配图"、"给文章加图"、"配图"、"article illustration"、
  "插入配图"、"生成文章图片"。
allowed-tools: [Bash, Read, Write, Edit, Glob, Grep, WebFetch]
---

# Article Illustrator - 文章自动配图

基于品牌素材和即梦 AI 图生图，为 Markdown 文章自动生成并插入配图。

## Workflow Overview

1. **读取品牌资产** — 加载品牌调性、视觉规范、素材索引
2. **分析文章结构** — 识别章节、叙事节奏、情感高潮点
3. **规划配图方案** — 确定配图数量、位置、每张图的场景描述
4. **匹配参考图** — 从实景素材中选择最相关的参考图
5. **上传参考图** — 通过 COS 图床获取公开 URL
6. **生成配图** — 调用即梦 /compositions 接口图生图
7. **审核选图** — 展示变体供用户选择，检查风格一致性
8. **插入文章** — 将选定图片插入 Markdown 对应位置

## Prerequisites

- 即梦 API 服务运行中（Docker: `jimeng-free-api-all`，端口 8000）
- 即梦 session ID 已配置（`~/.nby-skills/nby-jimeng-api/.env`）
- COS 图床可用（cos-uploader skill）
- 品牌资产文件存在（`brand/brand-assets.md`）

## Step 1: 读取品牌资产

```bash
# 查找品牌资产文件
find . -name "brand-assets.md" -o -name "品牌数据源*.md" | head -5
```

从品牌资产中提取：
- **视觉规范**：主色调、摄影风格、传播调性
- **调性词**：用于生成提示词的关键词
- **素材索引**：实景照片的路径

如果有素材分析文件（如 `assets-analysis.yaml`），也一并读取，了解房间风格分类。

## Step 2: 分析文章结构

读取目标 Markdown 文章，分析：

- **章节数量和标题**：确定文章长度和结构
- **叙事时间线**：是否有时间推进（如到达→入住→清晨→离开）
- **情感高潮点**：最适合配图的位置（通常在段落描写最生动处之后）
- **已有图片**：检查是否已有配图，避免重复

### 配图密度原则

| 文章长度 | 建议配图数 | 间距 |
|----------|-----------|------|
| 3-5 个章节 | 3-4 张 | 每 1-2 个章节 1 张 |
| 6-9 个章节 | 4-6 张 | 每 2-3 个章节 1 张 |
| 10+ 个章节 | 5-7 张 | 每 2-3 个章节 1 张 |

### 图片来源分配

- **头图和尾图**：优先使用实景素材（建立真实感）
- **中间场景图**：用即梦图生图（补充实景拍不到的"体验瞬间"）
- **实景/AI 比例**：建议至少 40% 实景图

## Step 3: 生成提示词

### 提示词模板（图生图/修改指令式）

```
将这张[场景类型]照片改为[目标场景]：[具体修改描述]。
保持所有家具、装修、摆设、材质完全不变。
保持真实摄影照片质感。
```

### 关键原则

1. **用修改指令，不用场景描述** — "将这张照片改为夜晚" 而非 "一个夜晚的房间"
2. **明确保留什么** — "保持所有家具、装修、摆设完全不变"
3. **强调真实感** — "保持真实摄影照片质感"
4. **不要过度描述** — 参考图已经提供了房间细节，提示词只需描述"改什么"

### 品牌调性融入

根据品牌调性词调整提示词氛围：
- **从容** → 构图留白，不拥挤
- **懂你** → 人物姿态放松自然
- **在地** → 窗外可见小城风景
- **真实** → 真实摄影质感，非AI绘画风格
- **舒展** → 光线柔和温暖

## Step 4: 匹配参考图

从素材库中选择参考图的优先级：

1. **与文章描述最匹配的房型** — 文章说"港式"就选新中式房间
2. **构图接近目标比例** — 16:9 文章图优先选广角侧拍的素材
3. **装修细节丰富** — 有特征性元素（山水画、窗帘等）的优先

## Step 5: 上传参考图到 COS

```bash
# 准备临时目录
mkdir -p /tmp/cos-upload
cp [参考图路径] /tmp/cos-upload/

# 上传到 COS
node ~/.claude/skills/cos-uploader/scripts/upload.mjs /tmp/cos-upload/ article-ref/
```

获取 COS URL 后用于 API 调用。

## Step 6: 调用即梦 API

### 关键：必须用 /compositions 接口

```bash
# 读取 session ID
source ~/.nby-skills/nby-jimeng-api/.env

curl -s -X POST http://localhost:8000/v1/images/compositions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JIMENG_SESSION_ID" \
  -d '{
    "model": "jimeng-4.6",
    "prompt": "提示词",
    "images": ["COS图片URL"],
    "ratio": "16:9",
    "resolution": "2k",
    "sample_strength": 0.75
  }'
```

### 接口选择（重要！）

| 接口 | 用途 | images 参数 |
|------|------|-------------|
| `/v1/images/generations` | **纯文生图** | 不生效（会被忽略） |
| `/v1/images/compositions` | **图生图** | 生效，真正的参考图模式 |

### 验证参考图是否生效

检查返回 JSON 中是否包含：
```json
{
  "input_images": 1,
  "composition_type": "multi_image_synthesis"
}
```

如果没有这两个字段，说明参考图没有被使用。

### 推荐参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| model | jimeng-4.6 | 房间还原度最好 |
| ratio | 16:9 | 文章横图标准比例 |
| resolution | 2k | 清晰度足够 |
| sample_strength | 0.75 | 平衡还原度和创意空间 |

### 多账户支持

Session ID 支持逗号分隔多账户，API 自动轮换：
```
Authorization: Bearer token1,token2
```

## Step 7: 审核与选图

每次调用返回 4 张变体。审核标准：

- [ ] 装修细节与参考图一致（墙画、窗帘、家具）
- [ ] 色调与品牌视觉规范一致
- [ ] 人物自然（非AI感）
- [ ] 光影效果符合目标场景
- [ ] 无明显AI瑕疵

展示4张变体给用户，推荐最佳选择并说明理由。

## Step 8: 插入文章

```markdown
![图片描述](images/文件名.png)
```

插入位置原则：
- 在**情感高潮段落之后**（让读者先被文字带入，再用图片"验证"）
- 不要插在章节标题下方（太机械）
- 不要连续两个章节都有图（留出呼吸感）

## 图文节奏设计

好的配图节奏应该跟随文章叙事：

```
开头(实景,建立信任) → 体验1(AI,情感共鸣) → 留白 → 体验2(AI,高潮)
→ 留白 → 多样性展示(实景) → 结尾(实景,温暖收束)
```

## Error Handling

| 错误 | 原因 | 解决 |
|------|------|------|
| 返回无 input_images | 用了 /generations 而非 /compositions | 改用 /compositions |
| credit prededuct failed | 积分不足 | 切换账户或等待刷新 |
| sample_strength invalid | multipart 模式不支持该参数 | 改用 JSON 模式 |
| 图片还原度低 | sample_strength 太低 | 提高到 0.75-0.85 |
| 装修细节丢失 | 参考图构图与目标比例差异大 | 选择构图更接近的参考图 |
