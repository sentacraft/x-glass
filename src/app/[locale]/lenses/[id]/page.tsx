import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { allLenses, getLensUrl, formatFocalDisplay, formatEquivDisplay } from '@/lib/lenses';
import { Link } from '@/i18n/navigation';

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const lens = allLenses.find((l) => l.id === id);
  if (!lens) return { title: 'Lens Not Found' };
  return {
    title: lens.model,
    openGraph: { title: `${lens.model} | X Glass` },
  };
}

export default async function LensDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const lens = allLenses.find((l) => l.id === id);

  if (!lens) notFound();

  const t = await getTranslations('LensDetail');
  const url = getLensUrl(lens);
  const focalDisplay = formatFocalDisplay(lens);
  const equivDisplay = formatEquivDisplay(lens);

  type SpecRow =
    | { label: string; value: string }
    | { label: string; bool: boolean };

  const specs: SpecRow[] = [
    { label: t('brand'), value: `${lens.brand}${lens.series ? ` ${lens.series}` : ''}` },
    { label: t('focalLength'), value: focalDisplay },
    { label: t('focalLengthEquiv'), value: equivDisplay },
    { label: t('maxAperture'), value: `f/${lens.maxAperture}` },
    { label: t('minAperture'), value: `f/${lens.minAperture}` },
    { label: t('af'), bool: lens.af },
    { label: t('ois'), bool: lens.ois },
    { label: t('wr'), bool: lens.wr },
    { label: t('weight'), value: `${lens.weightG}g` },
    { label: t('dimensions'), value: `⌀${lens.diameterMm} × ${lens.lengthMm}mm` },
    { label: t('filterSize'), value: `${lens.filterMm}mm` },
    { label: t('minFocusDist'), value: `${lens.minFocusDistanceCm}cm` },
    { label: t('releaseYear'), value: String(lens.releaseYear) },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      {/* Back link */}
      <Link
        href="/lenses"
        className="self-start text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      >
        ← {t('backToLenses')}
      </Link>

      {/* Main content */}
      <div className="flex flex-col sm:flex-row gap-8">
        {/* Image */}
        <div className="w-full sm:w-56 shrink-0">
          <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            {lens.imageUrl ? (
              <Image
                src={lens.imageUrl}
                alt={lens.model}
                width={224}
                height={224}
                className="object-contain w-full h-full"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="w-20 h-20 text-zinc-300 dark:text-zinc-600"
              >
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="10.5" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
              </svg>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-5">
          {/* Title */}
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {lens.brand}
              {lens.series ? ` · ${lens.series}` : ''}
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {lens.model}
              {lens.generation !== undefined && (
                <span className="ml-2 text-base font-normal text-zinc-400 dark:text-zinc-500">
                  gen{lens.generation}
                </span>
              )}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/lenses/compare?ids=${lens.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {t('addToCompare')}
            </Link>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
          </div>

          {/* Spec table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                  >
                    <td className="px-4 py-2.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-900/30 w-40 whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                      {'bool' in row ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              row.bool ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
                            }`}
                          />
                          {row.bool ? t('yes') : t('no')}
                        </span>
                      ) : (
                        row.value
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
