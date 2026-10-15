import express from "express";
import cors from "cors";
import {timingSafeEqual,createHmac} from "node:crypto";
import { db, getBooking, saveBooking } from "./config/db.js";
import { auth } from "./middleware/auth.js";
import { bookingLock } from "./middleware/booking-lock.js";
import { search, cities } from "./services/transport.js";
import {authenticate} from "./services/authentication.js";
import {createDraft} from "./services/booking.js";
import {selectProtection} from "./services/consent.js";
import {bookingPdf} from "./services/confirmation.js";
import { pay, issuePolicy } from "./services/payment.js";
export const app = express();
app.use(cors({ origin: ["http://127.0.0.1:5174", "http://localhost:5174"] }));
app.use(
  express.json({
    limit: "100kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
app.get("/api/health", (req, res) => res.json({ ok: true, mode: "demo" }));
app.get("/api/cities", (req, res) => res.json(cities));
app.get(
  "/api/search",
  wrap(async (req, res) => res.json(search(req.query))),
);
app.post(
  "/api/payments/webhook",
  wrap(async (req, res) => {
    const expected = createHmac(
      "sha256",
      process.env.PAYMENT_WEBHOOK_SECRET || "demo-webhook-secret",
    )
      .update(req.rawBody)
      .digest("hex");
    const signature = req.get("X-Payment-Signature") || "";
    if (
      !/^[a-f0-9]{64}$/.test(signature) ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return res.status(401).json({ error: "Invalid webhook signature" });
    const { eventId, paymentId } = req.body;
    if (typeof eventId !== "string" || !eventId)
      throw Error("Event ID required");
    const payment = db
      .prepare("SELECT * FROM payments WHERE id=?")
      .get(paymentId);
    if (!payment || JSON.parse(payment.data).status !== "verified")
      throw Error("Verified payment not found");
    if (db.prepare("SELECT id FROM events WHERE id=?").get(eventId))
      return res.json({ duplicate: true });
    await issuePolicy(getBooking(payment.bookingId));
    db.prepare("INSERT OR IGNORE INTO events VALUES(?)").run(eventId);
    res.json({ received: true });
  }),
);
app.post("/api/auth/:action", wrap(async (req,res)=>res.json(authenticate(req.params.action,req.body))));
app.use("/api/bookings", auth);
app.get("/api/bookings", (req, res) =>
  res.json(
    db
      .prepare("SELECT data FROM bookings WHERE userId=? ORDER BY rowid DESC")
      .all(req.userId)
      .map((r) => JSON.parse(r.data)),
  ),
);
app.post("/api/bookings", wrap(async (req,res)=>res.json(await createDraft(req.userId,req.body))));
app.use("/api/bookings/:id", bookingLock, (req, res, next) => {
  const b = getBooking(req.params.id);
  if (!b || b.userId !== req.userId)
    return res.status(404).json({ error: "Booking not found" });
  req.booking = b;
  next();
});
app.get("/api/bookings/:id", (req, res) => res.json(req.booking));
app.post("/api/bookings/:id/insurance", wrap(async (req,res)=>res.json(await selectProtection(req.booking,req.body))));
app.post(
  "/api/bookings/:id/pay",
  wrap(async (req, res) => res.json(await pay(req.booking, req.body))),
);
app.post(
  "/api/bookings/:id/retry-policy",
  wrap(async (req, res) => {
    if (req.booking.status !== "paid" || !req.booking.plan)
      throw Error("No paid insurance to retry.");
    res.json(await issuePolicy(req.booking));
  }),
);
app.post(
  "/api/bookings/:id/cancel",
  wrap(async (req, res) => {
    const b = req.booking;
    if (b.status !== "paid")
      throw Error("Only confirmed bookings can request cancellation.");
    b.cancellationRequested = true;
    b.cancellationNote =
      "Request received. No refund or insurance cancellation has been processed.";
    res.json(saveBooking(b));
  }),
);
app.get("/api/bookings/:id/document/:kind", (req, res) => {
  const b = req.booking,
    kind = req.params.kind;
  if (
    !["ticket", "policy", "receipt"].includes(kind) ||
    b.status !== "paid" ||
    (kind === "policy" && b.policy.status !== "issued")
  )
    return res.status(400).json({ error: "Document unavailable" });
  res.type("pdf").attachment(`${kind}-${b.id}.pdf`).send(bookingPdf(b,kind));
});
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(400)
    .json({ error: err.message || "Request could not be completed." });
});
if (process.env.NODE_ENV !== "test")
  app.listen(Number(process.env.PORT || 5002), "127.0.0.1", () =>
    console.log("TravelSure merchant API http://localhost:5002"),
  );
