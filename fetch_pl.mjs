const YTM_KEY = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-FUHU13d8';
async function run() {
  const CONTEXT = {
    client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'US' }
  };
  const res = await fetch('https://www.youtube.com/youtubei/v1/browse?key=' + YTM_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: CONTEXT, browseId: 'VLPL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb' })
  });
  const data = await res.json();
  const require = global.require || (await import('module')).createRequire(import.meta.url);
  require('fs').writeFileSync('playlist_api.json', JSON.stringify(data, null, 2));
}
run();
