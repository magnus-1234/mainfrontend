const https = require('https');
https.get('https://wostools.net/_next/static/chunks/47234-a510bbfe48975d95.js', (res) => {
  let jsData = '';
  res.on('data', chunk => jsData += chunk);
  res.on('end', () => {
    // Look for "Facility" inside objects
    let matches = jsData.match(/\{[^}]*Facility[^}]*\}/g);
    if (matches) {
       // Just show the first 10
       console.log('Found Facilities:', matches.length);
       console.log(matches.slice(0, 10).join('\n'));
    }
  });
});
