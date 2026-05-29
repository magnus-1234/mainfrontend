"use client";

import { useState } from "react";

const menuItems = [
  { label: "Browse", icon: "grid" },
  { label: "Calculators", icon: "calculator" },
  { label: "Tools", icon: "wrench" },
  { label: "Database", icon: "database" },
  { label: "More", icon: "book" },
];

function Icon({ name }: { name: string }) {
  if (name === "grid") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    );
  }

  if (name === "calculator") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <line x1="8" x2="16" y1="6" y2="6" />
        <line x1="16" x2="16" y1="14" y2="18" />
        <path d="M16 10h.01" />
        <path d="M12 10h.01" />
        <path d="M8 10h.01" />
        <path d="M12 14h.01" />
        <path d="M8 14h.01" />
        <path d="M12 18h.01" />
        <path d="M8 18h.01" />
      </svg>
    );
  }

  if (name === "wrench") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1c.3-.3.9-.2 1 .2a6 6 0 0 1-8.3 7.1l-7.9 7.9a1 1 0 0 1-3-3l7.9-7.9a6 6 0 0 1 7.1-8.3c.4.1.5.7.2 1z" />
      </svg>
    );
  }

  if (name === "database") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
      </svg>
    );
  }

  if (name === "menu") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16" />
        <path d="M4 12h16" />
        <path d="M4 19h16" />
      </svg>
    );
  }

  if (name === "globe") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    );
  }

  if (name === "sun") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  if (name === "sliders") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line x1="4" x2="14" y1="6" y2="6" />
        <line x1="4" x2="10" y1="18" y2="18" />
        <line x1="14" x2="20" y1="18" y2="18" />
        <line x1="18" x2="20" y1="6" y2="6" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="chevron">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [hideTopNav, setHideTopNav] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState<"left" | "right">("left");
  const [contentWidth, setContentWidth] = useState<"centered" | "full">("centered");
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <main className={`app-shell ${theme === "dark" ? "dark" : "light"} ${collapsedSidebar ? "collapsed-sidebar" : ""} ${hideTopNav ? "hide-top-nav" : ""} sidebar-${sidebarPosition} width-${contentWidth}`}>
      <header className="ks-header">
        <div className="ks-header-inner">
          <button className="icon-button menu-button" type="button" aria-label="Toggle sidebar">
            <Icon name="menu" />
          </button>

          <a className="brand" href="#home" aria-label="WhiteoutSurvival.dev Home">
            <span className="brand-icon">W</span>
            <span>WhiteoutSurvival.dev</span>
          </a>

          <nav className="top-menu" aria-label="Top menu">
            {menuItems.map((item) => (
              <button type="button" className="menu-trigger" key={item.label}>
                <Icon name={item.icon} />
                {item.label}
                <Icon name="chevron" />
              </button>
            ))}
          </nav>

          <div className="actions">
            <button className="icon-button" type="button" aria-label="Change language" disabled>
              <Icon name="globe" />
            </button>
            <button className="icon-button" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle theme">
              <Icon name="sun" />
            </button>
            <button className="icon-button plain-action" type="button" onClick={() => setLayoutOpen(true)} aria-label="Layout settings">
              <Icon name="sliders" />
            </button>
            <a className="feedback-link" href="#feedback">Feedback</a>
            <button className="sign-in" type="button" onClick={() => setLoginOpen(true)}>
              <Icon name="user" />
              Sign In
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar" aria-label="Sidebar">
          <div className="sidebar-content">
            <a className="sidebar-item active" href="#home">Home</a>
          </div>
        </aside>

        <section className="empty-page" id="home" aria-label="Home page" />
      </div>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="footer-icon">W</span>
          <span>WhiteoutSurvival.dev Tools &amp; Guides</span>
        </div>
        <p>Built for WOS community - By MAGNUS</p>
        <p>Made with <span className="heart">♥</span> by MAGNUS</p>
      </footer>

      {layoutOpen && (
        <div className="settings-panel" role="dialog" aria-modal="false" aria-label="Layout Settings">
          <div className="settings-head">
            <div>
              <h2>Layout Settings</h2>
              <p>Customize your experience</p>
            </div>
            <button type="button" onClick={() => setLayoutOpen(false)} aria-label="Close layout settings">x</button>
          </div>

          <section className="settings-section">
            <h3>Theme</h3>
            <div className="theme-grid">
              {(["light", "dark", "system"] as const).map((item) => (
                <button
                  className={theme === item ? "selected" : ""}
                  key={item}
                  type="button"
                  onClick={() => setTheme(item)}
                >
                  <Icon name={item === "dark" ? "sun" : item === "system" ? "database" : "sun"} />
                  <span>{item[0].toUpperCase() + item.slice(1)}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>Sidebar</h3>
            <div className="setting-row">
              <div>
                <strong>Collapse Sidebar</strong>
                <span>Icon-only sidebar mode</span>
              </div>
              <button
                className={`switch ${collapsedSidebar ? "on" : ""}`}
                type="button"
                aria-pressed={collapsedSidebar}
                onClick={() => setCollapsedSidebar(!collapsedSidebar)}
              >
                <span />
              </button>
            </div>
            <div className="setting-row">
              <div>
                <strong>Hide Top Nav</strong>
                <span>More space, use sidebar only</span>
              </div>
              <button
                className={`switch ${hideTopNav ? "on" : ""}`}
                type="button"
                aria-pressed={hideTopNav}
                onClick={() => setHideTopNav(!hideTopNav)}
              >
                <span />
              </button>
            </div>
            <p className="settings-label">Position</p>
            <div className="segmented">
              <button className={sidebarPosition === "left" ? "selected" : ""} type="button" onClick={() => setSidebarPosition("left")}>Left</button>
              <button className={sidebarPosition === "right" ? "selected" : ""} type="button" onClick={() => setSidebarPosition("right")}>Right</button>
            </div>
          </section>

          <section className="settings-section">
            <h3>Content Width</h3>
            <div className="width-options">
              <button className={contentWidth === "centered" ? "selected" : ""} type="button" onClick={() => setContentWidth("centered")}>
                <strong>Centered</strong>
                <span>Content stays in a readable column</span>
              </button>
              <button className={contentWidth === "full" ? "selected" : ""} type="button" onClick={() => setContentWidth("full")}>
                <strong>Full Width</strong>
                <span>Stretches edge to edge, uses all screen space</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {loginOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Sign In">
          <form className="login-modal" onSubmit={(event) => {
            event.preventDefault();
            setLoginOpen(false);
          }}>
            <button className="close-button" type="button" onClick={() => setLoginOpen(false)} aria-label="Close">
              x
            </button>
            <h2>Sign In</h2>
            <label>
              Email
              <input type="email" required />
            </label>
            <label>
              Password
              <input type="password" required />
            </label>
            <button className="submit-button" type="submit">Sign In</button>
          </form>
        </div>
      )}
    </main>
  );
}
