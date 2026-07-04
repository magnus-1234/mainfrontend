import { MongoClient, Long } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';

const idCandidates = (value) => {
  const trimmed = value.trim();
  const values = [trimmed];
  if (/^\d+$/.test(trimmed)) {
    values.push(Long.fromString(trimmed));
  }
  return values;
};

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db('reminderbot').collection('playlists');
  
  const userId = "850786361572720661";
  const query = { user_id: { $in: idCandidates(userId) } };
  
  console.log("Query:", JSON.stringify(query));
  
  const docs = await col.find(query).toArray();
  console.log("Found:", docs.length, "playlists");
  
  await client.close();
}
run().catch(console.error);
