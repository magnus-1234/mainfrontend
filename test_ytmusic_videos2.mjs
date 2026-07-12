import YTMusic from 'ytmusic-api';
async function run() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const videos = await ytmusic.getPlaylistVideos('PL0mNgUNUY-2twldwUMEbDUPFeFG1jn8Lb');
  console.log('Videos array length:', videos?.length);
  if(videos?.length) {
     console.log('First video keys:', Object.keys(videos[0]));
     console.log('First video:', videos[0]);
  }
}
run();
