# X-Glass — CLAUDE.md

## 项目概述

**X-Glass**：富士 X 卡口镜头对比工具。用户可浏览、筛选、并排对比富士原厂及第三方全品牌 X 卡口镜头。
填补"富士 X 专属 + 全品牌覆盖 + 交互式横向对比 + 中文界面"的市场空白。

## Next.js 版本注意

本项目使用最新版 Next.js，API 和文件结构可能与训练数据有差异。写代码前先查阅 `node_modules/next/dist/docs/`，注意 deprecation 警告。

## 技术栈

| 层次 | 选择 |
|------|------|
| 框架 | Next.js（App Router）+ TypeScript |
| 样式 | Tailwind CSS |
| 部署 | Vercel |
| 数据 | JSON 文件，与代码同仓库（`src/data/lenses.json`） |
| i18n | next-intl，从第一行代码接入 |

## 数据结构

类型定义见 `src/lib/types.ts`，业务逻辑（筛选、排序、格式化、等效焦距计算）见 `src/lib/lenses.ts`。

**新老代处理原则**：同焦段多代版本均独立收录，用 `generation` 字段区分。

## 二期不做

- MTF 图表对比（`mtfImageUrl` 字段已预留）
- 价格实时抓取
- 镜身尺寸可视化
- 场景推荐标签

## 架构原则

**逻辑与 UI 严格分离**，为未来 monorepo 扩展预留空间：
- 筛选函数、TypeScript 类型、镜头数据 → `src/lib/` 或未来 `packages/shared/`
- UI 组件只负责渲染，不内嵌业务逻辑

未来 monorepo 结构（Phase 4 评估）：
```
x-glass/
├── packages/
│   ├── shared/        # 类型、业务逻辑、JSON 数据
│   ├── web/           # Next.js
│   └── miniprogram/   # 原生小程序（届时决定）
```

## 关联资源

| 资源 | 路径 | 说明 |
|------|------|------|
| Data Pipeline | `../x-glass-pipeline/` | 私有 repo，数据源配置（sources.yaml）、爬虫、校验脚本 |
| 产品文档 | `/Users/ericzhang/Library/Mobile Documents/iCloud~md~obsidian/Documents/SentaForge/Geek & Creativity/Projects/X-Glass/` | Obsidian vault，产品设计、定义、调研笔记 |

## 工作流规范

每完成一个 commit 的代码改动后，自动调用 `/commit-msg` skill 生成 commit message，无需用户手动触发。

## 数据采集约定

与 Data Pipeline 相关的采集规则统一维护在 `../x-glass-pipeline/docs/data-collection-rules.md`。
如需进行镜头数据抓取、来源选择、网页解析或浏览器自动化，请优先读取该文档，再执行采集任务。

## 开发规范

- **语言优先级**：优先保证英文版本（`en.json`）功能完整正确；开发时同步更新 `zh.json`，但以英文为准，中文翻译可暂时留空或粗译。
- **代码注释语言**：所有代码注释（inline comments、block comments、JSDoc）统一用英文，禁止出现中文。

## 当前阶段：Phase 2

Phase 1 已完成：项目初始化、部署、类型定义、镜头数据录入、列表/筛选/排序/对比/详情页、i18n 框架。

**进行中：**
- [ ] 补充缺失的镜头图片（`imageUrl`）
- [ ] 完善中文翻译（`zh.json`）
