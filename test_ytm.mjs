import YTMusic from 'ytmusic-api';

async function test() {
  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const home = await ytmusic.getHomeSections();
  console.log(JSON.stringify(home, null, 2));
}

test();
