import type { Metadata } from "next";
import AboutContent from "@/components/AboutContent";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "About" };
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      <AboutContent />
    </div>
  );
}
