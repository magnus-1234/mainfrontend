/**
 * DiscordBotSeoContent
 *
 * Server-rendered SEO content for the /discord-bot page.
 * Provides keyword-rich, crawlable HTML that Googlebot indexes
 * even if the main HomeApp section falls back to CSR.
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
          automates gift code detection and redemption, monitors alliance activity, provides
          DeepL-powered auto-translation, tracks server age, and includes a full web dashboard for
          easy management — all completely free for any WOS server.
        </p>
        <ul className="seo-feature-bullets">
          <li>
            <strong>Gift Code Alerts &amp; Auto Redeem</strong> — Detects new Whiteout Survival gift
            codes and automatically redeems them for all registered members across your server.
          </li>
          <li>
            <strong>Alliance Activity Monitor</strong> — Tracks furnace level-ups, name changes,
            avatar changes, and alliance membership changes in real time via{' '}
            <code>/alliancemonitor</code>.
          </li>
          <li>
            <strong>DeepL Auto-Translation</strong> — Automatically translates messages in
            configured channels using DeepL AI. Set up with <code>/autotranslatecreate</code>.
          </li>
          <li>
            <strong>Smart Reminders</strong> — Set recurring or one-time event reminders for WOS
            events directly from the{' '}
            <code>/settings</code> menu or the web dashboard.
          </li>
          <li>
            <strong>AI Chat, Web Search &amp; TTS</strong> — Built-in AI web search with{' '}
            <code>/websearch</code> and text-to-speech with <code>/tts</code>.
          </li>
          <li>
            <strong>Web Dashboard</strong> — Manage all bot settings from{' '}
            <a href="https://bot.whiteoutsurvival.dev/" target="_blank" rel="noreferrer">
              bot.whiteoutsurvival.dev
            </a>{' '}
            — no command line needed.
          </li>
          <li>
            <strong>Welcome System</strong> — Configure welcome messages for new members with{' '}
            <code>/welcome</code>.
          </li>
          <li>
            <strong>Admin &amp; Management Tools</strong> — Full server management via{' '}
            <code>/settings</code> and <code>/manage</code>, plus alliance member management with
            prefix commands.
          </li>
        </ul>
      </div>

      {/* ─── Commands ───────────────────────────────────────────────── */}
      <div className="seo-section seo-commands">
        <h2>Bot Commands Quick Reference</h2>
        <p>
          Below is a quick reference for the main{' '}
          <strong>Whiteout Survival Discord bot commands</strong>. Slash commands appear
          automatically after adding the bot to your server. Type{' '}
          <code>/</code> in any channel to see the full list.
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
                <td><code>/start</code></td>
                <td>Core</td>
                <td>Show the main bot menu — your starting point for all features</td>
              </tr>
              <tr>
                <td><code>/settings</code></td>
                <td>Admin</td>
                <td>Open the full admin settings menu for server configuration</td>
              </tr>
              <tr>
                <td><code>/manage</code></td>
                <td>Admin</td>
                <td>Quick access to management operations for your server</td>
              </tr>
              <tr>
                <td><code>/alliancemonitor</code></td>
                <td>Alliance Monitor</td>
                <td>Alliance monitoring dashboard — track furnace upgrades, name changes, and avatar changes</td>
              </tr>
              <tr>
                <td><code>/autotranslatecreate</code></td>
                <td>Translation</td>
                <td>Create automatic DeepL translation between two channels</td>
              </tr>
              <tr>
                <td><code>/autotranslatelist</code></td>
                <td>Translation</td>
                <td>View all active auto-translate configurations in your server</td>
              </tr>
              <tr>
                <td><code>/autotranslatedelete</code></td>
                <td>Translation</td>
                <td>Delete an auto-translate configuration</td>
              </tr>
              <tr>
                <td><code>/autotranslatetoggle</code></td>
                <td>Translation</td>
                <td>Enable or disable an auto-translate configuration</td>
              </tr>
              <tr>
                <td><code>/autotranslateedit</code></td>
                <td>Translation</td>
                <td>Edit an existing auto-translate configuration</td>
              </tr>
              <tr>
                <td><code>/welcome</code></td>
                <td>Admin</td>
                <td>Configure welcome message settings for new server members</td>
              </tr>
              <tr>
                <td><code>/event</code></td>
                <td>Game Tools</td>
                <td>Get information about current and upcoming Whiteout Survival events</td>
              </tr>
              <tr>
                <td><code>/server_age</code></td>
                <td>Game Tools</td>
                <td>Check your WOS server age and upcoming state milestones</td>
              </tr>
              <tr>
                <td><code>/ministerappointment</code></td>
                <td>Game Tools</td>
                <td>Manage minister appointments for your WOS alliance</td>
              </tr>
              <tr>
                <td><code>/websearch</code></td>
                <td>AI Tools</td>
                <td>Search the web and get an AI-synthesized answer with source links</td>
              </tr>
              <tr>
                <td><code>/tts</code></td>
                <td>Voice</td>
                <td>Speak text in a voice channel using AI text-to-speech</td>
              </tr>
              <tr>
                <td><code>/tts_voice</code></td>
                <td>Voice</td>
                <td>List or set the TTS voice for your server</td>
              </tr>
              <tr>
                <td><code>/tts_stop</code></td>
                <td>Voice</td>
                <td>Stop TTS playback and clear the voice queue</td>
              </tr>
              <tr>
                <td><code>/tictactoe</code></td>
                <td>Fun</td>
                <td>Play Tic-Tac-Toe against other server members</td>
              </tr>
              <tr>
                <td><code>!Add [FID, FID, ...]</code></td>
                <td>Alliance (Prefix)</td>
                <td>Add alliance members to the monitor by their WOS player ID (FID)</td>
              </tr>
              <tr>
                <td><code>!Remove [FID, FID, ...]</code></td>
                <td>Alliance (Prefix)</td>
                <td>Remove alliance members from the monitor by FID</td>
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
            <strong>Click &quot;Add to Discord&quot;</strong> on this page. You need &quot;Manage
            Server&quot; permissions on your Discord server to add the bot.
          </li>
          <li>
            <strong>Authorize the bot</strong> for your Discord server and confirm the permissions.
          </li>
          <li>
            <strong>Run <code>/start</code></strong> — This opens the main bot menu. From here you
            can access all bot features with a simple button interface.
          </li>
          <li>
            <strong>Run <code>/settings</code></strong> — Opens the full admin configuration panel
            to set up gift code auto-redeem, alliance monitoring, and all other server features.
          </li>
          <li>
            <strong>Configure auto-translation</strong> — Use <code>/autotranslatecreate</code> to
            set up DeepL translation between channels for your international alliance members.
          </li>
          <li>
            <strong>Set up alliance monitor</strong> — Use <code>/alliancemonitor</code> to open the
            monitoring dashboard, then use <code>!Add [FID]</code> in the designated channel to add
            members to track.
          </li>
          <li>
            <strong>Manage from the web dashboard</strong> — Visit{' '}
            <a href="https://bot.whiteoutsurvival.dev/" target="_blank" rel="noreferrer">
              bot.whiteoutsurvival.dev
            </a>{' '}
            to manage all settings from a browser, including reminders and auto-redeem
            configuration.
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
            DeepL auto-translation, event information, AI web search, text-to-speech, admin tools,
            and a web management dashboard — all designed specifically for the Whiteout Survival
            game community.
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
            all configured members in your Discord server without any manual action. Set up
            auto-redeem through the <code>/settings</code> menu or via the web dashboard at{' '}
            <a href="https://bot.whiteoutsurvival.dev/" target="_blank" rel="noreferrer">
              bot.whiteoutsurvival.dev
            </a>.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>How do I start using the bot after adding it?</h3>
          <p>
            After adding the bot, run <code>/start</code> in any channel to open the main bot menu.
            From there you can navigate all features. For initial server setup, run{' '}
            <code>/settings</code> to configure alliance monitoring, gift code redeem, and other
            features.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>What does the alliance activity monitor track?</h3>
          <p>
            The alliance monitor (accessible via <code>/alliancemonitor</code>) tracks: furnace
            level-ups (FC tracking), player name changes, avatar/profile picture changes, and
            alliance membership changes. Add members to monitor with the{' '}
            <code>!Add [FID]</code> prefix command. When events are detected, the bot posts
            notifications in your configured Discord channel.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>How do I set up automatic translation in my Discord server?</h3>
          <p>
            Use the <code>/autotranslatecreate</code> command to create a DeepL-powered translation
            link between two channels. You can manage existing setups with{' '}
            <code>/autotranslatelist</code>, <code>/autotranslatetoggle</code>, and{' '}
            <code>/autotranslateedit</code>.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>What is the WOS bot web dashboard?</h3>
          <p>
            The web dashboard at{' '}
            <a href="https://bot.whiteoutsurvival.dev/" target="_blank" rel="noreferrer">
              bot.whiteoutsurvival.dev
            </a>{' '}
            lets you manage all bot settings from a browser — no Discord commands needed. Configure
            auto-redeem, alliance monitors, event reminders, and server settings from a clean web
            interface.
          </p>
        </div>

        <div className="seo-faq-item">
          <h3>How do I add alliance members to the monitor?</h3>
          <p>
            First open the alliance monitor dashboard with <code>/alliancemonitor</code>, then use
            the <code>!Add [FID]</code> prefix command in your designated bot channel, where FID is
            the WOS player ID (Furnace ID). You can add multiple members at once by separating FIDs
            with commas: <code>!Add 12345678, 87654321</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
