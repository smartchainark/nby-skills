# nby-skills

> NBY 团队 Claude Code 技能集

效率工作流技能合集 — Notion、AI 媒体生成等。

## 技能列表

| 技能 | 说明 |
|------|------|
| [nby-notion-reading-notes](./nby-notion-reading-notes/) | AI 精读笔记 — 自动为 Notion Inbox 文章生成深度阅读笔记 |
| [nby-notion-smart-categorize](./nby-notion-smart-categorize/) | 智能归类 — 将 Notion 页面自动归类到 Resources 子目录 |
| [nby-skill-library-manager](./nby-skill-library-manager/) | 技能库管理 — Git 版本化技能库 + 符号链接启用/禁用，配合官方 skill-creator 使用 |
| [nby-jimeng-api](./nby-jimeng-api/) | 即梦 AI 图片/视频生成 — 文生图、图生图、文生视频、Seedance 2.0 多模态，OpenAI 兼容接口 |

## 安装

### 安装全部技能

```bash
npx skills add smartchainark/nby-skills
```

### 安装单个技能

```bash
npx skills add smartchainark/nby-skills --skill nby-notion-reading-notes
npx skills add smartchainark/nby-skills --skill nby-notion-smart-categorize
npx skills add smartchainark/nby-skills --skill nby-jimeng-api
```

### 查看可用技能

```bash
npx skills add smartchainark/nby-skills --list
```

## 配置

每个技能使用两个配置文件，存放在技能目录**之外**（更新技能不会丢失配置）：

| 文件 | 用途 | 内容 |
|------|------|------|
| `.env` | 凭证 | API token、session ID |
| `EXTEND.md` | 偏好 | 页面 ID、默认设置、选项 |

### 配置文件路径（优先级从高到低）

| 路径 | 作用域 |
|------|--------|
| `.nby-skills/<技能名>/.env` | 项目级 |
| `~/.nby-skills/<技能名>/.env` | 用户级 |

`EXTEND.md` 同理。

### 首次使用

无需手动配置 — 每个技能首次使用时会**自动引导**设置。

### Notion 技能配置

<details>
<summary>获取 Notion API Token 和页面 ID</summary>

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 创建新的 integration
3. 复制 Internal Integration Secret
4. 将相关 Notion 页面与 integration 共享

页面 ID 在 URL 中，页面标题后的 32 位字符串：
```
https://www.notion.so/页面标题-{这里就是页面ID}
```

手动配置：
```bash
mkdir -p ~/.nby-skills/nby-notion-reading-notes
cp nby-notion-reading-notes/.env.example ~/.nby-skills/nby-notion-reading-notes/.env
cp nby-notion-reading-notes/EXTEND.md.example ~/.nby-skills/nby-notion-reading-notes/EXTEND.md
```
</details>

### 即梦 API 配置

<details>
<summary>Docker 部署与 session ID 获取</summary>

**1. 部署服务（一行命令）：**
```bash
docker run -it -d --init --name jimeng-free-api-all \
  -p 8000:8000 -e TZ=Asia/Shanghai \
  wwwzhouhui569/jimeng-free-api-all:latest
```

**2. 获取 session ID：**
1. 访问 [即梦 AI](https://jimeng.jianying.com/) 并登录
2. F12 打开开发者工具 → Application → Cookies
3. 复制 `sessionid` 的值

**3. 配置：**
```bash
mkdir -p ~/.nby-skills/nby-jimeng-api
cp nby-jimeng-api/.env.example ~/.nby-skills/nby-jimeng-api/.env
# 编辑 .env 设置 JIMENG_SESSION_ID=你的sessionid
```

支持多账号（逗号分隔）：`JIMENG_SESSION_ID=sid1,sid2`
</details>

## 使用

配置完成后，在 Claude Code 中用自然语言触发：

```
# 精读笔记
> AI精读
> 精读 inbox 文章

# 智能归类
> 归类这个页面
> 整理到 Resources

# 即梦生图
> 即梦生图：一只可爱的橘猫
> 用即梦画一张科技风配图

# 即梦视频
> 即梦视频：小猫在草地上奔跑
```

## License

MIT
