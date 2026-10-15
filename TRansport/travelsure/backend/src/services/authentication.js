import {randomUUID, scryptSync, timingSafeEqual, randomBytes} from 'node:crypto';
import {db} from '../config/db.js';
export function authenticate(action,input){
    let { email, password, name } = input;
    email = String(email || "")
      .trim()
      .toLowerCase();
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8
    )
      throw Error("Use a valid email and a password of at least 8 characters.");
    let user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    if (action === "register") {
      if (user) throw Error("An account already exists with this email.");
      const salt = randomBytes(16).toString("hex");
      user = {
        id: randomUUID(),
        email,
        data: JSON.stringify({
          name: String(name || "Traveller").slice(0, 80),
          salt,
          hash: scryptSync(password, salt, 64).toString("hex"),
        }),
      };
      db.prepare("INSERT INTO users VALUES(?,?,?)").run(
        user.id,
        email,
        user.data,
      );
    } else if (action !== "login")
      throw Error("Unknown authentication action");
    if (!user) throw Error("Email or password is incorrect.");
    const data = JSON.parse(user.data);
    if (
      !timingSafeEqual(
        Buffer.from(data.hash, "hex"),
        scryptSync(password, data.salt, 64),
      )
    )
      throw Error("Email or password is incorrect.");
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO sessions VALUES(?,?)").run(token, user.id);
    return { token, user: { name: data.name, email } };

}
