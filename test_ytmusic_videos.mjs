import YTMusic from 'ytmusic-api';
async function run() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const pl = await ytmusic.getPlaylist('PL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb');
  console.log('Got', pl.videos?.length || pl.songs?.length, 'videos');
  console.log('First video:', pl.videos?.[0]);
}
run();
