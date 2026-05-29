"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

const menuItems = [
  { label: "Browse", icon: "grid" },
  { label: "Calculators", icon: "calculator" },
  { label: "Tools", icon: "wrench" },
  { label: "Database", icon: "database" },
  { label: "More", icon: "book" },
];

const sidebarItems = [
  { label: "Home", icon: "home", href: "#home" },
  { label: "Professional", icon: "briefcase", href: "#professional" },
];

function Icon({ name }: { name: string }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "briefcase") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect width="20" height="14" x="2" y="7" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <path d="M2 13h20" />
        <path d="M12 12v2" />
      </svg>
    );
  }

  if (name === "panel") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect width="18" height="16" x="3" y="4" rx="2" />
        <path d="M9 4v16" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }

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
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const [contentWidth, setContentWidth] = useState<"centered" | "full">("centered");
  const [loginOpen, setLoginOpen] = useState(false);
  const effectiveSidebarWidth = collapsedSidebar ? 48 : sidebarWidth;

  useEffect(() => {
    if (!resizingSidebar || collapsedSidebar) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const nextWidth =
        sidebarPosition === "right"
          ? window.innerWidth - event.clientX
          : event.clientX;

      setSidebarWidth(Math.min(380, Math.max(176, nextWidth)));
    };

    const stopResizing = () => setResizingSidebar(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing, { once: true });
    document.body.classList.add("is-resizing-sidebar");

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      document.body.classList.remove("is-resizing-sidebar");
    };
  }, [collapsedSidebar, resizingSidebar, sidebarPosition]);

  const shellStyle = {
    "--sidebar-width": `${effectiveSidebarWidth}px`,
  } as CSSProperties;

  return (
    <main
      className={`app-shell ${theme === "dark" ? "dark" : "light"} ${collapsedSidebar ? "collapsed-sidebar" : ""} ${hideTopNav ? "hide-top-nav" : ""} sidebar-${sidebarPosition} width-${contentWidth} ${resizingSidebar ? "resizing-sidebar" : ""}`}
      style={shellStyle}
    >
      <header className="ks-header">
        <div className="ks-header-inner">
          <a className="brand" href="#home" aria-label="WhiteoutSurvival.dev Home">
            <span className="brand-icon">
              <Image src="/wos-logo.png" alt="" width={24} height={24} />
            </span>
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
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark theme"
              aria-pressed={theme === "dark"}
            >
              <span className="theme-track">
                <span className="theme-cloud cloud-a" />
                <span className="theme-cloud cloud-b" />
                <span className="theme-star star-a" />
                <span className="theme-star star-b" />
                <span className="theme-star star-c" />
                <span className="theme-sun" />
                <span className="theme-moon" />
                <span className="theme-thumb" />
              </span>
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
            {sidebarItems.map((item) => (
              <a className={`sidebar-item ${item.label === "Home" ? "active" : ""}`} href={item.href} key={item.label}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
          <div className="sidebar-tools" aria-label="Sidebar controls">
            <button
              className="sidebar-tool-button"
              type="button"
              aria-label={collapsedSidebar ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsedSidebar}
              onMouseDown={(event) => {
                event.preventDefault();
                setCollapsedSidebar((value) => !value);
              }}
            >
              <Icon name="panel" />
            </button>
            <button
              className="sidebar-tool-button"
              type="button"
              aria-label="Layout settings"
              aria-expanded={layoutOpen}
              onClick={() => setLayoutOpen((value) => !value)}
            >
              <Icon name="sliders" />
            </button>
          </div>
          <button
            className="sidebar-resizer"
            type="button"
            aria-label="Resize sidebar"
            disabled={collapsedSidebar}
            onPointerDown={(event) => {
              event.preventDefault();
              setResizingSidebar(true);
            }}
          />
        </aside>

        <div className="content-column">
          <section className="home-page" id="home" aria-label="Home page" />
          <footer className="site-footer">
        <p className="footer-credit">
          <span>Built for WOS community - By</span>
          <Image src="/magnus-logo-cropped.png" alt="Magnus" width={104} height={31} />
        </p>
          </footer>
        </div>
      </div>

      {layoutOpen && (
        <div className="settings-panel" role="dialog" aria-modal="false" aria-label="Layout Settings">
          <div className="settings-head">
            <div>
              <h2>Layout Settings</h2>
              <p>View controls</p>
            </div>
            <button className="settings-close" type="button" onClick={() => setLayoutOpen(false)} aria-label="Close layout settings">
              <Icon name="x" />
            </button>
          </div>

          <section className="settings-section">
            <h3>Theme</h3>
            <div className="theme-grid compact">
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
                onClick={() => setCollapsedSidebar((value) => !value)}
              >
                <span />
              </button>
            </div>
            <label className="range-setting">
              <span>Sidebar width</span>
              <input
                type="range"
                min="176"
                max="380"
                value={sidebarWidth}
                disabled={collapsedSidebar}
                onChange={(event) => setSidebarWidth(Number(event.target.value))}
              />
              <output>{sidebarWidth}px</output>
            </label>
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

          <section className="settings-section settings-section-last">
            <h3>Content</h3>
            <div className="width-options">
              <button className={contentWidth === "centered" ? "selected" : ""} type="button" onClick={() => setContentWidth("centered")}>
                <strong>Centered</strong>
                <span>Readable max width</span>
              </button>
              <button className={contentWidth === "full" ? "selected" : ""} type="button" onClick={() => setContentWidth("full")}>
                <strong>Full Width</strong>
                <span>Use all space</span>
              </button>
            </div>
            <button
              className="reset-layout"
              type="button"
              onClick={() => {
                setCollapsedSidebar(false);
                setHideTopNav(false);
                setSidebarPosition("left");
                setSidebarWidth(256);
                setContentWidth("centered");
              }}
            >
              Reset Layout
            </button>
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
