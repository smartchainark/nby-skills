# nby-skills

> NBY 团队 Claude Code 技能集

Notion 效率工作流技能合集。

## 技能列表

| 技能 | 说明 |
|------|------|
| [nby-notion-reading-notes](./nby-notion-reading-notes/) | AI 精读笔记 — 自动为 Notion Inbox 文章生成深度阅读笔记 |
| [nby-notion-smart-categorize](./nby-notion-smart-categorize/) | 智能归类 — 将 Notion 页面自动归类到 Resources 子目录 |

## 安装

### 安装全部技能

```bash
npx skills add smartchainark/nby-skills
```

### 安装单个技能

```bash
npx skills add smartchainark/nby-skills --skill nby-notion-reading-notes
npx skills add smartchainark/nby-skills --skill nby-notion-smart-categorize
```

### 查看可用技能

```bash
npx skills add smartchainark/nby-skills --list
```

## 配置

每个技能使用两个配置文件，存放在技能目录**之外**（更新技能不会丢失配置）：

| 文件 | 用途 | 内容 |
|------|------|------|
| `.env` | 凭证 | Notion API token |
| `EXTEND.md` | 偏好 | 页面 ID、分类、选项 |

### 配置文件路径（优先级从高到低）

| 路径 | 作用域 |
|------|--------|
| `.nby-skills/<技能名>/.env` | 项目级 |
| `~/.nby-skills/<技能名>/.env` | 用户级 |

`EXTEND.md` 同理。

### 首次使用

无需手动配置 — 首次使用时技能会**自动引导**设置，询问：

1. Notion API token
2. 页面 ID
3. 保存位置（项目级或用户级）

### 手动配置

```bash
# 创建配置目录
mkdir -p ~/.nby-skills/nby-notion-reading-notes

# 复制并编辑模板
cp nby-notion-reading-notes/.env.example ~/.nby-skills/nby-notion-reading-notes/.env
cp nby-notion-reading-notes/EXTEND.md.example ~/.nby-skills/nby-notion-reading-notes/EXTEND.md
# 编辑两个文件填入你的值
```

### 获取 Notion API Token

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 创建新的 integration
3. 复制 Internal Integration Secret
4. 将相关 Notion 页面与 integration 共享

### 获取页面 ID

在浏览器打开 Notion 页面，URL 中的 32 位字符串即为页面 ID：
```
https://www.notion.so/页面标题-{这里就是页面ID}
```

## 使用

配置完成后，在 Claude Code 中用自然语言触发：

```
# 精读笔记
> AI精读
> 精读 inbox 文章

# 智能归类
> 归类这个页面
> 整理到 Resources
```

## License

MIT
