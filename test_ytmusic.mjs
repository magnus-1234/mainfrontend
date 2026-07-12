import YTMusic from 'ytmusic-api';
async function test() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const pl = await ytmusic.getPlaylist('PL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb');
  console.log(pl.name, pl.thumbnails);
}
test();
