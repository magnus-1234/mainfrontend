import { MongoClient } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const docs = await client.db('reminderbot').collection('playlists').find({}).limit(1).toArray();
  console.log(JSON.stringify(docs, null, 2));
  console.log("Types:", typeof docs[0].user_id, docs[0].user_id.constructor.name);
  await client.close();
}
run().catch(console.error);
