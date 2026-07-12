import YTMusic from 'ytmusic-api';
async function run() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const pl = await ytmusic.getPlaylist('PL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb');
  console.log('Keys:', Object.keys(pl));
  console.log('Videos or items:', pl.content?.length, pl.items?.length, pl.tracks?.length);
}
run();
