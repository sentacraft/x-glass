import React from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { Flag, Mail, Coffee, Zap } from "lucide-react";
import FeedbackTrigger from "@/components/FeedbackTrigger";
import { ExternalLink } from "@/components/ui/external-link";
import { cn } from "@/lib/utils";
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
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
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

  const donationPlatforms: {
    id: string;
    label: string;
    desc: string;
    href: string;
    icon: React.ReactNode;
    brandVars: React.CSSProperties;
  }[] = [
    {
      id: "github-sponsors",
      label: t("donationGitHubSponsors"),
      desc: t("donationGitHubSponsorsDesc"),
      href: "#", // TODO: add GitHub Sponsors URL
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
      brandVars: {
        "--donation-border": "rgba(234,74,170,0.4)",
        "--donation-bg-light": "rgba(234,74,170,0.05)",
        "--donation-bg-dark": "rgba(234,74,170,0.1)",
        "--donation-icon": "#ea4aaa",
      } as React.CSSProperties,
    },
    {
      id: "bmc",
      label: t("donationBMC"),
      desc: t("donationBMCDesc"),
      href: "#", // TODO: add Buy Me a Coffee URL
      icon: <Coffee size={22} />,
      brandVars: {
        "--donation-border": "rgba(255,221,0,0.6)",
        "--donation-bg-light": "rgba(255,221,0,0.05)",
        "--donation-bg-dark": "rgba(255,221,0,0.1)",
        "--donation-icon": "#d4a800",
      } as React.CSSProperties,
    },
    ...(locale === "zh"
      ? [{
          id: "afdian",
          label: t("donationAfdian"),
          desc: t("donationAfdianDesc"),
          href: "#", // TODO: add Afdian URL
          icon: <Zap size={22} />,
          brandVars: {
            "--donation-border": "rgba(124,77,255,0.4)",
            "--donation-bg-light": "rgba(124,77,255,0.05)",
            "--donation-bg-dark": "rgba(124,77,255,0.1)",
            "--donation-icon": "#7c4dff",
          } as React.CSSProperties,
        }]
      : []),
  ];

  const ackCredits = [
    {
      roles: [t("ackClaudeArchitect"), t("ackClaudeEngineer")],
      company: "Anthropic",
      product: "Claude Code",
      logo: "/logos/anthropic.svg",
      logoAlt: "Anthropic Claude",
      logoClassName: "",
      logoSize: 37,
      glowColor: "rgba(226, 112, 37, 0.06)",
    },
    {
      roles: [t("ackGeminiDesigner"), t("ackGeminiBrandStrategist")],
      company: "Google",
      product: "Gemini",
      logo: "/logos/google-gemini.svg",
      logoAlt: "Google Gemini",
      logoClassName: "",
      logoSize: 37,
      glowColor: "rgba(66, 133, 244, 0.06)",
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-12 pb-12 flex flex-col gap-6">
      <div className="flex items-center gap-3">
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
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {faqItems.map((item) => (
            <details key={item.q} className="group py-3 first:pt-0 last:pb-0">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-sm font-medium text-zinc-800 dark:text-zinc-200 select-none">
                {item.q}
                <svg
                  viewBox="0 0 16 16"
                  width="14"
                  height="14"
                  fill="currentColor"
                  className="flex-shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path d="M8 10.94 2.53 5.47l.94-.94L8 9.06l4.53-4.53.94.94L8 10.94Z" />
                </svg>
              </summary>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Disclaimer */}
      <Section id="disclaimer" title={t("disclaimerTitle")}>
        <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 px-4 py-3 flex flex-col gap-2">
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("privacyAnalytics")}
        </p>
      </Section>

      {/* Donation */}
      <Section id="donation" title={t("donationTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("donationBody")}
        </p>
        <div className="flex flex-wrap gap-3 mt-1">
          {donationPlatforms.map(({ id, label, desc, href, icon, brandVars }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={brandVars}
              className="donation-card flex flex-col gap-2.5 p-4 rounded-xl flex-1 basis-[140px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              <span className="donation-icon text-zinc-400 dark:text-zinc-500 transition-colors duration-200">
                {icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* Acknowledgments */}
      <Section id="ack" title={t("ackTitle")}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t("ackBody")}
        </p>

        {/* Card + story pairs — card IS the accordion trigger */}
        <div className="flex flex-col gap-0">
          {ackCredits.map(({ roles, company, product, logo, logoAlt, logoClassName, logoSize, glowColor }, i) => {
            const storyKey = i === 0 ? "1" : "2";
            const heading = t(`ackStory${storyKey}Heading` as "ackStory1Heading");
            const body = t(`ackStory${storyKey}Body` as "ackStory1Body");
            return (
              <React.Fragment key={`${company}-${product}`}>
                {i > 0 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />
                  </div>
                )}
              <details
                key={`${company}-${product}`}
                className="group rounded-2xl overflow-hidden"
                style={{ background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)` }}
              >
                {/* summary = card header / trigger */}
                <summary className="flex items-center gap-5 px-8 py-[34px] cursor-pointer list-none select-none">
                  <div className="flex-1 text-right">
                    {roles.map((role) => (
                      <p key={role} className="text-[10px] tracking-widest uppercase text-zinc-400 dark:text-zinc-500 leading-5">
                        {role}
                      </p>
                    ))}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt={logoAlt}
                    width={logoSize}
                    height={logoSize}
                    className={`flex-shrink-0 ${logoClassName}`}
                    loading="lazy"
                  />
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 whitespace-nowrap">{product}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{company}</p>
                    </div>
                    <svg
                      viewBox="0 0 16 16"
                      width="13"
                      height="13"
                      fill="currentColor"
                      className="flex-shrink-0 text-zinc-300 dark:text-zinc-600 transition-transform duration-200 group-open:rotate-180 ml-auto"
                      aria-hidden="true"
                    >
                      <path d="M8 10.94 2.53 5.47l.94-.94L8 9.06l4.53-4.53.94.94L8 10.94Z" />
                    </svg>
                  </div>
                </summary>
                {/* Story content — inside the card */}
                <div className="px-8 pb-7 pt-5 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 text-center">{heading}</p>
                  {body.split("\n\n").map((para, j) => (
                    <p key={j} className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </details>
              </React.Fragment>
            );
          })}
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
