# X Glass — CLAUDE.md

## 项目概述

富士 X 卡口镜头对比工具。用户可浏览、筛选、并排对比富士原厂及第三方全品牌 X 卡口镜头。
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

```typescript
interface Lens {
  id: string                     // "xf35mm-f14-r"
  brand: string                  // "Fujifilm" | "Viltrox" | "Sigma" ...
  series: string                 // "XF" | "XC" | ""
  model: string                  // "XF35mmF1.4 R"
  generation?: number            // 1 | 2，区分同焦段新老代（如 XF23mm f/1.4 老款 = 1，LM WR = 2）
  focalLength: number            // 实际焦距（mm）
  focalLengthEquiv: number       // 等效全画幅（×1.5 自动计算）
  maxAperture: number            // 1.4
  minAperture: number
  af: boolean
  ois: boolean
  wr: boolean
  weightG: number
  diameterMm: number
  lengthMm: number
  filterMm: number
  minFocusDistanceCm: number
  priceApproxCNY: number | null
  releaseYear: number
  officialUrl?: string
  mtfImageUrl?: string           // 二期填充，MVP 阶段留空
}
```

**新老代处理原则**：同焦段多代版本（如 XF23mm f/1.4 老款 vs LM WR 新款）均独立收录，`generation` 字段区分，满足"老款还值不值得买"的高频对比需求。

## MVP 功能范围

**纳入：**
- 镜头列表页 + 筛选（品牌 / 焦段 / 光圈 / AF/MF）
- 2–4 款并排对比
- 等效焦距自动换算（×1.5）
- i18n 框架（next-intl），语言内容后续填充

**明确不做（二期）：**
- MTF 图表对比（`mtfImageUrl` 字段预留）
- 价格实时抓取
- 镜身尺寸可视化
- 场景推荐标签

**数据量目标：** 30–50 款
- 富士原厂主力款（XF 定焦 + 变焦代表款，含新老代各一版）
- Viltrox（唯卓仕）全系（10+ 款）
- Sigma X 卡口全系（6 款）
- Tamron X 卡口全系（4 款：11-20mm / 17-70mm / 18-300mm / 150-500mm）

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

## 当前阶段：Phase 1

- [ ] 初始化 Next.js 项目，部署到 Vercel
- [ ] 完善 TypeScript 类型定义
- [ ] 整理 30–50 款镜头 JSON 数据
