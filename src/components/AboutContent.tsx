import { getTranslations } from "next-intl/server";
import { Flag, Mail } from "lucide-react";
import Iris from "@/components/Iris";
import FeedbackTrigger from "@/components/FeedbackTrigger";
import type { FeedbackType } from "@/components/FeedbackDialog";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function AboutContent() {
  const t = await getTranslations("About");

  const faqItems = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];

  const feedbackLinks: {
    label: string;
    type: FeedbackType;
    icon: React.ReactNode;
  }[] = [
    { label: t("feedbackReport"), type: "data_issue", icon: <Flag size={13} /> },
    { label: t("feedbackSuggest"), type: "missing_lens", icon: <Flag size={13} /> },
    { label: t("feedbackGeneral"), type: "general", icon: <Mail size={13} /> },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-12 pb-12 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Iris size={28} uid="about" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Background */}
      <Section title={t("backgroundTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("backgroundBody")}
        </p>
      </Section>

      {/* Coverage */}
      <Section title={t("coverageTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("coverageBody")}
        </p>
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-4 py-3 mt-1">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            {t("coverageBrands")}
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {t("coverageBrandList")}
          </p>
        </div>
      </Section>

      {/* Data Maintenance */}
      <Section title={t("dataTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("dataBody")}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
          {t("dataVersionNote")}
        </p>
      </Section>

      {/* FAQ */}
      <Section title={t("faqTitle")}>
        <dl className="flex flex-col gap-5">
          {faqItems.map((item) => (
            <div key={item.q}>
              <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                {item.q}
              </dt>
              <dd className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Disclaimer */}
      <Section title={t("disclaimerTitle")}>
        <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 px-4 py-3 flex flex-col gap-2">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {t("disclaimerSources")}
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {t("disclaimerAccuracy")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            {t("disclaimerLiability")}
          </p>
        </div>
      </Section>

      {/* Privacy */}
      <Section title={t("privacyTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("privacyBody")}
        </p>
      </Section>

      {/* Changelog */}
      <Section title={t("changelogTitle")}>
        <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("changelogBody")}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
            {t("changelogPlaceholder")}
          </p>
        </div>
      </Section>

      {/* Feedback */}
      <Section title={t("feedbackTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("feedbackBody")}
        </p>
        <div className="flex flex-col gap-2 mt-1">
          {feedbackLinks.map(({ label, type: feedbackType, icon }) => (
            <FeedbackTrigger
              key={feedbackType}
              type={feedbackType}
              className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors self-start"
            >
              <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
              {label}
            </FeedbackTrigger>
          ))}
        </div>
      </Section>
    </div>
  );
}
