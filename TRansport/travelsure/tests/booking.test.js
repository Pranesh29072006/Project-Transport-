import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:";
process.env.MOCK_INSURANCE = "true";
const { app } = await import("../backend/src/app.js");
const { db } = await import("../backend/src/config/db.js");
let server, origin, token;
const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
async function request(
  path,
  { method = "GET", body, auth = token, headers = {} } = {},
) {
  const response = await fetch(origin + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : { base: "none" }),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = response.headers
    .get("Content-Type")
    ?.includes("application/json")
    ? await response.json()
    : await response.arrayBuffer();
  return { status: response.status, data };
}
async function draft(type = "bus", extra = {}) {
  const search = {
    type,
    from: "Chennai",
    to: type === "flight" ? "Mumbai" : "Bangalore",
    date,
    passengers: 1,
    class: type === "flight" ? "Economy" : "3AC",
    ...extra,
  };
  const result = await request("/bookings", {
    method: "POST",
    body: {
      search,
      tripId: `${type}-0`,
      passengers: [
        { name: "Demo Traveller", age: 28, gender: "Prefer not to say" },
      ],
      seats: type === "bus" ? [1] : [],
    },
  });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data;
}
async function protect(b, index = 0, scenario = "success") {
  const r = await request(`/bookings/${b.id}/insurance`, {
    method: "POST",
    body: { planId: b.quote.plans[index].id, consent: true, scenario },
  });
  assert.equal(r.status, 200);
  return r.data;
}
async function pay(b, extra = {}) {
  return request(`/bookings/${b.id}/pay`, {
    method: "POST",
    body: { method: "UPI", ...extra },
  });
}
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const r = await request("/auth/register", {
    method: "POST",
    body: {
      email: "test@example.com",
      password: "demo-password-2026",
      name: "Demo Traveller",
    },
  });
  assert.equal(r.status, 200);
  token = r.data.token;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});
test("bus without insurance: verified ticket and no policy", async () => {
  const b = await draft();
  const { status, data } = await pay(b, { amount: 1, success: true });
  assert.equal(status, 200);
  assert.equal(data.total, 1220);
  assert.equal(data.payment.amount, 1220);
  assert.equal(data.policy.status, "not_selected");
  assert.equal(data.status, "paid");
});
test("bus with explicit insurance: one combined payment and policy", async () => {
  let b = await draft();
  b = await protect(b, 1);
  const { data } = await pay(b);
  assert.equal(data.total, 1269);
  assert.equal(data.payment.amount, 1269);
  assert.equal(data.premium, 49);
  assert.equal(data.policy.status, "issued");
  assert.ok(data.consent.id);
  assert.ok(data.policy.policyNumber);
});
test("train with optional journey insurance", async () => {
  let b = await draft("train");
  b = await protect(b, 1);
  const { data } = await pay(b);
  assert.equal(data.premium, 25);
  assert.equal(data.total, 895);
  assert.equal(data.policy.status, "issued");
});
test("flight with baggage insurance", async () => {
  let b = await draft("flight");
  b = await protect(b, 1);
  const { data } = await pay(b);
  assert.equal(data.plan.name, "Baggage Protection");
  assert.equal(data.total, 5669);
  assert.equal(data.policy.status, "issued");
});
test("cab with ride protection", async () => {
  let b = await draft("cab");
  b = await protect(b);
  const { data } = await pay(b);
  assert.equal(data.total, 2439);
  assert.equal(data.policy.status, "issued");
});
test("rental duration and damage protection", async () => {
  let b = await draft("rental", { days: 3 });
  assert.equal(b.fare, 5400);
  b = await protect(b);
  const { data } = await pay(b);
  assert.equal(data.total, 5719);
  assert.equal(data.policy.status, "issued");
});
test("insurance timeout keeps paid ticket, shows pending, never active", async () => {
  let b = await draft();
  b = await protect(b, 0, "timeout");
  const { data } = await pay(b);
  assert.equal(data.status, "paid");
  assert.equal(data.policy.status, "pending");
  assert.equal(data.policy.policyNumber, undefined);
  const download = await request(`/bookings/${b.id}/document/policy`);
  assert.equal(download.status, 400);
});
test("explicit pending and failed insurance states are preserved on retries", async () => {
  for (const scenario of ["pending", "failure"]) {
    let b = await draft();
    b = await protect(b, 0, scenario);
    const { data } = await pay(b);
    assert.equal(data.status, "paid");
    assert.equal(
      data.policy.status,
      scenario === "failure" ? "failed" : "pending",
    );
    const retry = await request(`/bookings/${b.id}/retry-policy`, {
      method: "POST",
      body: {},
    });
    assert.equal(retry.data.policy.status, data.policy.status);
  }
});
test("concurrent payments and retries do not duplicate payment or policy", async () => {
  let b = await draft();
  b = await protect(b);
  const payments = await Promise.all([pay(b), pay(b), pay(b)]);
  assert.ok(payments.every((p) => p.status === 200));
  assert.equal(new Set(payments.map((p) => p.data.payment.id)).size, 1);
  assert.equal(
    new Set(payments.map((p) => p.data.policy.policyNumber)).size,
    1,
  );
  const retries = await Promise.all(
    [1, 2, 3].map(() =>
      request(`/bookings/${b.id}/retry-policy`, { method: "POST", body: {} }),
    ),
  );
  assert.ok(
    retries.every(
      (r) =>
        r.data.policy.policyNumber === payments[0].data.policy.policyNumber,
    ),
  );
  assert.equal(
    db
      .prepare("SELECT count(*) AS count FROM payments WHERE bookingId=?")
      .get(b.id).count,
    1,
  );
});
test("signed duplicate webhook events are acknowledged once", async () => {
  let b = await draft();
  b = await protect(b);
  const paid = (await pay(b)).data;
  const body = { eventId: "event-one", paymentId: paid.payment.id };
  const signature = createHmac("sha256", "demo-webhook-secret")
    .update(JSON.stringify(body))
    .digest("hex");
  const first = await request("/payments/webhook", {
    method: "POST",
    body,
    headers: { "X-Payment-Signature": signature },
  });
  const second = await request("/payments/webhook", {
    method: "POST",
    body,
    headers: { "X-Payment-Signature": signature },
  });
  assert.equal(first.data.received, true);
  assert.equal(second.data.duplicate, true);
  const forged = await request("/payments/webhook", {
    method: "POST",
    body,
    headers: { "X-Payment-Signature": "fake" },
  });
  assert.equal(forged.status, 401);
});
test("dashboard retains policy and downloadable valid PDF documents", async () => {
  let b = await draft();
  b = await protect(b);
  await pay(b);
  const all = await request("/bookings");
  const found = all.data.find((item) => item.id === b.id);
  assert.equal(found.policy.status, "issued");
  for (const kind of ["ticket", "policy", "receipt"]) {
    const pdf = await request(`/bookings/${b.id}/document/${kind}`);
    assert.equal(pdf.status, 200);
    assert.equal(Buffer.from(pdf.data).subarray(0, 8).toString(), "%PDF-1.4");
  }
});
test("insurance requires consent and rejects browser supplied premiums", async () => {
  const b = await draft();
  const rejected = await request(`/bookings/${b.id}/insurance`, {
    method: "POST",
    body: { planId: b.quote.plans[0].id, premium: 0, consent: false },
  });
  assert.equal(rejected.status, 400);
  const accepted = await request(`/bookings/${b.id}/insurance`, {
    method: "POST",
    body: { planId: b.quote.plans[0].id, premium: 0, total: 1, consent: true },
  });
  assert.equal(accepted.data.premium, 29);
  assert.equal(accepted.data.total, 1249);
});
test("payment decline remains draft and can be retried", async () => {
  const b = await draft();
  const declined = await pay(b, { simulateFailure: true });
  assert.equal(declined.status, 400);
  const current = await request(`/bookings/${b.id}`);
  assert.equal(current.data.status, "draft");
  assert.equal((await pay(b)).data.status, "paid");
});
test("ownership and authentication protect bookings", async () => {
  const b = await draft();
  const missing = await request(`/bookings/${b.id}`, { auth: null });
  assert.equal(missing.status, 401);
  const second = await request("/auth/register", {
    method: "POST",
    body: {
      email: "other@example.com",
      password: "different-demo-password",
      name: "Other",
    },
  });
  const denied = await request(`/bookings/${b.id}`, {
    auth: second.data.token,
  });
  assert.equal(denied.status, 404);
});
test("cancellation records a request without claiming a refund", async () => {
  const b = await draft();
  await pay(b);
  const r = await request(`/bookings/${b.id}/cancel`, {
    method: "POST",
    body: {},
  });
  assert.equal(r.data.cancellationRequested, true);
  assert.equal(r.data.status, "paid");
  assert.match(r.data.cancellationNote, /No refund/);
});
test("reject invalid routes, past dates, passenger counts, and occupied seats", async () => {
  for (const extra of [
    { from: "Chennai", to: "Chennai" },
    { date: "2020-01-01" },
    { passengers: 7 },
  ]) {
    const params = new URLSearchParams({
      type: "bus",
      from: "Chennai",
      to: "Bangalore",
      date,
      passengers: 1,
      ...extra,
    });
    assert.equal((await request(`/search?${params}`)).status, 400);
  }
  const r = await request("/bookings", {
    method: "POST",
    body: {
      search: {
        type: "bus",
        from: "Chennai",
        to: "Bangalore",
        date,
        passengers: 1,
      },
      tripId: "bus-0",
      passengers: [{ name: "Test", age: 25 }],
      seats: [7],
    },
  });
  assert.equal(r.status, 400);
});
