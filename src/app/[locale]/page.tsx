import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Home() {
  const t = useTranslations("Common");
  const h = useTranslations("Home");

  const features = [
    { title: h("feature1Title"), desc: h("feature1Desc"), icon: "⊟" },
    { title: h("feature2Title"), desc: h("feature2Desc"), icon: "⊞" },
    { title: h("feature3Title"), desc: h("feature3Desc"), icon: "↔" },
  ] as const;

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-28 sm:py-36">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("appName")}
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 max-w-sm">
          {t("appDesc")}
        </p>
        <Link
          href="/lenses"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {h("cta")} →
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-2"
          >
            <span className="text-2xl">{f.icon}</span>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              {f.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
