# X-Glass

Fujifilm X-mount lens comparison tool. Browse, filter, and compare all X-mount lenses side by side — Fujifilm native and third-party brands.

## Tech stack

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Data**: `src/data/lenses.json` (co-located with source)
- **i18n**: next-intl (English + Chinese)

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data pipeline

Lens data and images are maintained by the private [x-glass-pipeline](../x-glass-pipeline/) repo.
See that repo's README for collection and image processing details.
