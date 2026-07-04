import { MongoClient, Long } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';

const stringValue = (value) => {
  if (value == null) {
    return "";
  }
  if (Long.isLong(value)) {
    return value.toString();
  }
  if (typeof value === 'object' && ('high' in value || '_bsontype' in value)) {
    return value.toString();
  }
  return String(value);
};

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const docs = await client.db('reminderbot').collection('playlists').find({}).limit(1).toArray();
  const doc = docs[0];
  console.log("stringValue output:", stringValue(doc.user_id));
  console.log("Long.isLong output:", Long.isLong(doc.user_id));
  console.log("Constructor match:", doc.user_id.constructor === Long);
  await client.close();
}
run().catch(console.error);
