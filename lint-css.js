const fs = require('fs');
const postcss = require('postcss');

const css = fs.readFileSync('src/app/game-map/wos-game-map.css', 'utf8');

postcss([]).process(css, { from: 'src/app/game-map/wos-game-map.css' }).then(result => {
  console.log("CSS is valid!");
}).catch(err => {
  console.error("Syntax Error at line " + err.line + ", col " + err.column);
  console.error(err.reason);
  const lines = css.split('\n');
  console.error(lines[err.line - 2]);
  console.error(lines[err.line - 1]);
  console.error(lines[err.line]);
});
