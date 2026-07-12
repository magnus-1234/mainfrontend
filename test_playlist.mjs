async function resolvePlaylistViaScraping(playlistId) {
  try {
    const res = await fetch('https://www.youtube.com/playlist?list=' + playlistId, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    const dataMatch = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
    if (!dataMatch) return null;
    const data = JSON.parse(dataMatch[1]);
    
    const title = data.metadata?.playlistMetadataRenderer?.title || 'Unknown Playlist';
    
    const tracks = [];
    const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];
    
    for (const item of contents) {
      const vid = item.playlistVideoRenderer;
      if (!vid || !vid.videoId) continue;
      
      tracks.push({
        videoId: vid.videoId,
        title: vid.title?.runs?.[0]?.text,
      });
    }
    
    return { title, tracks: tracks.slice(0,2) };
  } catch (e) {
    console.error(e);
    return null;
  }
}
resolvePlaylistViaScraping('PL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb').then(console.log);
