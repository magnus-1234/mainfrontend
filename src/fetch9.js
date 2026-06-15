const https = require('https');
https.get('https://wostools.net/_next/static/chunks/47234-a510bbfe48975d95.js', (res) => {
  let jsData = '';
  res.on('data', chunk => jsData += chunk);
  res.on('end', () => {
    let idx = jsData.indexOf('{col:394,row:597,label:"Stronghold 1"');
    if (idx !== -1) {
       // print 1000 chars before and 2000 chars after
       console.log(jsData.substring(idx - 1000, idx + 2000));
    }
  });
});
