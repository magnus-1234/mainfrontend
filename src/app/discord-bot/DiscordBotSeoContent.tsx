/**
 * DiscordBotSeoContent
 *
 * This component is intentionally server-rendered (no "use client").
 * It provides keyword-rich, crawlable HTML content for the /discord-bot page
 * that Googlebot can index even if the main HomeApp section falls back to CSR.
 *
 * The section is visually accessible but styled to complement the main UI.
 */

export function DiscordBotSeoContent() {
  return (
    <section
      className="discord-bot-seo-content"
      aria-label="Whiteout Survival Discord Bot — Features and Commands Guide"
    >
      {/* ─── Overview ───────────────────────────────────────────────── */}
      <div className="seo-section seo-overview">
        <h2>Whiteout Survival Discord Bot — Full Feature Overview</h2>
        <p>
          The <strong>Whiteout Survival Discord bot</strong> (WOS bot) is a free, feature-rich bot
          designed specifically for <strong>Whiteout Survival alliance Discord servers</strong>. It
          automates gift code detection and redemption, monitors player activity, provides
          DeepL-powered auto-translation, sends smart event reminders, and includes a full web
          dashboard for easy management — all completely free for any WOS server.
        </p>
        <ul className="seo-feature-bullets">
          <li>
            <strong>Gift Code Alerts &amp; Auto Redeem</strong> — Detects new Whiteout Survival gift
            codes and automatically redeems them for all registered members across your server.
          </li>
          <li>
            <strong>Alliance Activity Monitor</strong> — Tracks furnace level-ups, name changes,
            avatar changes, and alliance membership changes in real time.
          </li>
          <li>
            <strong>DeepL Auto-Translation</strong> — Automatically translates messages in
            configured channels into your server&apos;s chosen language using DeepL AI.
          </li>
          <li>
            <strong>Smart Reminders</strong> — Set recurring or one-time event reminders for WOS
            events like State vs State (SvS), Bear Trap, State Transfer, and more.
          </li>
          <li>
            <strong>AI Chat &amp; Image Generation</strong> — Built-in AI assistant and image
            generation powered by the latest AI models.
          </li>
          <li>
            <strong>Web Dashboard</strong> — Manage all bot settings from{' '}
            <a href="https://bot.whiteoutsurvival.dev/" target="_blank" rel="noreferrer">
              bot.whiteoutsurvival.dev
            </a>{' '}
            — no command line needed.
          </li>
          <li>
            <strong>Music System</strong> — Play music directly in your Discord voice channels.
          </li>
          <li>
            <strong>Admin Tools</strong> — Welcome messages, moderation tools, dice games, and
            custom server utilities.
          </li>
        </ul>
      </div>

      {/* ─── Commands ───────────────────────────────────────────────── */}
      <div className="seo-section seo-commands">
        <h2>Bot Commands Quick Reference</h2>
        <p>
          Below is a quick reference for the most commonly used{' '}
          <strong>Whiteout Survival Discord bot commands</strong>. All commands are slash commands
          that appear automatically after adding the bot to your server.
        </p>
        <div className="seo-table-wrap">
          <table className="seo-commands-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>Category</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/redeem</code></td>
                <td>Gift Codes</td>
                <td>Manually redeem a WOS gift code for your account</td>
              </tr>
              <tr>
                <td><code>/giftcode</code></td>
                <td>Gift Codes</td>
                <td>Check currently active Whiteout Survival gift codes</td>
              </tr>
              <tr>
                <td><code>/register</code></td>
                <td>Setup</td>
                <td>Register your WOS player ID with the bot for auto-redeem</td>
              </tr>
              <tr>
                <td><code>/monitor add</code></td>
                <td>Alliance Monitor</td>
                <td>Add a WOS player to the alliance activity monitor</td>
              </tr>
              <tr>
                <td><code>/monitor remove</code></td>
                <td>Alliance Monitor</td>
                <td>Remove a player from the activity monitor</td>
              </tr>
              <tr>
                <td><code>/monitor list</code></td>
                <td>Alliance Monitor</td>
                <td>View all currently monitored alliance members</td>
              </tr>
              <tr>
                <td><code>/remind set</code></td>
                <td>Reminders</td>
                <td>Set a recurring or one-time reminder for a WOS event</td>
              </tr>
              <tr>
                <td><code>/remind list</code></td>
                <td>Reminders</td>
                <td>Show all active reminders in this server</td>
              </tr>
              <tr>
                <td><code>/translate setup</code></td>
                <td>Translation</td>
                <td>Configure DeepL auto-translation for a channel</td>
              </tr>
              <tr>
                <td><code>/arena</code></td>
                <td>Game Tools</td>
                <td>Show current Arena event rankings and schedules</td>
              </tr>
              <tr>
                <td><code>/player</code></td>
                <td>Game Tools</td>
                <td>Look up a WOS player profile by ID or name</td>
              </tr>
              <tr>
                <td><code>/dashboard</code></td>
                <td>Admin</td>
                <td>Get a link to your server&apos;s web dashboard</td>
              </tr>
              <tr>
                <td><code>/welcome</code></td>
                <td>Admin</td>
                <td>Configure welcome messages for new server members</td>
              </tr>
              <tr>
                <td><code>/ai</code></td>
                <td>AI</td>
                <td>Chat with the built-in AI assistant</td>
              </tr>
              <tr>
                <td><code>/imagine</code></td>
                <td>AI</td>
                <td>Generate an AI image from a text prompt</td>
              </tr>
              <tr>
                <td><code>/dice</code></td>
                <td>Fun</td>
                <td>Roll dice for in-server games and events</td>
              </tr>
              <tr>
                <td><code>/play</code></td>
                <td>Music</td>
                <td>Play a song or playlist in a voice channel</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Setup Guide ────────────────────────────────────────────── */}
      <div className="seo-section seo-setup">
        <h2>How to Add the WOS Discord Bot to Your Server</h2>
        <p>
          Setting up the <strong>Whiteout Survival Discord bot</strong> takes less than 2 minutes.
          Follow these steps:
        </p>
        <ol className="seo-steps">
          <li>
            <strong>Click &quot;Add to Discord&quot;</strong> on this page or visit{' '}
            <a href="/discord-bot">whiteoutsurvival.dev/discord-bot</a> and click the Add to Discord
            button.
          </li>
          <li>
            <strong>Authorize the bot</strong> for your Discord server. You need &quot;Manage
            Server&quot; permissions to add it.
          </li>
          <li>
            <strong>Register your players</strong> — Have alliance members use{' '}
            <code>/register</code> with their WOS player ID to enable auto gift code redeem.
          </li>
          <li>
            <strong>Configure via dashboard</strong> — Visit{' '}
            <a href="https://bot.whiteoutsurvival.dev/" target="_blank" rel="noreferrer">
              bot.whiteoutsurvival.dev
            </a>{' '}
            to set up auto-redeem channels, translation rules, alliance monitors, and reminders
            from a browser interface.
          </li>
          <li>
            <strong>Set up auto-redeem channel</strong> — In the dashboard, specify which channel
            receives gift code redeem notifications and which player IDs participate.
          </li>
          <li>
            <strong>Enable alliance monitor</strong> — Use <code>/monitor add</code> for each
            alliance member you want to track for furnace upgrades, name changes, and avatar
            changes.
          </li>
        </ol>
        <p>
          Need help? Join the{' '}
          <a href="https://discord.gg/bP5JQFH2M5" target="_blank" rel="noreferrer">
            WhiteoutSurvival.dev Discord community
          </a>{' '}
          for support.
        </p>
      </div>

      {/* ─── FAQ ────────────────────────────────────────────────────── */}
      <div className="seo-section seo-faq">
        <h2>Frequently Asked Questions — Whiteout Survival Discord Bot</h2>

        <div className="seo-faq-item">
          <h3>What is the Whiteout Survival Discord bot?</h3>
          <p>
            The Whiteout Survival Discord bot is a free bot built for WOS alliance Discord servers.
            It provides automated gift code alerts and redemption, alliance activity monitoring,
            DeepL auto-translation, event reminders, AI chat, image generation, music playback,
            admin tools, and a web management dashboard — all designed specifically for the
            Whiteout Survival game community.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>Is the Whiteout Survival Discord bot free?</h3>
          <p>
            Yes, the WOS bot is completely free to add and use. There are no paywalls or premium
            tiers — all features including gift code auto-redeem, alliance monitoring, and the web
            dashboard are available at no cost.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>How does WOS gift code auto-redeem work?</h3>
          <p>
            When a new Whiteout Survival gift code is detected, the bot automatically redeems it for
            all registered players in your Discord server without any manual action. Players register
            once using the <code>/register</code> command with their WOS player ID, and the bot
            handles all future redemptions automatically.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>What does the alliance activity monitor track?</h3>
          <p>
            The alliance monitor tracks: furnace level-ups (FC tracking), player name changes,
            avatar / profile picture changes, and alliance membership changes. When any of these
            events are detected, the bot posts a notification in your configured Discord channel.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>Does the bot support multiple languages?</h3>
          <p>
            Yes. The bot integrates with DeepL AI to provide automatic translation of messages in
            any configured channel. You can set source and target languages per channel, making it
            ideal for international WOS alliance servers.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>How many servers is the bot active in?</h3>
          <p>
            The Whiteout Survival bot is actively used in hundreds of WOS Discord servers, monitoring
            thousands of alliance members. Live stats are shown on the{' '}
            <a href="/discord-bot">discord-bot page</a>.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>What is the web dashboard for the WOS bot?</h3>
          <p>
            The web dashboard at{' '}
            <a href="https://bot.whiteoutsurvival.dev/" target="_blank" rel="noreferrer">
              bot.whiteoutsurvival.dev
            </a>{' '}
            lets you manage all bot settings from a browser — no Discord commands needed. Configure
            server overview, translation rules, auto-redeem channels, registered members, and event
            reminders from a clean web interface.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>How do I set up WOS event reminders?</h3>
          <p>
            Use the <code>/remind set</code> command in Discord to configure a reminder. You can
            specify recurring schedules for events like State vs State (SvS), Bear Trap, State
            Transfer, and other Whiteout Survival events. Reminders can also be managed via the
            web dashboard.
          </p>
        </div>
      </div>
    </section>
  );
}
