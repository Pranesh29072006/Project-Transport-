// This module belongs to the independent mock middleware, never production underwriting.
const prices = {
  bus: [29, 49, 99],
  train: [10, 25],
  flight: [99, 149, 299],
  cab: [19, 49],
  rental: [299, 599],
};
const names = {
  bus: [
    "Trip Accident Protection",
    "Travel Delay Protection",
    "Comprehensive Travel Protection",
  ],
  train: ["Accident Protection", "Journey Protection"],
  flight: [
    "Flight Delay Protection",
    "Baggage Protection",
    "Comprehensive Travel Protection",
  ],
  cab: ["Ride Accident Protection", "Premium Ride Protection"],
  rental: ["Rental Damage Protection", "Comprehensive Rental Protection"],
};
export const mockPlans = (type) =>
  (prices[type] || []).map((premium, i) => ({
    id: `${type}-plan-${i}`,
    name: names[type][i],
    premium,
    coverage: type === 'rental' ? 'Eligible accidental damage to your rented vehicle' : type === 'flight' && i === 1 ? 'Lost or delayed checked baggage' : /Delay/.test(names[type][i]) ? 'Eligible journey delays exceeding six hours' : i === 0 ? 'Accidental injury during your booked journey' : 'Accidental injury and eligible journey disruption',
    limit: "Illustrative cover up to ₹2,00,000",
    duration: "Booked journey only",
    exclusions:
      "Pre-existing conditions, intentional acts, unattended property, and events outside the booked journey are excluded.",
    terms:
      "Demo cover only. No real insurance contract or financial protection is provided.",
  }));
export class MockInsuranceAdapter {
  async eligibility() {
    return { eligible: true };
  }
  async quotes(b) {
    return {
      quoteId: `Q-${b.id}`,
      expiresAt: Date.now() + 900000,
      plans: mockPlans(b.trip.type),
    };
  }
  async consent(b) {
    return { id: `C-${b.id}`, recordedAt: new Date().toISOString() };
  }
  async issue(b) {
    if (b.scenario === "pending") return { status: "pending" };
    if (b.scenario === "timeout") throw Error("Insurance API timeout");
    if (b.scenario === "failure") return { status: "failed" };
    return {
      status: "issued",
      policyId: `DEMO-${b.id}`,
      policyNumber: `TS-${b.id.slice(-8)}`,
      coverage: b.plan.coverage,
      startDate: b.trip.date,
      endDate: b.search.returnDate || b.trip.date,
    };
  }
  async status(id) {
    return {
      status: "issued",
      policyId: id,
      policyNumber: `TS-${id.slice(-8)}`,
    };
  }
}
