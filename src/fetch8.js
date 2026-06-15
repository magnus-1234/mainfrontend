const https = require('https');
https.get('https://wostools.net/_next/static/chunks/47234-a510bbfe48975d95.js', (res) => {
  let jsData = '';
  res.on('data', chunk => jsData += chunk);
  res.on('end', () => {
    // Find arrays that might be facility. Let's look for "Lv. " or "Lv."
    let matches = jsData.match(/\{[^}]*Lv\.\s*\d[^}]*\}/g);
    if (matches) {
       console.log('Found Lv:', matches.length);
       console.log(matches.slice(0, 10).join('\n'));
    }
  });
});
