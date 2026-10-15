import {saveBooking} from '../config/db.js';
import {insurance} from './insurance.js';
export async function selectProtection(b,input){

    if (b.status !== "draft") throw Error("Booking is already processed.");
    const plan = input.planId
      ? b.quote.plans.find((p) => p.id === input.planId)
      : null;
    if (input.planId && !plan) throw Error("Invalid plan.");
    if (plan) {
      if (b.quote.expiresAt && b.quote.expiresAt < Date.now())
        throw Error("Quote expired. Start a new booking.");
      if (input.consent !== true)
        throw Error("Please explicitly consent to the selected insurance.");
      b.plan = plan;
      b.consentAt = new Date().toISOString();
      b.consent = await insurance.consent(b);
    } else {
      b.plan = null;
      b.consent = null;
      b.consentAt = null;
    }
    b.premium = plan?.premium || 0;
    b.total = b.fare + b.fee + b.premium;
    b.scenario =
      process.env.MOCK_INSURANCE !== "false" &&
      ["pending", "failure", "timeout"].includes(input.scenario)
        ? input.scenario
        : "success";
    return saveBooking(b);

}
