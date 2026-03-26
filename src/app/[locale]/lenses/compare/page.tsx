import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { allLenses, getLensUrl, formatFocalDisplay, formatEquivDisplay } from '@/lib/lenses';
import { Link } from '@/i18n/navigation';
import type { Lens } from '@/lib/types';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}): Promise<Metadata> {
  const { ids } = await searchParams;
  const idList = (ids ?? '').split(',').filter(Boolean).slice(0, 4);
  const lenses = idList
    .map((id) => allLenses.find((l) => l.id === id))
    .filter((l): l is Lens => l !== undefined);

  if (lenses.length < 2) return { title: 'Compare' };

  const title = lenses.map((l) => l.model).join(' vs ');
  return {
    title,
    openGraph: { title: `${title} | X Glass` },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const t = await getTranslations('Compare');
  const td = await getTranslations('LensDetail');

  const idList = (ids ?? '').split(',').filter(Boolean).slice(0, 4);
  const lenses = idList
    .map((id) => allLenses.find((l) => l.id === id))
    .filter((l): l is Lens => l !== undefined);

  if (lenses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">{t('noLenses')}</p>
        <Link
          href="/lenses"
          className="text-sm text-blue-500 hover:underline"
        >
          ← {t('backToLenses')}
        </Link>
      </div>
    );
  }

  // Precompute best values (highlight direction: min or max)
  const best = {
    maxAperture: Math.min(...lenses.map((l) => l.maxAperture)),
    weightG: Math.min(...lenses.map((l) => l.weightG)),
    minFocusDistanceCm: Math.min(...lenses.map((l) => l.minFocusDistanceCm)),
    releaseYear: Math.max(...lenses.map((l) => l.releaseYear)),
  };

  type NumericBestKey = keyof typeof best;

  type Row =
    | { kind: 'text'; label: string; getValue: (l: Lens) => string }
    | {
        kind: 'numeric';
        label: string;
        getValue: (l: Lens) => number;
        format: (v: number) => string;
        bestKey: NumericBestKey;
      }
    | { kind: 'bool'; label: string; getValue: (l: Lens) => boolean };

  const rows: Row[] = [
    {
      kind: 'text',
      label: td('brand'),
      getValue: (l) => `${l.brand}${l.series ? ` ${l.series}` : ''}`,
    },
    {
      kind: 'text',
      label: td('focalLength'),
      getValue: (l) => formatFocalDisplay(l),
    },
    {
      kind: 'text',
      label: td('focalLengthEquiv'),
      getValue: (l) => formatEquivDisplay(l),
    },
    {
      kind: 'numeric',
      label: td('maxAperture'),
      getValue: (l) => l.maxAperture,
      format: (v) => `f/${v}`,
      bestKey: 'maxAperture',
    },
    {
      kind: 'bool',
      label: td('af'),
      getValue: (l) => l.af,
    },
    {
      kind: 'bool',
      label: td('ois'),
      getValue: (l) => l.ois,
    },
    {
      kind: 'bool',
      label: td('wr'),
      getValue: (l) => l.wr,
    },
    {
      kind: 'numeric',
      label: td('weight'),
      getValue: (l) => l.weightG,
      format: (v) => `${v}g`,
      bestKey: 'weightG',
    },
    {
      kind: 'text',
      label: td('dimensions'),
      getValue: (l) => `⌀${l.diameterMm} × ${l.lengthMm}mm`,
    },
    {
      kind: 'text',
      label: td('filterSize'),
      getValue: (l) => `${l.filterMm}mm`,
    },
    {
      kind: 'numeric',
      label: td('minFocusDist'),
      getValue: (l) => l.minFocusDistanceCm,
      format: (v) => `${v}cm`,
      bestKey: 'minFocusDistanceCm',
    },
    {
      kind: 'numeric',
      label: td('releaseYear'),
      getValue: (l) => l.releaseYear,
      format: (v) => String(v),
      bestKey: 'releaseYear',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/lenses"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t('title')}</h1>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm border-collapse">
          {/* Lens name headers */}
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="w-36 px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60" />
              {lenses.map((lens) => {
                const url = getLensUrl(lens);
                return (
                  <th
                    key={lens.id}
                    className="px-4 py-4 text-left bg-zinc-50 dark:bg-zinc-900/60 min-w-[180px]"
                  >
                    {/* Product image */}
                    <div className="mb-3 w-full aspect-square max-w-[140px] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      {lens.imageUrl ? (
                        <Image
                          src={lens.imageUrl}
                          alt={lens.model}
                          width={140}
                          height={140}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          className="w-12 h-12 text-zinc-300 dark:text-zinc-600"
                        >
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="12" cy="12" r="8" />
                          <circle cx="12" cy="12" r="10.5" />
                          <line x1="2" y1="12" x2="4" y2="12" />
                          <line x1="20" y1="12" x2="22" y2="12" />
                        </svg>
                      )}
                    </div>

                    {/* Brand / series */}
                    <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {lens.brand}
                      {lens.series ? ` · ${lens.series}` : ''}
                    </p>

                    {/* Model name */}
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lens.model}</p>

                    {lens.generation !== undefined && (
                      <p className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                        gen{lens.generation}
                      </p>
                    )}

                    {/* Official site link */}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        {t('officialSite')}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="w-3 h-3"
                        >
                          <path d="M2 10L10 2M10 2H5M10 2v5" />
                        </svg>
                      </a>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
              >
                {/* Spec label */}
                <td className="px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 whitespace-nowrap">
                  {row.label}
                </td>

                {/* Values */}
                {lenses.map((lens) => {
                  if (row.kind === 'bool') {
                    const val = row.getValue(lens);
                    return (
                      <td key={lens.id} className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        <span
                          className={`inline-block w-2 h-2 rounded-full mr-2 align-middle ${
                            val ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                          }`}
                        />
                        {val ? td('yes') : td('no')}
                      </td>
                    );
                  }

                  if (row.kind === 'numeric') {
                    const val = row.getValue(lens);
                    const isBest = val === best[row.bestKey];
                    return (
                      <td
                        key={lens.id}
                        className={`px-4 py-3 font-medium tabular-nums ${
                          isBest
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {row.format(val)}
                        {isBest && (
                          <span className="ml-1.5 text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide">
                            ★
                          </span>
                        )}
                      </td>
                    );
                  }

                  return (
                    <td key={lens.id} className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {row.getValue(lens)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Back link */}
      <Link
        href="/lenses"
        className="self-start text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      >
        ← {t('backToLenses')}
      </Link>
    </div>
  );
}
