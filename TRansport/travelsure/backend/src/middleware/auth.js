import { db } from "../config/db.js";
export function auth(req, res, next) {
  const token = req.get("Authorization")?.replace("Bearer ", "");
  const session =
    token && db.prepare("SELECT userId FROM sessions WHERE token=?").get(token);
  if (!session)
    return res.status(401).json({ error: "Please sign in to continue." });
  req.userId = session.userId;
  next();
}
