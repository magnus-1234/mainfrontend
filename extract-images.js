const https = require('https');

https.get('https://wostools.net/territory-planner', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /https:\/\/[^"']*\.(?:png|webp)/gi;
    const matches = data.match(regex);
    if (matches) {
      console.log(Array.from(new Set(matches)).join('\n'));
    } else {
      console.log("No matches found.");
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
