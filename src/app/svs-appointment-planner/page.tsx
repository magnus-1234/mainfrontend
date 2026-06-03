import type { Metadata } from "next";
import Home from "../page";

const title = "Whiteout Survival SvS Appointment Planner";
const description =
  "Plan Whiteout Survival SvS president and minister appointments with 30-minute rotations, player names, levels, resource notes, confirmations, local times, and CSV export.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://whiteoutsurvival.dev/svs-appointment-planner" },
  openGraph: {
    type: "website",
    url: "https://whiteoutsurvival.dev/svs-appointment-planner",
    siteName: "WhiteoutSurvival.dev",
    title,
    description,
    images: ["https://whiteoutsurvival.dev/social-preview-v2.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["https://whiteoutsurvival.dev/social-preview-v2.png"],
  },
};

export default function SvsAppointmentPlannerPage() {
  return <Home initialMenu="svsPlanner" />;
}
