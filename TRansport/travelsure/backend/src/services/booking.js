import {randomUUID} from 'node:crypto';
import {saveBooking} from '../config/db.js';
import {search} from './transport.js';
import {insurance} from './insurance.js';
import {validatePassengers} from './passenger.js';
export async function createDraft(userId,input){
    const { search: query, tripId, passengers, seats } = input;
    const trip = search(query).find((t) => t.id === tripId);
    if (!trip) throw Error("Trip unavailable.");
    validatePassengers(passengers,Number(query.passengers),trip,seats);
    const b = {
      id: randomUUID(),
      userId: userId,
      trip,
      search: query,
      passengers,
      seats: seats || [],
      status: "draft",
      fare: trip.fare * (trip.priceUnit === "vehicle" ? 1 : passengers.length),
      fee: 20,
      premium: 0,
      total:
        trip.fare * (trip.priceUnit === "vehicle" ? 1 : passengers.length) + 20,
      createdAt: new Date().toISOString(),
      policy: { status: "not_selected" },
    };
    try {
      const eligible = await insurance.eligibility(b);
      b.quote = eligible.eligible ? await insurance.quotes(b) : { plans: [] };
    } catch {
      b.quote = {
        plans: [],
        error:
          "Protection is temporarily unavailable. You can book without it.",
      };
    }
    return saveBooking(b);

}
