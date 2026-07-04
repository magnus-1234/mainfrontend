import { MongoClient } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('reminderbot');
  const docs = await db.collection('music_states').find({}).toArray();
  console.log("music_states count:", docs.length);
  for (const doc of docs) {
    console.log(JSON.stringify({
      guild_id: doc.guild_id,
      current_track: doc.current_track,
      queue: doc.queue?.length,
      updated_at: doc.updated_at,
      history: doc.history,
    }, null, 2));
  }
  await client.close();
}
run().catch(console.error);
