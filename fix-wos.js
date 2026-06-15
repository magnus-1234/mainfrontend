const fs = require('fs');

let content = fs.readFileSync('src/app/game-map/WosGameMap.tsx', 'utf8');

// 1. Move the toolbar to the top
const toolbarRegex = /<div className="wos-bottom-toolbar">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;
const toolbarMatch = content.match(toolbarRegex);
if (toolbarMatch) {
  let toolbarStr = toolbarMatch[0];
  // extract just the toolbar div
  const actualToolbar = toolbarStr.match(/<div className="wos-bottom-toolbar">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/section>/);
  if (actualToolbar) {
    const rawToolbar = actualToolbar[0].replace('</div>\n      </div>\n    </section>', '').trim() + '\n';
    
    // remove from bottom
    content = content.replace(rawToolbar, '');
    
    // insert at top inside wos-map-workspace
    content = content.replace('<div className="wos-map-workspace">', '<div className="wos-map-workspace">\n        ' + rawToolbar);
  }
}

// 2. Change renderPlannerItem
content = content.replace(
  /{item.kind === "hq" || item.kind === "banner" \? \([\s\S]*?\) : \([\s\S]*?<text[\s\S]*?<\/text>\s*<\/>\s*\)}/m,
  `<image
        href={\`/vendor/krozac-wos-interactive-map/alliance_\${item.kind}.png\`}
        x={x}
        y={y - size * 0.15}
        width={size}
        height={size * 1.3}
        preserveAspectRatio="xMidYMid meet"
        filter="url(#wos-building-shadow)"
      />`
);

// 3. Change hover logic
content = content.replace(
  /{selectedTool === "place" && hover && \(selectedObject === "hq" || selectedObject === "banner"\) && \([\s\S]*?opacity="0\.5"\s*\/>\s*\)}/m,
  `{selectedTool === "place" && hover && (
                <image
                  href={\`/vendor/krozac-wos-interactive-map/alliance_\${selectedObject}.png\`}
                  x={gridCellFor(hover).x}
                  y={gridCellFor(hover).y - (selectedObject === "hq" ? 4 : selectedObject === "beartrap" ? 3 : selectedObject === "city" ? 2 : 1) * 0.15}
                  width={selectedObject === "hq" ? 4 : selectedObject === "beartrap" ? 3 : selectedObject === "city" ? 2 : 1}
                  height={(selectedObject === "hq" ? 4 : selectedObject === "beartrap" ? 3 : selectedObject === "city" ? 2 : 1) * 1.3}
                  preserveAspectRatio="xMidYMid meet"
                  opacity="0.5"
                />
              )}`
);

fs.writeFileSync('src/app/game-map/WosGameMap.tsx', content);
console.log('Fixed WosGameMap.tsx');
