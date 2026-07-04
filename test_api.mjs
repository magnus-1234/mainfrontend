import { MongoClient, Long } from 'mongodb';
const uri = 'mongodb+srv://iammagnusx1_db_user:zYFHUOjjXhfGLpMs@reminder.hlx5aem.mongodb.net/?appName=REMINDER';

const stringValue = (value) => {
  if (value == null) return "";
  if (Long.isLong(value)) return value.toString();
  return String(value);
};

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('reminderbot');
  const guildId = "1147956569271697518";

  let query = {
    $or: [
      { guild_id: guildId },
      { guild_id: Long.fromString(guildId) },
    ]
  };

  const states = await db.collection("music_states").find(query).sort({ updated_at: -1 }).limit(5).toArray();

  const statesHistory = states
    .filter((s) => s.current_track && s.current_track.title)
    .map((s) => ({
      guildId: stringValue(s.guild_id),
      track: {
        title: s.current_track.title || "",
        author: s.current_track.author || "",
        uri: s.current_track.uri || "",
        thumbnail: s.current_track.artwork || s.current_track.thumbnail || null,
      },
      playlistName: s.playlist_name || null,
      playedAt: s.updated_at || s.created_at || null,
    }));

  const playlists = await db.collection("playlists").find(query).limit(5).toArray();
  let additionalHistory = [];
  
  let timeOffset = 1000 * 60 * 60 * 2;
  for (const pl of playlists) {
    if (pl.tracks && Array.isArray(pl.tracks)) {
      for (const t of pl.tracks.slice(0, 3)) {
        additionalHistory.push({
          guildId: stringValue(pl.guild_id),
          track: {
            title: t.title || "",
            author: t.author || "",
            uri: t.uri || "",
            thumbnail: t.artwork || t.thumbnail || null,
          },
          playlistName: null,
          playedAt: new Date(Date.now() - timeOffset).toISOString(),
        });
        timeOffset += 1000 * 60 * 60 * 24;
      }
    }
  }

  const history = [...statesHistory, ...additionalHistory].slice(0, 20);
  console.log(JSON.stringify(history, null, 2));

  await client.close();
}
run().catch(console.error);
