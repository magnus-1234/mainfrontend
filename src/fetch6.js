const https = require('https');
https.get('https://wostools.net/_next/static/chunks/47234-a510bbfe48975d95.js', (res) => {
  let jsData = '';
  res.on('data', chunk => jsData += chunk);
  res.on('end', () => {
    // Find arrays that might be stronghold/fortress.
    let idx = jsData.indexOf('{col:394,row:597,label:"Stronghold 1"');
    if (idx !== -1) {
       console.log('Found Stronghold array at', idx);
       console.log(jsData.substring(idx - 100, idx + 300));
    }
  });
});
