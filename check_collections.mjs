import { MongoClient } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('reminderbot');
  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  await client.close();
}
run().catch(console.error);
