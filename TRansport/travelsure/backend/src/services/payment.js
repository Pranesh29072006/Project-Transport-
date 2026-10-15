import { randomUUID } from "node:crypto";
import { db, saveBooking, getBooking } from "../config/db.js";
import { insurance } from "./insurance.js";
const locks = new Map();
const policyLocks = new Map();
export function issuePolicy(b) {
  if (policyLocks.has(b.id)) return policyLocks.get(b.id);
  const operation = performIssuance(b).finally(() => policyLocks.delete(b.id));
  policyLocks.set(b.id, operation);
  return operation;
}
async function performIssuance(b) {
  b = getBooking(b.id) || b;
  if (!b.plan || b.policy?.status === "issued") return b;
  if (b.status !== "paid" || !b.consent)
    throw Error("Paid booking and consent are required.");
  try {
    const p = b.policy?.policyId
      ? await insurance.status(b.policy.policyId)
      : await insurance.issue(b);
    b.policy = ["issued", "pending", "failed"].includes(p.status)
      ? p
      : { status: "pending" };
    if (b.policy.status === "issued" && (!p.policyId || !p.policyNumber))
      b.policy = { status: "pending" };
  } catch {
    b.policy = {
      status: "pending",
      message: "Insurance processing. Your transport booking is confirmed.",
    };
  }
  return saveBooking(b);
}
export function pay(b, input) {
  if (locks.has(b.id)) return locks.get(b.id);
  const operation = processPayment(b, input).finally(() => locks.delete(b.id));
  locks.set(b.id, operation);
  return operation;
}
async function processPayment(b, input) {
  b = getBooking(b.id) || b;
  if (b.status === "paid") return b;
  if (b.status !== "draft") throw Error("This booking cannot be paid.");
  if (!["UPI", "Debit card", "Credit card"].includes(input.method))
    throw Error("Select a payment method.");
  if (input.simulateFailure)
    throw Error("Demo payment declined. Please retry.");
  if (b.plan && (!b.consent || !b.consentAt))
    throw Error("Explicit insurance consent is required.");
  const payment = {
    id: randomUUID(),
    amount: b.total,
    status: "verified",
    method: input.method,
    verifiedAt: new Date().toISOString(),
    mode: "simulated",
  };
  b.payment = payment;
  b.status = "paid";
  b.ticketNumber = `TS-${b.id.slice(-8)}`;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO payments VALUES(?,?,?)").run(
      payment.id,
      b.id,
      JSON.stringify(payment),
    );
    saveBooking(b);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  return issuePolicy(b);
}
