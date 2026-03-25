# Lens URL Sampling Notes

This document tracks iterative improvements for lens URL sampling.

## Current script

- Script: `scripts/sample_lens_urls.py`
- Purpose: sample a subset of lenses and normalize `officialUrl` / `imageUrl`
- Default behavior: dry-run only

## Quick usage

```bash
python3 scripts/sample_lens_urls.py --sample-size 8 --brands Fujifilm --verify --discover-fuji
python3 scripts/sample_lens_urls.py --sample-size 8 --brands Fujifilm --verify --discover-fuji --apply
```

## Improvement log

- 2026-03-25: Initial version created.
  - Supports brand filtering and sample size.
  - Supports optional reachability verification.
  - Writes only when `--apply` is set.
- 2026-03-25: v2 discovery mode added.
  - `--discover-fuji` tries per-lens Fujifilm product page discovery.
  - Extracts `og:image` / `twitter:image` as `imageUrl`.
  - Falls back safely to brand URLs and placeholder image when discovery fails.

## Next iterations

- Replace placeholder `imageUrl` with verified per-lens product images.
- Upgrade `officialUrl` from brand fallback URLs to verified per-lens product pages.
- Add structured output report (JSON) for changed/unchanged/failures.
