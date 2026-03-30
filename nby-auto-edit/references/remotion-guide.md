# Remotion 渲染指南

## 最佳实践

- 使用 `spring()` 的 `delay` 参数控制动画延迟，不要 `frame - N`
- 禁止 CSS `transition`/`animation`，全部用 `interpolate()` + `spring()` 驱动
- `--concurrency=1` 渲染防抖动
- 竖屏视频用 720x1280，横屏用 1920x1080
- 字幕 `**关键词**` 格式支持高亮解析
- 音频用 `<Audio volume={0/1}>` 控制静音/播放

## Spring 常用配置

```tsx
const smooth = { damping: 200 };                    // 平滑无回弹
const snappy = { damping: 20, stiffness: 200 };     // 快速轻微回弹
const bouncy = { damping: 8 };                      // 明显回弹
const heavy = { damping: 15, stiffness: 80, mass: 2 }; // 沉重缓慢
```

## 可复用动画组件

| 组件 | 用途 | 关键参数 |
|------|------|---------|
| YearDial | 年份转盘回溯动画 | START_YEAR, END_YEAR, DEG_PER_YEAR |
| YouTubeSubscribe | YouTube 订阅卡片 | CHANNEL_NAME, SUBSCRIBER_COUNT |
| BarLineChart | 数据图表动画 | 数据数组, 颜色配置 |
| CharacterTag | 角色名牌弹入 | character, gradient |
| TimedSubtitles | 定时字幕 | subs[], 高亮样式 |
| ImageInsert | 画中画配图 | src, startSec, endSec |
| EndingCard | 致敬结尾卡 | 文案配置 |

## 项目结构参考

```
remotion/
├── public/{project-name}/          # 素材文件
│   ├── seg01.mp4 ~ segNN.mp4      # 视频片段
│   ├── bgm.mp3                     # 背景音乐
│   ├── tts-{role}/                 # TTS 配音文件
│   └── en-voice/                   # 英文 TTS
├── src/scenes/{project-name}/
│   ├── {ProjectName}.tsx           # 主场景组件
│   └── {ProjectName}En.tsx         # 英文版（独立时间轴）
└── out/                            # 输出目录
    ├── videos/                     # 渲染的视频文件
    ├── images/                     # 素材图片
    └── audio/                      # TTS 试听音频
```
