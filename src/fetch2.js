const https = require('https');
https.get('https://wostools.net/_next/static/chunks/app/territory-planner/page-b4d96e5860037f53.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Look for Strongholds and Fortresses coordinates in the JS file.
    // The pattern might look like: label:"Stronghold No. 1",...,col:252,row:252
    const matches = data.match(/label:"[^"]*(?:Stronghold|Fortress)[^"]*"[^}]+?col:\d+,row:\d+/g);
    if (matches) {
      console.log('Matches:', matches.length);
      console.log(matches.join('\n'));
    } else {
      console.log('No direct regex match for Stronghold/Fortress + col/row.');
      const dataArr = data.match(/SUNFIRE_LANDMARKS=[^\]]+\]/);
      if (dataArr) console.log(dataArr[0]);
    }
  });
}).on('error', (err) => { console.log('Error: ' + err.message); });
