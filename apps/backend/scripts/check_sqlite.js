import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../../dev.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening DB:", err);
    process.exit(1);
  }
});

db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Tables in SQLite:", tables.map(t => t.name).join(", "));
  
  db.all("PRAGMA table_info(ArtistProfiles);", (err, cols) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log("Columns of ArtistProfiles:");
    console.log(JSON.stringify(cols, null, 2));
    
    db.close();
  });
});
