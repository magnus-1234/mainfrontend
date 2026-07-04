import { MongoClient, Long } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';

const stringValue = (value) => {
  if (value == null) {
    return "";
  }
  if (Long.isLong(value)) {
    return value.toString();
  }
  return String(value);
};

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const docs = await client.db('reminderbot').collection('playlists').find({}).limit(1).toArray();
  const doc = docs[0];
  console.log("user_id stringValue:", stringValue(doc.user_id));
  console.log("user_id direct toString:", doc.user_id.toString());
  console.log("IsLong:", Long.isLong(doc.user_id));
  console.log("Typeof:", typeof doc.user_id);
  console.log("Constructor:", doc.user_id.constructor.toString());
  await client.close();
}
run().catch(console.error);
