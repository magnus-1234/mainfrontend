const YTM_KEY = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-FUHU13d8';
async function inspectPlaylistAPI(playlistId) {
  const CONTEXT = {
    client: {
      clientName: 'WEB',
      clientVersion: '2.20240101.00.00',
      hl: 'en',
      gl: 'US'
    }
  };
  const res = await fetch('https://www.youtube.com/youtubei/v1/browse?key=' + YTM_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: CONTEXT, browseId: 'VL' + playlistId })
  });
  const data = await res.json();
  const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const tab0 = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer;
  if (tab0) {
    console.log('Got playlistVideoListRenderer. Num videos:', tab0.contents.length);
    console.log('Video 1:', tab0.contents[0].playlistVideoRenderer?.videoId);
  } else {
    console.log('No playlistVideoListRenderer found. Data keys:', Object.keys(data));
  }
}
inspectPlaylistAPI('PL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb');
