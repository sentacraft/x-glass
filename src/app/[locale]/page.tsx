import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import DataInfo from "@/components/DataFooter";
import Tagline from "@/components/Tagline";
import LogoMark from "@/components/LogoMark";

export default function Home() {
  const t = useTranslations("Common");
  const h = useTranslations("Home");

  return (
    <div className="flex flex-col bg-stone-100 dark:bg-zinc-950 h-full">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-16 flex-1">
        <LogoMark size={104} uid="hero" className="mb-6" interactive />
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-800 dark:text-zinc-50">
          {t("appName")}
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 max-w-sm">
          {t("appDesc")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/lenses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {h("cta")} →
            </Link>
            <Link
              href="/lenses/compare"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {h("ctaCompare")} →
            </Link>
          </div>
          <DataInfo />
        </div>
      </section>

      {/* Tagline — barely visible footer credit */}
      <div className="pb-6 flex justify-center">
        <Tagline />
      </div>
    </div>
  );
}
