import axios from "axios";
import { MockInsuranceAdapter } from "../../../mock-insurance/adapter.js";
class ExternalInsuranceAdapter {
  constructor() {
    this.api = axios.create({
      baseURL: process.env.INSURANCE_API_BASE_URL || "http://localhost:5001",
      timeout: 5000,
      headers: { "X-API-Key": process.env.INSURANCE_API_KEY || "demo-key" },
    });
  }
  async eligibility(b) {
    return (
      await this.api.post("/api/v1/insurance/eligibility", { booking: b })
    ).data;
  }
  async quotes(b) {
    return (await this.api.post("/api/v1/insurance/quotes", { booking: b }))
      .data;
  }
  async consent(b) {
    return (
      await this.api.post("/api/v1/insurance/consents", {
        bookingId: b.id,
        quoteId: b.quote.quoteId,
        planId: b.plan.id,
        consent: true,
        terms: b.plan.terms,
        recordedAt: b.consentAt,
      })
    ).data;
  }
  async issue(b) {
    return (
      await this.api.post(
        "/api/v1/insurance/policies/issue",
        { booking: b, payment: b.payment, consent: b.consent },
        { headers: { "Idempotency-Key": `policy-${b.id}` } },
      )
    ).data;
  }
  async status(id) {
    return (
      await this.api.get(`/api/v1/insurance/policies/${encodeURIComponent(id)}`)
    ).data;
  }
}
export const insurance =
  process.env.MOCK_INSURANCE === "false"
    ? new ExternalInsuranceAdapter()
    : new MockInsuranceAdapter();
