# X-Glass

Browse, filter, and compare every Fujifilm X-mount lens side by side — native Fujifilm and all major third-party brands.

**[xglass.sentacraft.com](https://xglass.sentacraft.com)**

![X-Glass screenshot](docs/screenshot.png)

---

## Features

- **121 lenses** across 8 brands: Fujifilm, Sigma, Tamron, Viltrox, TTArtisan, 7Artisans, Brightin Star, SG Image
- Multi-axis filtering: focal length, aperture, AF, OIS, weather resistance, specialty tags
- Side-by-side comparison of up to 6 lenses
- Shareable comparison posters
- PWA — installable on iOS and Android
- English + Chinese (中文)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Data | `src/data/lenses.json` (co-located with source) |
| i18n | next-intl |

## Data Pipeline

Lens data and images are maintained by the private [`x-glass-pipeline`](https://github.com/ericzeyuzhang/x-glass-pipeline) repo and written into `src/data/lenses.json` via a staged pipeline:

```mermaid
flowchart TD
  subgraph pipeline["x-glass-pipeline (private)"]
    S0["Stage 0 · Discovery\nScript indexes lens listings from brand websites"]
    S1["Stage 1 · Raw Recall\nAI Agent collects official descriptions and raw spec text"]
    S2a["Stage 2a · Deterministic\nScript computes rule-based fields\n(equiv. focal length, angle of view, etc.)"]
    S2b["Stage 2b · Semantic\nAI Agent derives categorical fields\n(specialty tags, etc.)"]
    SR["Stage R · Human Review\nMaintainer inspects every record and applies corrections"]
    SP["Stage P · Publish Gate\nValidation, normalization, version stamp"]
  end

  S0 --> S1
  S1 --> S2a & S2b
  S2a & S2b --> SR
  SR --> SP
  SP -->|"writes src/data/lenses.json"| DB[("x-glass\n(this repo)")]
```

**Key principles:**
- Every spec originates from official manufacturer sources, with human review at every stage
- Deterministic fields (angle of view, equivalent focal length) are computed in code — never inferred by LLM
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

## License

© 2026 Eric Zhang. All rights reserved.

Source code is made available for reference. No license is granted to use, copy, modify, or distribute this software.
