import { allLenses } from '@/lib/lenses';
import LensListClient from '@/components/LensListClient';

export default function LensesPage() {
  return <LensListClient lenses={allLenses} />;
}
