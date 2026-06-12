import { HomeApp } from "../HomeApp";

interface LocalePageProps {
  params: {
    lang: string;
  };
}

export default function LocaleHome({ params }: LocalePageProps) {
  return <HomeApp />;
}
