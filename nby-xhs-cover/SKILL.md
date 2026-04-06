---
name: nby-xhs-cover
description: 小红书风格配图生成器（即梦AI）。生成封面、内容页、总结页三种类型的竖版图片。触发词："小红书封面"、"小红书配图"、"生成小红书图"、"xhs cover"、"Xiaohongshu cover"、"RED封面图"。
---

# nby-xhs-cover — 小红书配图生成器（即梦版）

基于即梦 AI 生成小红书风格竖版配图。提示词参考 [freestylefly/xiaohongshu-cover-generator](https://github.com/freestylefly/xiaohongshu-skills) 的小红书设计规范，API 替换为本地即梦服务。

## 特性

- 3:4 竖版（小红书标准比例）
- 2K 分辨率
- 3 种页面类型：封面 / 内容 / 总结
- 每次生成 4 张变体供选择
- 免费（即梦本地 Docker 服务）

## 依赖

- **nby-jimeng-api**：`~/.nby-skills/nby-jimeng-api/.env` 中配置 `JIMENG_SESSION_ID`
- **Docker**：容器 `jimeng-free-api-all` 运行在 `localhost:8000`

## 使用

```bash
npx tsx scripts/handler.ts "<主题>" [封面|内容|总结]
```

### 示例

```bash
# 封面图 — 大标题+拼图布局
npx tsx scripts/handler.ts "湖南芷江旅游攻略｜龙津风雨桥、湘西米粉、智能酒店" "封面"

# 内容图 — 信息卡片+图标列表
npx tsx scripts/handler.ts "七项免费服务：接机接站、停车、洗衣、熨衣、行李寄存、女性用品" "内容"

# 总结图 — 勾选框+完成感
npx tsx scripts/handler.ts "芷江旅行总结：风雨桥✓ 米粉✓ 智能酒店✓" "总结"
```

## 输出

文件保存到**当前工作目录**：

```
xiaohongshu-{类型}-{timestamp}-{序号}.png
```

例：`xiaohongshu-封面-1775466053022-1.png`

## 三种页面类型的 Prompt 设计

| 类型 | 视觉特征 |
|------|---------|
| **封面** | 大标题居中醒目，背景丰富有视觉焦点，多元素拼图布局 |
| **内容** | 信息层次分明，列表项+图标辅助，重点用颜色强调 |
| **总结** | 勾选框/完成标志，总结性文字突出，鼓励性视觉元素 |

通用规范：清新精致、适合年轻人审美、配色和谐、无水印无 logo、高清竖版。

## 故障排除

| 错误 | 原因 | 解决 |
|------|------|------|
| `connect ECONNREFUSED 127.0.0.1:8000` | 即梦 Docker 未运行 | `docker start jimeng-free-api-all` |
| `缺少 JIMENG_SESSION_ID` | 未配置凭证 | 在 `~/.nby-skills/nby-jimeng-api/.env` 中添加 |
| `credit prededuct failed` | 即梦积分不足 | 切换账号或等待刷新（每日66免费积分） |
| `API Error 401` | Session ID 过期 | 重新登录即梦获取新 sessionid |
| `无效的页面类型` | 传入了不支持的类型 | 仅支持：封面、内容、总结 |

## 致谢

提示词设计参考 [freestylefly/xiaohongshu-skills](https://github.com/freestylefly/xiaohongshu-skills)，感谢原作者的小红书风格规范总结。
