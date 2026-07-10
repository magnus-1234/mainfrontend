const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://yourbook444362_db_user:3KAXZB6hkJ1DAWPT@wosbot.yal4g3b.mongodb.net/?appName=WOSBOT";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("reminderbot");
    const coll = db.collection("music_history");

    const count = await coll.countDocuments();
    console.log("Total docs in WOSBOT music_history:", count);

    const docs = await coll.find().sort({ _id: -1 }).limit(1).toArray();
    console.log("Recent docs in WOSBOT:", docs);
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run();
