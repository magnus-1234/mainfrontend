const fs = require('fs');

const css = fs.readFileSync('src/app/game-map/wos-game-map.css', 'utf8');

let newCss = css.replace(/.wos-map-workspace {\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) 288px;\s*gap: 14px;\s*min-height: 0;\s*}/, `.wos-map-workspace {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}`);

const bottomToolbarCss = `
/* Bottom Toolbar Styles */
.wos-bottom-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  margin-top: 4px;
}

.wos-toolbar-segment {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--background);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid var(--control-border, var(--border));
}

.wos-toolbar-segment-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 4px;
  margin-left: 4px;
}

.wos-toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  min-height: 52px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--foreground);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  gap: 4px;
}

.wos-toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.wos-toolbar-btn.active {
  background: #0ea5e9;
  color: #fff;
  border-color: #38bdf8;
  box-shadow: 0 2px 10px rgba(14, 165, 233, 0.3);
}

.wos-toolbar-btn.danger {
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.wos-toolbar-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.wos-toolbar-btn img, .wos-toolbar-btn svg {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
`;

fs.writeFileSync('src/app/game-map/wos-game-map.css', newCss + bottomToolbarCss);
console.log("CSS fixed");
