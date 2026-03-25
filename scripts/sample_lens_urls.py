#!/usr/bin/env python3
import argparse
import json
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
LENSES_PATH = ROOT / 'src' / 'data' / 'lenses.json'

BRAND_FALLBACK_URLS = {
    'Fujifilm': 'https://fujifilm-x.com/global/products/lenses/',
    'Viltrox': 'https://viltrox.com/',
    'Sigma': 'https://www.sigma-global.com/en/lenses/categories/mirrorless/fujifilm-x.html',
    'Tamron': 'https://www.tamron.com/en/lenses/',
}

DEFAULT_IMAGE_URL = '/next.svg'
FUJI_BASE = 'https://fujifilm-x.com/global/products/lenses/'
UA = 'Mozilla/5.0 X-Glass URL Sampler'


OG_IMAGE_PATTERNS = [
    re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', re.I),
    re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', re.I),
    re.compile(r'<meta[^>]+name=["\']twitter:image["\'][^>]*content=["\']([^"\']+)["\']', re.I),
]



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Sample and enrich lens officialUrl/imageUrl fields.',
    )
    parser.add_argument('--path', default=str(LENSES_PATH), help='Path to lenses.json')
    parser.add_argument('--sample-size', type=int, default=10, help='How many lenses to sample')
    parser.add_argument(
        '--brands',
        default='',
        help='Comma-separated brands to include, e.g. Fujifilm,Sigma',
    )
    parser.add_argument('--verify', action='store_true', help='Verify URL reachability')
    parser.add_argument('--discover-fuji', action='store_true', help='Try finding per-lens Fujifilm pages')
    parser.add_argument('--apply', action='store_true', help='Write changes back to file')
    parser.add_argument('--timeout', type=float, default=8.0, help='HTTP timeout seconds')
    return parser.parse_args()



def load_lenses(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text())



def _request(url: str, timeout: float) -> tuple[int, str, str]:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={'User-Agent': UA}, method='GET')
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        status = getattr(resp, 'status', 200)
        final_url = resp.geturl()
        ctype = resp.headers.get('Content-Type', '').lower()
        body = resp.read().decode('utf-8', errors='ignore')
        return status, final_url, ctype + '\n' + body



def fetch_html(url: str, timeout: float) -> tuple[bool, str, str]:
    try:
        status, final_url, ctype_plus_body = _request(url, timeout)
        ctype, html = ctype_plus_body.split('\n', 1)
        ok = 200 <= status < 400 and 'text/html' in ctype
        return ok, final_url, html
    except (urllib.error.URLError, TimeoutError, ValueError):
        return False, url, ''



def url_ok(url: str, timeout: float) -> bool:
    ok, _, _ = fetch_html(url, timeout)
    return ok



def extract_og_image(html: str, base_url: str) -> str | None:
    for pattern in OG_IMAGE_PATTERNS:
        m = pattern.search(html)
        if not m:
            continue
        raw = m.group(1).strip()
        if not raw:
            continue
        return urllib.parse.urljoin(base_url, raw)
    return None



def is_image_url(url: str) -> bool:
    lowered = url.lower().split('?', 1)[0]
    return lowered.endswith(('.jpg', '.jpeg', '.png', '.webp', '.avif'))



def fuji_slug_candidates(lens: dict[str, Any]) -> list[str]:
    candidates: list[str] = []
    lens_id = str(lens.get('id', '')).strip()
    model = str(lens.get('model', '')).strip().lower()

    if lens_id:
        candidates.append(lens_id)

    if model:
        s = model
        s = s.replace('|', '')
        s = s.replace('·', '')
        s = s.replace(' ', '-')
        s = s.replace('.', '')
        s = re.sub(r'-+', '-', s).strip('-')
        candidates.append(s)

        s2 = model
        s2 = s2.replace('|', '')
        s2 = s2.replace('·', '')
        s2 = s2.replace(' ', '-')
        s2 = re.sub(r'f(\d+)-(\d+)', r'f\1\2', s2)
        s2 = s2.replace('.', '')
        s2 = re.sub(r'-+', '-', s2).strip('-')
        candidates.append(s2)

    seen: set[str] = set()
    uniq: list[str] = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            uniq.append(c)
    return uniq



def discover_fuji_urls(lens: dict[str, Any], timeout: float) -> tuple[str | None, str | None]:
    for slug in fuji_slug_candidates(lens):
        page_url = urllib.parse.urljoin(FUJI_BASE, slug + '/')
        ok, final_url, html = fetch_html(page_url, timeout)
        if not ok:
            continue
        image = extract_og_image(html, final_url)
        return final_url, image
    return None, None



def choose_sample(
    lenses: list[dict[str, Any]],
    sample_size: int,
    allowed_brands: set[str],
) -> list[dict[str, Any]]:
    pool = [l for l in lenses if not allowed_brands or l.get('brand', '') in allowed_brands]
    return pool[: max(sample_size, 0)]



def normalize_lens(
    lens: dict[str, Any],
    verify: bool,
    discover_fuji: bool,
    timeout: float,
) -> tuple[dict[str, Any], list[str]]:
    changes: list[str] = []
    brand = lens.get('brand', '')

    if discover_fuji and brand == 'Fujifilm':
        discovered_official, discovered_image = discover_fuji_urls(lens, timeout)

        if discovered_official and lens.get('officialUrl') != discovered_official:
            lens['officialUrl'] = discovered_official
            changes.append('set per-lens Fujifilm officialUrl')

        if discovered_image and is_image_url(discovered_image) and lens.get('imageUrl') != discovered_image:
            lens['imageUrl'] = discovered_image
            changes.append('set imageUrl from og:image')

    current_official = lens.get('officialUrl')
    fallback = BRAND_FALLBACK_URLS.get(brand)

    if not current_official and fallback:
        lens['officialUrl'] = fallback
        changes.append('set officialUrl from brand fallback')
    elif current_official and verify and not url_ok(current_official, timeout):
        if fallback and current_official != fallback:
            lens['officialUrl'] = fallback
            changes.append('replace unreachable officialUrl with brand fallback')

    if not lens.get('imageUrl'):
        lens['imageUrl'] = DEFAULT_IMAGE_URL
        changes.append('set imageUrl default placeholder')

    return lens, changes



def main() -> int:
    args = parse_args()
    path = Path(args.path)

    if not path.exists():
        raise FileNotFoundError(f'lenses file not found: {path}')

    brands = {b.strip() for b in args.brands.split(',') if b.strip()}
    lenses = load_lenses(path)
    sample = choose_sample(lenses, args.sample_size, brands)

    if not sample:
        print('No lenses matched the sampling criteria.')
        return 0

    changed_ids: list[str] = []

    for lens in sample:
        _, changes = normalize_lens(
            lens,
            verify=args.verify,
            discover_fuji=args.discover_fuji,
            timeout=args.timeout,
        )
        if changes:
            changed_ids.append(lens.get('id', '<unknown-id>'))
            print(f"[changed] {lens.get('id')} -> {', '.join(changes)}")
        else:
            print(f"[skip]    {lens.get('id')} (no changes)")

    print(f'\nSample size: {len(sample)}')
    print(f'Changed: {len(changed_ids)}')

    if args.apply and changed_ids:
        path.write_text(json.dumps(lenses, ensure_ascii=False, indent=2) + '\n')
        print(f'Applied changes to: {path}')
    elif args.apply:
        print('Nothing to write.')
    else:
        print('Dry run mode. Re-run with --apply to write changes.')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
