import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for WhiteoutSurvival.dev and the Whiteout Survival Discord bot.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <Link className="legal-back-link" href="/">WhiteoutSurvival.dev</Link>
        <p className="legal-kicker">Effective June 3, 2026</p>
        <h1>Privacy Policy</h1>
        <p>
          This policy explains how WhiteoutSurvival.dev and the Whiteout Survival Discord bot handle information when you use
          our website, calculators, community tools, Discord bot features, and related services.
        </p>
      </section>

      <section className="legal-card">
        <h2>Information We Collect</h2>
        <p>
          We collect only the information needed to run the tools and bot features you choose to use. This may include Discord
          user IDs, server IDs, channel IDs, role IDs, display names, player IDs, alliance details, reminder settings, submitted
          gift-code or template data, support messages, and basic account details from sign-in providers such as Google or Discord.
        </p>
        <p>
          Website systems may also receive technical information such as browser type, device type, IP address, request times,
          pages visited, cookies, and local storage values used for sessions, preferences, language selection, and abuse prevention.
        </p>

        <h2>How We Use Information</h2>
        <p>
          We use information to provide requested features, operate bot commands, remember settings, process gift-code redemption
          requests, display community uploads, protect accounts, prevent spam or abuse, troubleshoot errors, and improve the
          reliability of WhiteoutSurvival.dev.
        </p>

        <h2>Discord Bot Data</h2>
        <p>
          The bot stores server and user configuration only where needed for enabled features, such as reminders, role menus,
          alliance monitoring, welcome messages, moderation logs, registration, music queues, and gift-code alerts. Server
          administrators control which bot features are enabled in their Discord server.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell personal information. We may share limited information with service providers that host, secure, or
          operate the website and bot, or when required to comply with law, enforce our terms, investigate abuse, or protect the
          service and its users.
        </p>

        <h2>Cookies and Local Storage</h2>
        <p>
          The website may use cookies or browser storage for login sessions, language settings, interface preferences, cached
          tool data, and security checks. You can clear these through your browser, but some features may stop working until you
          sign in or configure them again.
        </p>

        <h2>Data Retention</h2>
        <p>
          We keep information for as long as needed to provide the service, maintain records, resolve disputes, protect against
          abuse, or meet legal obligations. Some bot configuration can be removed by disabling the relevant feature, removing the
          bot, or contacting us.
        </p>

        <h2>Your Choices</h2>
        <p>
          You may request access, correction, or deletion of information associated with your account or Discord server where we
          can reasonably verify the request. Server administrators can also remove the bot or clear feature settings from their
          server.
        </p>

        <h2>Children</h2>
        <p>
          WhiteoutSurvival.dev is not directed to children under 13. If you believe a child has provided personal information,
          contact us so we can review and remove it where appropriate.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy when the website, bot, or legal requirements change. The effective date above shows when the
          latest version took effect.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy requests or questions, contact the WhiteoutSurvival.dev team through the community Discord linked on the
          website.
        </p>
      </section>
    </main>
  );
}
