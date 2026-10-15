import express from "express";
import { MockInsuranceAdapter } from "./adapter.js";
export const mockApp = express();
const app = mockApp,
  adapter = new MockInsuranceAdapter(),
  issued = new Map();
app.use(express.json());
app.use((req, res, next) =>
  req.get("X-API-Key") === (process.env.INSURANCE_API_KEY || "demo-key")
    ? next()
    : res.status(401).json({ error: "Invalid API key" }),
);
app.post("/api/v1/insurance/eligibility", async (req, res) =>
  res.json(await adapter.eligibility(req.body.booking)),
);
app.post("/api/v1/insurance/quotes", async (req, res) =>
  res.json(await adapter.quotes(req.body.booking)),
);
app.post("/api/v1/insurance/consents", async (req, res) =>
  res.json({ id: `C-${req.body.bookingId}` }),
);
app.post("/api/v1/insurance/policies/issue", async (req, res) => {
  const key = req.get("Idempotency-Key");
  if (!key) return res.status(400).json({ error: "Idempotency key required" });
  if (issued.has(key)) return res.json(issued.get(key));
  try {
    const policy = await adapter.issue(req.body.booking);
    if (policy.status === "issued") issued.set(key, policy);
    res.json(policy);
  } catch {
    res.status(504).json({ error: "Mock timeout" });
  }
});
app.get("/api/v1/insurance/policies/:id", async (req, res) => {
  const policy = [...issued.values()].find(p => p.policyId === req.params.id);
  if (!policy) return res.status(404).json({error:'Policy not found'});
  res.json(policy);
});
if (process.env.NODE_ENV !== 'test') app.listen(5001, "127.0.0.1", () =>
  console.log("Independent mock insurance API http://localhost:5001"),
);
