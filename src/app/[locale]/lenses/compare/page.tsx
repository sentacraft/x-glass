import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { parseLensIds } from "@/lib/lens";
import { Link } from "@/i18n/navigation";
import CompareTable from "@/components/CompareTable";
import ComparePageHeader from "@/components/ComparePageHeader";
import CompareAddLensButton from "@/components/CompareAddLensButton";

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

  if (lenses.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">{t("noLenses")}</p>
        <Link href="/lenses" className="text-sm text-blue-500 hover:underline">
          ← {t("backToLenses")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col gap-3 sm:gap-6">
      {/* Header */}
      <ComparePageHeader lenses={lenses} />

      {lenses.length < 2 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          {t("needOneMoreLens")}
        </div>
      ) : null}

      <CompareTable lenses={lenses} />

      {/* Bottom add-lens entry — visible when scrolled to bottom of a long table */}
      <CompareAddLensButton
        lenses={lenses}
        triggerClassName="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
      />

      {/* Back link */}
      <Link
        href="/lenses"
        className="self-start text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
      >
        ← {t("backToLenses")}
      </Link>
    </div>
  );
}
