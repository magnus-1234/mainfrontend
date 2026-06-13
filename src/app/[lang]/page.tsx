import { notFound } from "next/navigation";
import { HomeApp } from "../HomeApp";

const locales = ["hi", "es", "fr", "de", "it", "pt", "ru", "ar", "tr", "id", "vi", "th", "ja", "ko", "zh-CN", "zh-TW", "pl", "nl", "sv"];

interface LocalePageProps {
  params: {
    lang: string;
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default function LocaleHome({ params }: LocalePageProps) {
  if (!locales.includes(params.lang)) {
    notFound();
  }
  return <HomeApp />;
}
