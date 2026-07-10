const { MongoClient, Long } = require('mongodb');
async function run() {
  const client = new MongoClient('mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER');
  await client.connect();
  const db = client.db('reminderbot');
  const guildId = '1147956569271697518';
  const query = { $or: [{ guild_id: guildId }, { guild_id: Long.fromString(guildId) }] };
  const docs = await db.collection('music_history').find(query).toArray();
  console.log('Matched:', docs.length);
  await client.close();
}
run().catch(console.error);
