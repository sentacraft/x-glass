'use client';

import { useTranslations } from 'next-intl';
import type { FilterState, FocalRange, LensType, SortKey } from '@/lib/lenses';

interface Props {
  filters: FilterState;
  brands: string[];
  sort: SortKey;
  onChange: (filters: FilterState) => void;
  onSortChange: (sort: SortKey) => void;
}

export default function LensFilters({ filters, brands, sort, onChange, onSortChange }: Props) {
  const t = useTranslations('LensList');

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  const selectClass =
    'text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Brand */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {t('brand')}
        </label>
        <select
          value={filters.brand}
          onChange={(e) => set('brand', e.target.value)}
          className={selectClass}
        >
          <option value="">{t('allBrands')}</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Lens type */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {t('lensType')}
        </label>
        <select
          value={filters.type}
          onChange={(e) => set('type', e.target.value as LensType | '')}
          className={selectClass}
        >
          <option value="">{t('allTypes')}</option>
          <option value="prime">{t('primes')}</option>
          <option value="zoom">{t('zooms')}</option>
        </select>
      </div>

      {/* Focal range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {t('focalRange')}
        </label>
        <select
          value={filters.focalRange}
          onChange={(e) => set('focalRange', e.target.value as FocalRange | '')}
          className={selectClass}
        >
          <option value="">{t('allRanges')}</option>
          <option value="wide">{t('wide')}</option>
          <option value="standard">{t('standard')}</option>
          <option value="tele">{t('tele')}</option>
        </select>
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {t('sortBy')}
        </label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className={selectClass}
        >
          <option value="focalLengthMin">{t('sortFocalLength')}</option>
          <option value="maxAperture">{t('sortAperture')}</option>
          <option value="weightG">{t('sortWeight')}</option>
          <option value="releaseYear">{t('sortYear')}</option>
        </select>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-4 pb-0.5">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.afOnly}
            onChange={(e) => set('afOnly', e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
          />
          {t('afOnly')}
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.wrOnly}
            onChange={(e) => set('wrOnly', e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
          />
          {t('wrOnly')}
        </label>
      </div>
    </div>
  );
}
