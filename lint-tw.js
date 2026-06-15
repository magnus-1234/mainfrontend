const fs = require('fs');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');

const css = fs.readFileSync('src/app/game-map/wos-game-map.css', 'utf8');

postcss([tailwindcss()]).process(css, { from: 'src/app/game-map/wos-game-map.css' }).then(result => {
  console.log("CSS is valid for Tailwind!");
}).catch(err => {
  console.error("Syntax Error at line " + err.line + ", col " + err.column);
  console.error(err.reason);
});
