const https = require('https');

https.get('https://wostools.net/territory-planner', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const jsLinks = html.match(/(?:src|href)="([^"]+\.js[^"]*)"/g) || [];
    jsLinks.forEach(link => {
      let url = link.split('"')[1];
      if (url.startsWith('/')) url = 'https://wostools.net' + url;
      if (!url.startsWith('http')) return;
      
      https.get(url, (jRes) => {
        let jsData = '';
        jRes.on('data', chunk => jsData += chunk);
        jRes.on('end', () => {
          if (jsData.includes('Stronghold') || jsData.includes('Fortress')) {
             console.log('FOUND IN:', url);
             let idx = jsData.indexOf('Stronghold');
             if (idx !== -1) console.log('Stronghold ->', jsData.substring(Math.max(0, idx - 100), idx + 200));
             idx = jsData.indexOf('Fortress');
             if (idx !== -1) console.log('Fortress ->', jsData.substring(Math.max(0, idx - 100), idx + 200));
          }
        });
      }).on('error', () => {});
    });
  });
});
