import { DatabaseSync } from "node:sqlite";
export const db = new DatabaseSync(
  process.env.DB_PATH || "./travelsure.sqlite",
);
db.exec(
  `PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,data TEXT); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT); CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,userId TEXT,data TEXT); CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,bookingId TEXT UNIQUE,data TEXT); CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY);`,
);
export const getBooking = (id) => {
  const r = db.prepare("SELECT data FROM bookings WHERE id=?").get(id);
  return r ? JSON.parse(r.data) : null;
};
export function saveBooking(b) {
  db.prepare("INSERT OR REPLACE INTO bookings VALUES(?,?,?)").run(
    b.id,
    b.userId,
    JSON.stringify(b),
  );
  return b;
}
