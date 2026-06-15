const https = require('https');
https.get('https://wostools.net/_next/static/chunks/47234-a510bbfe48975d95.js', (res) => {
  let jsData = '';
  res.on('data', chunk => jsData += chunk);
  res.on('end', () => {
    // Find arrays that might be stronghold/fortress.
    // Let's look for objects that have 'kind' or 'label'.
    const matches = jsData.match(/\{[^}]*Fortress[^}]*\}/g);
    if (matches) console.log('Fortress Match:\n', matches.join('\n'));
    
    const sMatches = jsData.match(/\{[^}]*Stronghold[^}]*\}/g);
    if (sMatches) console.log('Stronghold Match:\n', sMatches.join('\n'));

    // or maybe they are exported as constants:
    const vars = jsData.match(/[A-Z_]+=\[[^\]]+\]/g);
    if (vars) console.log(vars.map(v => v.substring(0, 100)).join('\n'));
  });
});
