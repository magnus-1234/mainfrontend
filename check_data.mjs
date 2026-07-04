import { MongoClient } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('reminderbot');
  const doc = await db.collection("music_states").findOne();
  console.log(JSON.stringify(doc, null, 2));
  await client.close();
}
run().catch(console.error);
