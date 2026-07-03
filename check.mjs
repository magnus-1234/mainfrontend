import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const docs = await client.db('discord_bot').collection('playlists').find({}).limit(2).toArray();
  console.log(JSON.stringify(docs, null, 2));
  await client.close();
}
run().catch(console.error);
