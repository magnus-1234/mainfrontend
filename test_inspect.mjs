async function inspectPlaylist(playlistId) {
  const res = await fetch('https://www.youtube.com/playlist?list=' + playlistId, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const dataMatch = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (!dataMatch) return;
  const data = JSON.parse(dataMatch[1]);
  require('fs').writeFileSync('playlist_data.json', JSON.stringify(data, null, 2));
}
inspectPlaylist('PL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb');
