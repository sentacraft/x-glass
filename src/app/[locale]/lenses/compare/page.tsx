import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { parseLensIds } from "@/lib/lens";
import CompareTable from "@/components/CompareTable";
import ComparePageHeader from "@/components/ComparePageHeader";
import BackButton from "@/components/BackButton";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}): Promise<Metadata> {
  const { ids } = await searchParams;
  const lenses = parseLensIds(ids);

  if (lenses.length < 2) {
    return { title: "Compare" };
  }

  const title = lenses.map((l) => l.model).join(" vs ");
  return {
    title,
    openGraph: { title: `${title} | X-Glass` },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const t = await getTranslations("Compare");

  const lenses = parseLensIds(ids);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col gap-3 sm:gap-4">
      {/* Header */}
      <ComparePageHeader lenses={lenses} minColumns={2} />

      {/* Table — minColumns=2 ensures cold start always shows 2 search-trigger columns */}
      <CompareTable lenses={lenses} minColumns={2} />

{/* Back link */}
      <BackButton
        fallbackHref="/lenses"
        label={`← ${t("backToLenses")}`}
        className="self-start text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      />
    </div>
  );
}
