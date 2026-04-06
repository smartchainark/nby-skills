# nby-xhs-cover

小红书风格配图生成器（即梦版）。生成 3:4 竖版封面/内容/总结图，每次 4 张变体。

## 快速开始

### 前置条件

1. Docker 运行即梦 API 服务：
```bash
docker run -it -d --init --name jimeng-free-api-all \
  -p 8000:8000 -e TZ=Asia/Shanghai \
  wwwzhouhui569/jimeng-free-api-all:latest
```

2. 配置 Session ID（`~/.nby-skills/nby-jimeng-api/.env`）：
```
JIMENG_SESSION_ID=你的即梦sessionid
```

### 使用

```bash
cd nby-xhs-cover
npm install
npx tsx scripts/handler.ts "<主题>" [封面|内容|总结]
```

### 示例

```bash
# 封面图
npx tsx scripts/handler.ts "湖南芷江旅游攻略" "封面"

# 内容图
npx tsx scripts/handler.ts "七项免费服务清单" "内容"

# 总结图
npx tsx scripts/handler.ts "旅行总结" "总结"
```

## 输出

- 比例：3:4 竖版（小红书标准）
- 分辨率：2K
- 每次 4 张变体
- 文件名：`xiaohongshu-{类型}-{timestamp}-{序号}.png`

## 三种页面类型

| 类型 | 视觉特征 |
|------|---------|
| 封面 | 大标题居中，多元素拼图布局，有视觉冲击力 |
| 内容 | 信息卡片式，图标+列表，层次分明 |
| 总结 | 勾选框/完成标志，鼓励性元素 |

## 依赖

- [nby-jimeng-api](../nby-jimeng-api/) — 即梦 API 凭证管理
- Docker 容器 `jimeng-free-api-all` 运行在 `localhost:8000`

## 致谢

提示词设计参考 [freestylefly/xiaohongshu-skills](https://github.com/freestylefly/xiaohongshu-skills)，API 替换为即梦本地服务。

## License

MIT
