const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetchUrl('https://wostools.net/territory-planner');
  const jsMatches = html.match(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g);
  if (!jsMatches) return console.log('no js files found');
  
  for (const match of jsMatches) {
    const jsUrl = 'https://wostools.net' + match.match(/"([^"]+)"/)[1];
    const jsContent = await fetchUrl(jsUrl);
    const pngMatches = jsContent.match(/\/?[^"'\s]+\.png/g);
    if (pngMatches) {
      console.log('Found in ' + jsUrl + ':');
      console.log([...new Set(pngMatches)].join('\n'));
    }
  }
}
run();
