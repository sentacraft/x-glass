import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import { Flag, Mail, Heart } from "lucide-react";
import Iris from "@/components/Iris";
import { IRIS_NAV } from "@/config/iris-config";
import FeedbackTrigger from "@/components/FeedbackTrigger";
import { ExternalLink } from "@/components/ui/external-link";
import type { FeedbackType } from "@/components/FeedbackDialog";

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-3 scroll-mt-20">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function AboutContent() {
  const [t, locale] = await Promise.all([
    getTranslations("About"),
    getLocale(),
  ]);

  const faqItems = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
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

  const pipelineStages = [
    { badge: "0", label: t("pipeline0Label"), desc: t("pipeline0Desc") },
    { badge: "1", label: t("pipeline1Label"), desc: t("pipeline1Desc") },
    { badge: "2", label: t("pipeline2Label"), desc: t("pipeline2Desc") },
    { badge: "R", label: t("pipelineRLabel"), desc: t("pipelineRDesc") },
    { badge: "P", label: t("pipelinePLabel"), desc: t("pipelinePDesc") },
  ];

  const donationLinks = [
    { label: t("donationGitHubSponsors"), href: "#" /* TODO: add GitHub Sponsors URL */ },
    { label: t("donationBMC"), href: "#" /* TODO: add Buy Me a Coffee URL */ },
    // Afdian is only relevant for Chinese mainland users
    ...(locale === "zh"
      ? [{ label: t("donationAfdian"), href: "#" /* TODO: add Afdian URL */ }]
      : []),
  ];

  const ackCredits = [
    {
      roles: [t("ackClaudeArchitect"), t("ackClaudeEngineer")],
      company: "Anthropic",
      product: "Claude Code",
      logo: "/logos/anthropic.svg",
      logoAlt: "Anthropic Claude",
      // Color icon — no invert needed
      logoClassName: "",
      logoWidth: 32,
      logoHeight: 32,
    },
    {
      roles: [t("ackGeminiDesigner"), t("ackGeminiBrandStrategist")],
      company: "Google",
      product: "Gemini",
      logo: "/logos/google-gemini.svg",
      logoAlt: "Google Gemini",
      // Colorful gradient icon — no invert needed
      logoClassName: "",
      logoWidth: 32,
      logoHeight: 32,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-12 pb-12 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Iris config={IRIS_NAV} size={28} uid="about" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Table of Contents */}
      <nav className="flex flex-col gap-1">
        {[
          { id: "background", label: t("backgroundTitle") },
          { id: "coverage", label: t("coverageTitle") },
          { id: "data-accuracy", label: t("dataAccuracyTitle") },
          { id: "faq", label: t("faqTitle") },
          { id: "disclaimer", label: t("disclaimerTitle") },
          { id: "privacy", label: t("privacyTitle") },
          { id: "donation", label: t("donationTitle") },
          { id: "ack", label: t("ackTitle") },
          { id: "feedback", label: t("feedbackTitle") },
        ].map(({ id, label }, i) => (
          <a
            key={id}
            href={`#${id}`}
            className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <span className="text-[10px] text-zinc-300 dark:text-zinc-600 w-4 text-right tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            {label}
          </a>
        ))}
      </nav>

      {/* Background */}
      <Section id="background" title={t("backgroundTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("backgroundBody1")}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("backgroundBody2")}
        </p>
      </Section>

      {/* Coverage */}
      <Section id="coverage" title={t("coverageTitle")}>
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

      {/* Data & Accuracy */}
      <Section id="data-accuracy" title={t("dataAccuracyTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("dataAccuracyIntro")}
        </p>

        {/* Two core principles */}
        <div className="flex flex-col gap-3 mt-1">
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">
              {t("dataPrinciple1Title")}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t("dataPrinciple1Body")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">
              {t("dataPrinciple2Title")}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t("dataPrinciple2Body")}
            </p>
          </div>
        </div>

        {/* Pipeline overview */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 px-4 py-3 mt-1">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
            {t("dataPipelineIntro")}
          </p>
          <ol className="flex flex-col gap-2.5">
            {pipelineStages.map((stage) => (
              <li key={stage.badge} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-mono text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                  {stage.badge}
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {stage.label}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 ml-2">
                    {stage.desc}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Update cadence */}
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          {t("dataUpdateNote")}{"  "}{t("dataVersionNote")}
        </p>
      </Section>

      {/* FAQ */}
      <Section id="faq" title={t("faqTitle")}>
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
      <Section id="disclaimer" title={t("disclaimerTitle")}>
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
      <Section id="privacy" title={t("privacyTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("privacyBody")}
        </p>
      </Section>

      {/* Donation */}
      <Section id="donation" title={t("donationTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("donationBody")}
        </p>
        <div className="flex flex-col gap-2 mt-1">
          {donationLinks.map(({ label, href }) => (
            <ExternalLink
              key={label}
              href={href}
              className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors self-start"
            >
              <span className="text-zinc-400 dark:text-zinc-500">
                <Heart size={13} />
              </span>
              {label}
            </ExternalLink>
          ))}
        </div>
      </Section>

      {/* Acknowledgments */}
      <Section id="ack" title={t("ackTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("ackBody")}
        </p>

        {/* Cast list — centered credits style */}
        <div className="mt-4 flex flex-col items-center gap-8 text-center">
          {ackCredits.map(({ roles, company, product, logo, logoAlt, logoClassName, logoWidth, logoHeight }) => (
            <div key={`${company}-${product}`} className="flex flex-col items-center gap-2">
              <p className="text-xs tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                {roles.join(" · ")}
              </p>
              <Image
                src={logo}
                alt={logoAlt}
                width={logoWidth}
                height={logoHeight}
                className={logoClassName}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="text-zinc-400 dark:text-zinc-500">{company}</span>
                {" "}
                <span className="font-medium text-zinc-600 dark:text-zinc-300">{product}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Closing line */}
        <div className="mt-2 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            {t("ackClosing")}
          </p>
        </div>
      </Section>

      {/* Feedback */}
      <Section id="feedback" title={t("feedbackTitle")}>
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
