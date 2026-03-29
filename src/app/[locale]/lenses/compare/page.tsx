import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { parseLensIds } from "@/lib/lenses";
import { Link } from "@/i18n/navigation";
import CompareTable from "@/components/CompareTable";

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
    openGraph: { title: `${title} | X Glass` },
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/lenses"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
      </div>

      <CompareTable lenses={lenses} />

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
