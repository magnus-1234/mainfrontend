const https = require('https');
https.get('https://wostools.net/territory-planner', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
    if (match) {
      try {
        const json = JSON.parse(match[1]);
        const str = JSON.stringify(json);
        const strongholdIdx = str.indexOf('Stronghold');
        console.log('Found __NEXT_DATA__. Stronghold index:', strongholdIdx);
        if (strongholdIdx !== -1) {
          console.log(str.substring(Math.max(0, strongholdIdx - 100), strongholdIdx + 1500));
        }
      } catch (e) { console.error('Parse error:', e); }
    } else {
      console.log('__NEXT_DATA__ not found. Looking for .js links...');
      const jsLinks = data.match(/src="([^"]+\.js[^"]*)"/g);
      console.log(jsLinks);
    }
  });
}).on('error', (err) => { console.log('Error: ' + err.message); });
