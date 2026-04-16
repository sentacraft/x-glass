import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AboutContent from "@/components/AboutContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About");
  return { title: t("pageTitle") };
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      <AboutContent />
    </div>
  );
}
