---
name: nby-auto-edit
version: 1.3.0
description: This skill should be used when the user asks to "自动剪辑", "auto edit", "视频剪辑", "从录制到成片", "剪辑视频", "生成视频", "auto cut", "自动合成视频", "绿幕抠像", "帮我剪视频", "Remotion渲染", "视频后期", or wants to automatically edit raw video recordings into a finished video using Remotion.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# AI Auto Edit — Raw Recording to Finished Video

Automate video production: from raw green-screen recordings through ASR transcription, script matching, best-take selection, precise slicing, background replacement, to Remotion rendering.

## Language

Match the user's language: respond in the same language the user uses.

## Configuration

### Preferences (EXTEND.md)

Check existence (priority order):

```bash
test -f .nby-skills/nby-auto-edit/EXTEND.md && echo "project"
test -f "$HOME/.nby-skills/nby-auto-edit/EXTEND.md" && echo "user"
```

| Path | Scope |
|------|-------|
| `.nby-skills/nby-auto-edit/EXTEND.md` | Project-level |
| `~/.nby-skills/nby-auto-edit/EXTEND.md` | User-level |

### Value Priority

`CLI arguments > EXTEND.md (project) > EXTEND.md (user) > Skill defaults`

### First-Time Setup

If no EXTEND.md exists, ask:

1. **Resolution**: "视频分辨率？" → 720x1280 (竖屏) / 1920x1080 (横屏)
2. **TTS Voice**: "默认配音声音？" → Edge TTS 声音列表，或跳过
3. **Green Screen**: "是否使用绿幕拍摄？" → chromakey / rembg / 不使用

Save to `.nby-skills/nby-auto-edit/EXTEND.md` (ask project or user level).

## Prerequisites

### Environment Check (Required)

```bash
command -v ffmpeg   && echo "ffmpeg: OK"   || echo "ffmpeg: MISSING → brew install ffmpeg"
command -v ffprobe  && echo "ffprobe: OK"  || echo "ffprobe: OK (included with ffmpeg)"
command -v node     && echo "node: OK"     || echo "node: MISSING → brew install node"
```

If any required tool is missing, print install commands and stop.

### Remotion Project Check

```bash
[ -f "package.json" ] && grep -q "remotion" package.json && echo "Remotion: OK" || echo "Remotion: NOT FOUND"
```

**If not found**, guide initialization:
```bash
npx create-video@latest my-video  # Choose "Blank" template
cd my-video && npm install
```

**Key directories:**
- `src/` — Component files (scenes)
- `src/root.tsx` — Composition registry (must register all scenes here)
- `public/` — Asset files (videos, images, audio)

### Optional Tools

| Tool | Purpose | Install | When Needed |
|------|---------|---------|-------------|
| `mlx-whisper` | ASR (fastest on Mac) | `pip install mlx-whisper` | Phase 2 |
| `whisper` | ASR (cross-platform) | `pip install openai-whisper` | Phase 2 |
| `coli` | ASR (alternative) | See coli docs | Phase 2 |
| `edge-tts` | Free TTS | `pip install edge-tts` | Phase 7 (optional) |
| `rembg` | AI bg removal | `pip install rembg[cpu]` | Phase 5 |

## Pipeline Overview

```
Phase 1: 素材准备         ← 必须
Phase 2: 语音转录         ← 可选(有剧本时间线可跳过)
Phase 3: 剧本对照+选Take   ← 核心步骤
Phase 4: 精确裁切         ← 可选(已有切片可跳过)
Phase 5: 绿幕背景替换     ← 可选
Phase 6: AI 素材生成      ← 手动
Phase 7: Remotion 合成    ← 必须
Phase 8: 多版本衍生       ← 可选
```

IMPORTANT: After Phase 1, auto-detect which phases are needed. Present the plan and ask for confirmation ONCE, then execute sequentially.

## Phases

### Phase 1: 素材准备 (Required)

Collect from user:

```
需要以下素材：

  1. 原始录制视频（可以多个，不同角色分开录制）← 必须
  2. 剧本/台词文本 ← 强烈建议提供
  3. 角色与视频对应关系（如：角色1=视频A，角色2=视频B）
  4. 背景图片/视频（可选，用于绿幕替换）
```

Register raw materials:
```
素材登记：
  视频1: {path} → 角色2（伊田助男）720x1280
  视频2: {path} → 角色1（审查员）544x960

剧本：
  1: 你是日本人，你为什么能上天堂啊？
  2: 你好
  1: 叫什么名字？
  ...
```

### Phase 2: 语音转录与文字提取 (Optional)

Skip if user provides script with exact timestamps.

**Critical: Use large model for word-level timestamps.**

```bash
# Extract audio from each video
ffmpeg -i {video1} -vn -acodec pcm_s16le -ar 16000 /tmp/video1-audio.wav
ffmpeg -i {video2} -vn -acodec pcm_s16le -ar 16000 /tmp/video2-audio.wav

# Option A: mlx-whisper (Apple Silicon, fastest — recommended on macOS)
mlx_whisper /tmp/video1-audio.wav --model mlx-community/whisper-large-v3-mlx \
  --language zh --word_timestamps True --output_format all

# Option B: whisper (cross-platform)
whisper /tmp/video1-audio.wav --model large-v3 --language zh \
  --word_timestamps True --output_format all

# Option C: coli (if installed)
coli asr /tmp/video1-audio.wav --language zh --output-format srt
```

**Output: Word-level transcript with classification:**

```markdown
| 时间 | 文字 | 类型 |
|------|------|------|
| 0.00 - 0.34 | 321走 | 打板 |
| 4.64 - 5.24 | 你好 | take1（声音小） |
| 9.56 - 10.70 | 321走 | 打板 |
| **10.70 - 11.42** | **你好** | **take2 (采用)** |
| 12.46 - 13.06 | 可以吗 | 确认 |
```

Classify each segment as:
- **打板**: "321", "321走" — slate clap, skip
- **有效 take**: Matches a script line
- **NG**: 口误, 不完整, "重来", "不对"
- **废话**: "可以吗", 闲聊, 确认
- **静默**: Gaps > 2 seconds

**Key learnings:**
- Small ASR models skip "silent" segments that actually have speech — always use `large-v3`
- Transcribe full video first, then classify — don't pre-cut
- For long recordings (>2min): split into segments first, transcribe each, then merge — more accurate
- On Apple Silicon, `mlx-whisper` is significantly faster than standard whisper
- **Timestamp drift on long videos**: Full-video ASR timestamps can drift 1-2s on recordings >1min. For critical cut points, re-transcribe just the surrounding 8-10s (`ffmpeg -ss {t-2} -t 8`) and use those local timestamps instead
- **Long-offset seeking**: When `-ss` is >60s, put it AFTER `-i` (decode-based seeking) instead of before `-i` (fast seek) to avoid audio-video desync

### Phase 3: 剧本对照 & Take 选择 (Core Step)

This is the **most critical phase** — match ASR results against the script line-by-line.

**3.1 Script-to-ASR matching:**

For each script line, find all matching takes across all videos:

```
剧本第1句: "你是日本人，你为什么能上天堂啊"
  → 视频2 take1 (1.14-3.86) ✓ 完整
  → 视频2 take2 (6.80-9.28) ✗ 少了"啊"

剧本第2句: "你好"
  → 视频1 take1 (4.64-5.24) ✗ 声音小
  → 视频1 take2 (10.70-11.42) ✓ 采用
```

**3.2 Best take selection criteria:**
- Completeness: All words present, matches script
- Clarity: Clear pronunciation, no stammering
- Timing: Natural pacing
- If multiple valid takes, pick the later one (usually better after warm-up)

**3.3 Determine precise cut points:**

Rules:
- First word start time - 0.1s → Last word end time + 0.15s
- When a take follows a "321走" slate, the "走" end time is the anchor — cut starts AFTER "走" ends
- Same-character consecutive segments should have no gap between them

```
"你好" spoken at 10.70-11.42 (after "321走" ending at 10.70)
  → Cut range: 10.60 - 11.55 (0.1s before, 0.15s after)
```

**3.4 Present the cut plan for confirmation:**

```
裁切方案（{N} 个片段）：

| 片段 | 台词 | 来源 | 语音时间 | 裁切范围 |
|------|------|------|----------|----------|
| seg01 | 你是日本人... | 视频2 | 1.14-3.86 | 1.04-3.96 |
| seg02 | 你好 | 视频1 | 10.70-11.42 | 10.60-11.55 |
| seg03 | 你叫什么名字 | 视频2 | 12.66-14.24 | 12.56-14.40 |
| seg04 | 我叫伊田助男 | 视频1 take2 | 18.32-19.82 | 18.22-19.95 |
...

确认裁切方案？
```

### Phase 4: 精确裁切 (Optional)

Skip if user has pre-cut segments.

```bash
# Cut each segment (use -ss before -i for fast seek, -t for duration)
ffmpeg -y -ss {cut_start} -i {source_video} -t {duration} \
  -c:v libx264 -crf 18 -preset slow \
  -c:a aac segments/seg{NN}.mp4

# Verify duration matches expected
ffprobe -v error -show_entries format=duration -of csv=p=0 segments/seg{NN}.mp4
```

**Key rules:**
- Use `-t {duration}` NOT `-to {end_time}` when `-ss` is before `-i` (otherwise cut will be wrong)
- Duration MUST match precisely — mismatches cause background flash between segments
- **Single-pass encoding**: When possible, combine cutting + green screen in one ffmpeg command to avoid quality loss from re-encoding
- Do NOT scale during cutting or keying — defer resolution unification to Phase 7 assembly
- Same-character consecutive segments should have no gap

### Phase 5: 绿幕背景替换 (Optional)

Skip if not using green screen footage.

**Method selection:**

| Green screen quality | Recommended method |
|---------------------|--------------------|
| Good (even lighting, no wrinkles) | FFmpeg chromakey |
| Poor (wrinkles, uneven lighting) | rembg AI |
| No green screen | rembg AI |

**FFmpeg chromakey:**
```bash
ffmpeg -y \
  -i bg.png \
  -ss {start} -to {end} -i raw_video.mp4 \
  -filter_complex "
    [0:v]scale={video_w}:{video_h}:flags=lanczos[bg];
    [1:v]chromakey=0x00FF00:similarity=0.24:blend=0.06,
    despill=type=green:mix=0.6:expand=0.4,
    eq=saturation=1.05:contrast=1.02[fg];
    [bg][fg]overlay=0:0,format=yuv420p[out]
  " \
  -map "[out]" -map 1:a \
  -c:v libx264 -preset slow -crf 16 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  output.mp4
```

**Important**: Scale background to match video's native resolution (`{video_w}x{video_h}`), do NOT scale the video before chromakey. Add `eq=saturation=1.05:contrast=1.02` after despill to compensate color loss.

**rembg AI (recommended for poor green screen):**
```bash
# Extract frames
ffmpeg -i seg.mp4 -vf fps=30 frames/%04d.png
# AI remove background
rembg p frames/ frames_nobg/
# With alpha matting (slightly better hair edges):
rembg p --alpha-matting frames/ frames_nobg/
# Composite with background + reassemble
```

**Key learnings:**
- Use standard green `0x00FF00` for chromakey, NOT sampled color values
- Poor green screen → just use rembg AI, don't fight with chromakey params
- Do NOT resize during keying — keep original resolution

### Phase 6: AI 素材生成 (Manual Step)

User generates assets with their preferred AI tool. Provide guidance:

**Consistency rule:** All scene images should use the same AI model + style prompt to maintain visual coherence.

**Prompt template:**
```
{art_style} depicting {scene_description}.
Consistent {color_palette} across all scenes.
{era/period} setting. Format: {width}x{height}.
```

**Asset checklist:**
- [ ] Background images (one per character or scene)
- [ ] Insert images (historical photos, documents, etc.)
- [ ] Character portraits (if needed for picture-in-picture)
- [ ] Title / ending cards
- [ ] BGM audio file
- [ ] Sound effects (whoosh, etc.)

Save all to `public/{project-name}/`.

### Phase 6b: FFmpeg 快速拼接 (Optional — 替代 Remotion)

当不需要字幕、特效、转场时，直接用 ffmpeg concat 拼接片段，速度最快：

```bash
# 1. 创建文件列表
cat > /tmp/concat_list.txt << EOF
file '/path/to/segments/seg01.mp4'
file '/path/to/segments/seg02.mp4'
...
EOF

# 2. 无损拼接（要求所有片段编码参数一致）
ffmpeg -y -f concat -safe 0 -i /tmp/concat_list.txt \
  -c copy -movflags +faststart \
  output/final.mp4
```

**前提条件**：所有片段必须使用相同的编码器、分辨率、帧率。Phase 4+5 产出的片段已满足此条件。

**适用场景**：快速出片、测试剪辑节奏、不需要字幕/BGM/特效的粗剪版本。

### Phase 7: Remotion 合成 (Required)

**7a. Create component** — `src/scenes/{project}/{ProjectName}.tsx`:

```tsx
import React from 'react';
import {AbsoluteFill, Audio, Video, Sequence, staticFile,
  useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';

const FPS = 30;

interface SubEntry {
  text: string;   // Supports **keyword** highlighting
  en?: string;    // English translation (optional)
  start: number;
  end: number;
}

interface Segment {
  file: string;
  duration: number;
  character: string;
  subs: SubEntry[];
}

// ← Fill from Phase 3 cut plan
const SEGMENTS: Segment[] = [
  {file: 'seg01.mp4', duration: 2.92, character: 'judge', subs: [
    {text: '台词内容', start: 0, end: 2.92},
  ]},
  // ... more segments
];

const segmentFrames = SEGMENTS.map(s => Math.round(s.duration * FPS));
const CONTENT = segmentFrames.reduce((a, b) => a + b, 0);
const ENDING = 3 * FPS;
export const TOTAL_FRAMES = CONTENT + ENDING;

export const MyVideo: React.FC = () => {
  const starts: number[] = [];
  let off = 0;
  for (const f of segmentFrames) { starts.push(off); off += f; }

  return (
    <AbsoluteFill>
      {/* BGM */}
      <Audio src={staticFile('{project}/bgm.mp3')} volume={0.15} loop />

      {/* Video segments */}
      {SEGMENTS.map((seg, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={segmentFrames[i]}>
          <Video src={staticFile(`{project}/${seg.file}`)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          {/* Add subtitles, character tags, image inserts here */}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
```

**7b. Register in `src/root.tsx`** (essential — without this, render fails):

```tsx
import {Composition} from 'remotion';
import {MyVideo, TOTAL_FRAMES} from './scenes/{project}/MyVideo';

// Add inside RemotionRoot:
<Composition
  id="MyVideo"
  component={MyVideo}
  durationInFrames={TOTAL_FRAMES}
  fps={30}
  width={720}    // or 1920
  height={1280}  // or 1080
/>
```

**7c. Place assets:**
```bash
mkdir -p public/{project}
cp segments/*.mp4 public/{project}/
cp bgm.mp3 public/{project}/
```

**7d. Creative decisions checklist:**

Before rendering, review these common decisions:
- [ ] Title card needed? (If seg01 is already attention-grabbing, skip it)
- [ ] Transitions between segments? (Hard cut often has better pacing than crossfade)
- [ ] Character flash/effect on speaker change? (Usually distracting — skip)
- [ ] Sound effects frequency? (Once is impactful, repeating is annoying)
- [ ] Subtitle coloring? (White for all is cleaner — use character tags to distinguish roles)
- [ ] Same-character consecutive segments: no effects between them (keep continuity)
- [ ] BGM volume? (10-15% is typical — too loud drowns dialogue)

**7e. Preview:**
```bash
npx remotion studio  # Select composition in browser
```

**7e. Render:**
```bash
npx remotion render MyVideo --concurrency=1 --codec=h264 --output=out/{project}.mp4
```

Note: `--concurrency=1` required to prevent frame jitter.

### Phase 8: 多版本衍生 (Optional)

From the same base, create variants:

| Variant | Method | Key Change |
|---------|--------|------------|
| TTS 配音版 | Replace character audio with TTS | Mute video audio + overlay TTS, align with atempo |
| 英文版 | Voice Cloning + English subtitles | Independent timeline (English pacing differs) |
| 换脸版 | External face-swap tool | Fast (speed) or Enhanced (quality) |
| 着装修改版 | AI image editing | Modify character clothing |
| 动画增强版 | Add Remotion overlays | Year dial, subscribe cards, charts |

Each variant should be a **separate component file** (e.g., `MyVideoEn.tsx`), not modifying the original.

**TTS duration alignment (critical):**
```bash
TTS_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 tts.mp3)
SEG_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 seg.mp4)
RATIO=$(python3 -c "print(${TTS_DUR}/${SEG_DUR})")

# Speed up/slow down (atempo range 0.5~2.0)
ffmpeg -y -i tts.mp3 -af "atempo=${RATIO}" -ar 24000 tts_aligned.mp3

# If TTS shorter, pad with silence instead
ffmpeg -y -i tts.mp3 -af "apad=whole_dur=${SEG_DUR}" -ar 24000 tts_aligned.mp3
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `ffmpeg: command not found` | Not installed | `brew install ffmpeg` |
| `Cannot find module 'remotion'` | Wrong directory | `cd` to project root, run `npm install` |
| Render is black/blank | Wrong asset path | Verify files exist in `public/`, check `staticFile()` paths |
| Frame jitter / flickering | Concurrent rendering | Must use `--concurrency=1` |
| Background flash between segments | Duration mismatch | Re-check with `ffprobe`, adjust cut points |
| `Composition not found` | Not registered | Add `<Composition>` to `src/root.tsx` |
| ASR misses speech | Model too small | Use `whisper --model large-v3` |
| Green screen artifacts | Wrinkled/uneven green | Switch to rembg AI method |
| TTS too short/long | Duration mismatch | Use atempo or apad alignment |

## Self-Evolution

After each run, save to `.auto-edit/{project}/config.json`:

```json
{
  "project": "my-project",
  "segments": 10,
  "sources": {"video1": "角色A", "video2": "角色B"},
  "greenScreenMethod": "rembg",
  "renderConfig": {"concurrency": 1, "codec": "h264", "resolution": "720x1280"},
  "lessonsLearned": []
}
```

- `EXTEND.md` = user preferences (global, persists across projects)
- `.auto-edit/{project}/` = per-project runtime state

Next run for same project loads config. For new: "是否基于已有项目配置？"

## Remotion Reference

See [references/remotion-guide.md](references/remotion-guide.md) for spring configs, reusable components, and project structure.

## Composability

- **Invokes**: `asr` (transcription), `tts` (narration), `image-gen` (assets)
- **Invoked by**: User directly or via chat-based automation

## Examples

**Full pipeline (multiple green-screen recordings + script):**
> "我有2段绿幕视频和剧本，帮我自动剪辑"
→ Phase 1~7: ASR → Script match → Cut → Green screen → Compose → Render

**Pre-cut segments:**
> "我已经有切好的片段了，帮我合成视频"
→ Skip Phase 2~4, jump to Phase 7

**Script only (no recording):**
> "帮我用这个剧本生成一个视频"
→ Phase 1 → Phase 6 (guide asset creation) → Phase 7

**Add variant:**
> "帮我做一个英文版"
→ Phase 8: Create separate component with English TTS + subtitles
