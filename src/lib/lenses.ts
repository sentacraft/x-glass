import lensesData from '../data/lenses.json';
import type { Lens } from './types';

export const allLenses: Lens[] = lensesData as Lens[];

export type FocalRange = 'wide' | 'standard' | 'tele';
export type LensType = 'prime' | 'zoom';

export interface FilterState {
  brand: string;
  type: LensType | '';
  focalRange: FocalRange | '';
  afOnly: boolean;
  wrOnly: boolean;
}

export const defaultFilters: FilterState = {
  brand: '',
  type: '',
  focalRange: '',
  afOnly: false,
  wrOnly: false,
};

export function filterLenses(lenses: Lens[], filters: FilterState): Lens[] {
  return lenses.filter((lens) => {
    if (filters.brand && lens.brand !== filters.brand) return false;
    if (filters.type === 'prime' && lens.focalLengthMax !== undefined) return false;
    if (filters.type === 'zoom' && lens.focalLengthMax === undefined) return false;
    if (filters.focalRange) {
      const equiv = lens.focalLengthEquiv;
      if (filters.focalRange === 'wide' && equiv > 35) return false;
      if (filters.focalRange === 'standard' && (equiv <= 35 || equiv > 85)) return false;
      if (filters.focalRange === 'tele' && equiv <= 85) return false;
    }
    if (filters.afOnly && !lens.af) return false;
    if (filters.wrOnly && !lens.wr) return false;
    return true;
  });
}

export function getUniqueBrands(lenses: Lens[]): string[] {
  return [...new Set(lenses.map((l) => l.brand))].sort();
}
