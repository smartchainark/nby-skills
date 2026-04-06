# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

NBY Team 的 Claude Code 技能库。每个子目录是一个独立 skill，可通过 `npx skills add smartchainark/nby-skills@<skill-name>` 安装。

## Language

- 回复用中文，内部思考用英文

## 技能清单

| Skill | 用途 | 依赖 |
|-------|------|------|
| nby-jimeng-api | 即梦 AI 图片/视频生成（文生图、图生图、文生视频、Seedance） | Docker `jimeng-free-api-all` on :8000 |
| nby-article-illustrator | Markdown 文章自动配图（分析结构→匹配素材→图生图→插入） | nby-jimeng-api |
| nby-xhs-cover | 小红书风格配图（封面/内容/总结，3:4竖版） | nby-jimeng-api |
| nby-notion-reading-notes | Notion Inbox 文章 AI 精读笔记 | Notion API |
| nby-notion-smart-categorize | Notion 页面智能归类到 Resources 目录 | Notion API |
| nby-skill-library-manager | 技能库管理（Git + symlink enable/disable） | 无 |
| nby-auto-edit | AI 自动视频剪辑（ASR→绿幕→TTS→字幕→Remotion） | ffmpeg, Remotion |
| nby-awesome-design-md | 真实设计系统应用到项目（54个品牌 DESIGN.md） | 无 |
| openclaw-task-worker | OpenClaw 分布式任务协议 Worker | OpenClaw 网络 |

## Skill 开发规范

### 文件结构

```
nby-<skill-name>/
├── SKILL.md           # Agent 触发描述（frontmatter name + description）
├── README.md          # 人类开发者文档
├── package.json       # 元数据 + 依赖
├── scripts/           # 可执行脚本
└── references/        # 可选：参考文档（大内容渐进加载）
```

### SKILL.md frontmatter 规范

```yaml
---
name: nby-<skill-name>
description: 一句话能力描述 + 触发词列表（不放实现细节如端口号、比例等）
---
```

- description 只放「做什么」和「触发词」，不放「怎么做」
- 触发词中英文都要覆盖
- 实现细节放 SKILL.md body，不放 frontmatter

### 凭证管理

```
~/.nby-skills/<skill-name>/.env        # 用户级凭证
.nby-skills/<skill-name>/.env          # 项目级凭证（优先）
```

Skill 代码中按 项目级 → 用户级 → 环境变量 的优先级加载。

### 新增 Skill 流程

1. 创建目录 `nby-<name>/`，写 SKILL.md + handler + package.json + README
2. 运行安全审计（检查凭证处理、网络请求、依赖安全）
3. 运行质量审核（description 触发效果、代码质量、输入验证）
4. **更新根目录 README.md 技能索引表**（容易忘！）
5. **更新安装命令列表**
6. Commit + Push

### 改造开源 Skill 流程

1. `npx skills find` 搜索目标 skill
2. 安装到项目级分析源码和原理
3. 保留 prompt 精华，替换 API 为自有服务（如即梦）
4. 改名加 `nby-` 前缀，避免和原版冲突
5. 安全审计 + 质量审核 + 修复问题
6. 发布到本库

### 代码质量要求

- 输入参数必须验证（如 pageType 白名单）
- 网络重定向加深度限制
- 错误消息不泄露响应原文
- 不保留冗余依赖（`npm ls --all` 检查）
- 无 postinstall 等隐式脚本
