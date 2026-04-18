# X-Glass

Browse, filter, and compare every Fujifilm X-mount lens side by side — native Fujifilm and all major third-party brands.

**[xglass.sentacraft.com](https://xglass.sentacraft.com)**

**Desktop**

![Lens browser](https://github.com/user-attachments/assets/107d9263-cf2a-4ab1-905b-ed9b6d56d523)

![Lens browser](https://github.com/user-attachments/assets/256ed68d-ccde-4961-9303-19f3899f5b36)

**Mobile**

![Mobile](https://github.com/user-attachments/assets/0d0953c5-5ed4-4f5d-88c9-38f4fd8f279e)

---

## Features

- **Growing lens database** — 8 major brands covered in the first release (Fujifilm, Sigma, Tamron, Viltrox, TTArtisan, 7Artisans, Brightin Star, SG Image), with more brands on the roadmap
- **Clean, focused UI** — distraction-free interface designed around the comparison workflow
- **Filter and sort** — multi-axis filtering (focal length, aperture, AF, OIS, weather resistance, specialty tags) combined with flexible sorting
- **Side-by-side comparison** of up to 4 lenses
- **Normalized data** — specs from different manufacturers use inconsistent formats and terminology; X-Glass maps everything to a consistent schema so comparisons are fair and objective
- **Pipeline-backed accuracy** — every spec originates from official manufacturer sources and goes through a staged pipeline with human review at every step
- **Shareable comparison posters**
- **PWA** — installable on iOS and Android
- **English + Chinese** (中文)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| i18n | next-intl |

## Data Pipeline

Lens data and images are maintained by a private pipeline repo and written into `src/data/lenses.json` via a staged pipeline:

```mermaid
flowchart TD
  subgraph pipeline["x-glass-pipeline (private)"]
    SOURCES[("sources.yaml\n· Brand aliases\n· Listing URLs per brand\n· Spec extraction sources per brand")]

    S0["Stage 0 · Index\nDiscovers X-mount lenses from brand listing pages\n· Normalizes brand names via aliases\n· Deduplicates via generated lens ID"]

    subgraph s1["Stage 1 · Collect"]
      S1p1["Phase 1 · Locate & Image  (batch per brand)\nNavigates listing pages → records official detail page URLs\nDownloads main product image from listing thumbnails"]
      S1p2["Phase 2 · Fetch rawSpecs  (per lens)\nFetches spec text from spec extraction sources\nTools: Jina Reader · Playwright · FireCrawl\nNo parsing — raw material only"]
      S1r["Maintainer · Review\nInspects fetched text and image quality"]
      S1h["Maintainer · Manual Fetch\nHand-collects raw text and images\nif Agent recall is insufficient"]
      S1b["AI Agent · Read & Merge\nApplies vision to read text embedded in spec images\nMerges with webpage text into one raw block\nNo field extraction — structured parsing in Stage 2"]
      S1out(["Merged high-recall product description"])
    end

    S2a["Stage 2a · Derive\nAI Agent reads rawSpecs to extract\nweight · dimensions · focus distance · lens formula · release year"]
    S2b["Stage 2b · Compute\nScript applies brand rules to derive\nAF · OIS · WR · aperture ring · specialty tags"]
    S2c["Stage 2c · Image Processing\nScript optimizes, crops, and normalizes\nproduct images for visual consistency"]
    SR["Stage R · Human Review\nMaintainer inspects every record\nand applies corrections"]

    subgraph sp["Stage P · Publish Gate"]
      SP1["Zod schema validation against x-glass schema\n· Intra-lens: field formats, focal range, aperture ordering, lens formula integrity\n· Cross-lens: duplicate IDs, URLs, brand-models, and spec tuples (with known-distinct allowlist)"]
      SP2["Normalization + version stamp"]
    end
  end

  SOURCES -->|"aliases + listing URLs"| S0
  SOURCES -->|"listing URLs"| S1p1
  SOURCES -->|"spec extraction sources"| S1p2
  S0 -->|"discovered lens list"| S1p1
  S1p1 --> S1p2
  S1p2 --> S1r
  S1r -->|"quality OK"| S1b
  S1r -->|"insufficient"| S1h
  S1h --> S1b
  S1b --> S1out
  S1out --> S2a & S2c
  S2a --> S2b
  S2b & S2c --> SR
  SR --> SP1
  SP1 --> SP2
  SP2 -->|"writes src/data/lenses.json"| DB[("x-glass\n(this repo)")]

  classDef script fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
  classDef agent fill:#fef9c3,stroke:#ca8a04,color:#713f12
  classDef human fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef gate fill:#f3e8ff,stroke:#9333ea,color:#3b0764
  classDef config fill:#f1f5f9,stroke:#64748b,color:#1e293b

  class S0,S2b,S2c script
  class S1p1,S1p2,S1b,S2a agent
  class S1r,S1h,SR human
  class SP1,SP2 gate
  class SOURCES config
```

**Key principles:**
- Every spec originates from official manufacturer sources, with human review at every stage
- Deterministic fields are computed in code — never inferred by LLM
- Stage isolation: each step may only build on facts confirmed in the prior step

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in GITHUB_TOKEN and GITHUB_FEEDBACK_REPO

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contributing

This project does not accept code contributions at this time.

To report a data issue (wrong spec, broken image) or suggest a missing lens, use the feedback links inside the app, or open a [GitHub Issue](https://github.com/ericzeyuzhang/x-glass/issues).

## Acknowledgments

Built with significant help from [Claude Code](https://claude.ai/code) (architecture and engineering) and [Google Gemini](https://gemini.google.com) (UX design).

Built on the shoulders of great open source work: [Base UI](https://base-ui.com), [Motion](https://motion.dev), [Lucide](https://lucide.dev), [next-intl](https://next-intl.dev), [modern-screenshot](https://github.com/qq15725/modern-screenshot), [qrcode.react](https://github.com/zpao/qrcode.react), [Geist](https://vercel.com/font).

## License

© 2026 SentaCraft. All rights reserved.

Source code is made available for reference. No license is granted to use, copy, modify, or distribute this software.
