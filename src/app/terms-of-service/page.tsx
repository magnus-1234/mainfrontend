import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for WhiteoutSurvival.dev and the Whiteout Survival Discord bot.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <Link className="legal-back-link" href="/">WhiteoutSurvival.dev</Link>
        <p className="legal-kicker">Effective June 3, 2026</p>
        <h1>Terms of Service</h1>
        <p>
          These terms apply when you use WhiteoutSurvival.dev, the Whiteout Survival Discord bot, and related tools, pages,
          calculators, community features, and bot commands.
        </p>
      </section>

      <section className="legal-card">
        <h2>Use of the Service</h2>
        <p>
          You may use the website and bot for lawful Whiteout Survival community purposes. You are responsible for the activity
          that happens through your account, Discord server, submitted content, and bot configuration.
        </p>

        <h2>Discord Servers</h2>
        <p>
          By adding the bot to a Discord server, you confirm that you have permission to do so and that the server will follow
          Discord&apos;s rules, these terms, and any applicable laws. Server administrators are responsible for configuring bot
          features and informing members where bot features may log or display activity.
        </p>

        <h2>Acceptable Use</h2>
        <p>
          Do not use the service to harass others, spam commands, scrape or overload systems, bypass security controls, upload
          malicious content, impersonate other people, publish private information without permission, or interfere with the
          website, bot, Discord, Whiteout Survival, or other users.
        </p>

        <h2>Community Content</h2>
        <p>
          If you submit templates, island layouts, names, comments, images, player details, or other content, you keep your own
          rights to that content but give us permission to host, display, moderate, and remove it as needed to operate the
          service. Do not submit content you do not have the right to share.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          The service may rely on Discord, Google sign-in, hosting providers, game data sources, and other third-party services.
          We are not responsible for third-party outages, rule changes, account actions, data handling, or content.
        </p>

        <h2>Fan Project Notice</h2>
        <p>
          WhiteoutSurvival.dev is a fan-made community resource for Whiteout Survival. It is not affiliated with, endorsed by,
          or sponsored by Century Games. Game names, images, and related materials belong to their respective owners.
        </p>

        <h2>Availability and Changes</h2>
        <p>
          We may update, limit, suspend, or remove parts of the website or bot at any time, including features, commands, stored
          settings, or user-submitted content. We may also update these terms as the service changes.
        </p>

        <h2>Disclaimers</h2>
        <p>
          The service is provided as is and as available. Calculators, wiki data, state-age results, gift-code information, bot
          automation, and community submissions may be incomplete, delayed, or inaccurate. Use them at your own discretion.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the fullest extent allowed by law, WhiteoutSurvival.dev and its operators are not liable for indirect, incidental,
          special, consequential, or punitive damages, or for lost data, lost profits, account actions, game outcomes, or Discord
          server issues related to use of the service.
        </p>

        <h2>Termination</h2>
        <p>
          We may restrict access, remove content, disable bot features, or block users or servers that violate these terms,
          create risk, or abuse the service.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to the WhiteoutSurvival.dev team through the community Discord linked on the
          website.
        </p>
      </section>
    </main>
  );
}
