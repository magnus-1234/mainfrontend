import { notFound } from "next/navigation";
import { HomeApp } from "../HomeApp";

const locales = ["hi", "es", "fr", "de", "it", "pt", "ru", "ar", "tr", "id", "vi", "th", "ja", "ko", "zh-CN", "zh-TW", "pl", "nl", "sv"];

interface LocalePageProps {
  params: Promise<{
    lang: string;
  }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocaleHome({ params }: LocalePageProps) {
  const { lang } = await params;
  if (!locales.includes(lang)) {
    notFound();
  }
  return <HomeApp />;
}
