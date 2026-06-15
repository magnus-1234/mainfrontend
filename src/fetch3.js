const https = require('https');
https.get('https://wostools.net/_next/static/chunks/app/territory-planner/page-b4d96e5860037f53.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Just find "Fortress" and print context.
    let idx = data.indexOf('Fortress');
    while (idx !== -1) {
      console.log(data.substring(Math.max(0, idx - 100), idx + 200));
      idx = data.indexOf('Fortress', idx + 1);
    }
  });
}).on('error', (err) => { console.log('Error: ' + err.message); });
