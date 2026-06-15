const https = require('https');
https.get('https://wostools.net/_next/static/chunks/47234-a510bbfe48975d95.js', (res) => {
  let jsData = '';
  res.on('data', chunk => jsData += chunk);
  res.on('end', () => {
    let match = jsData.match(/h=(\[\{facilityType:"weapon".+?\]\}\]\}\])/);
    if (match) {
        // Evaluate it as an array to dump clean JSON
        try {
           const evalFn = new Function('return ' + match[1]);
           const arr = evalFn();
           console.log(JSON.stringify(arr, null, 2));
        } catch(e) {
           console.log("Failed to eval:", e.message);
        }
    } else {
        console.log("h array not found with that pattern.");
        // Try another pattern
        let m = jsData.match(/h=\[\{facilityType:.*?(?=,m=\{minCol:)/);
        if (m) {
           try {
             const evalFn = new Function('return ' + m[0].substring(2));
             const arr = evalFn();
             console.log(JSON.stringify(arr, null, 2));
           } catch(e) { console.log(e.message); }
        } else {
           console.log("Still didn't match.");
        }
    }
  });
});
