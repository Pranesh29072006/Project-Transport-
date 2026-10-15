export const cities = [
  "Chennai",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Pune",
  "Kochi",
  "Jaipur",
  "Goa",
];
const names = {
  bus: [
    "Orange Travels",
    "IntrCity SmartBus",
    "SRS Travels",
    "GreenLine Express",
  ],
  train: [
    "Vande Bharat Express",
    "Shatabdi Express",
    "Intercity Express",
    "Rajdhani Express",
  ],
  flight: ["IndiGo", "Air India", "Akasa Air", "SpiceJet"],
  cab: ["City Sedan", "Comfort SUV", "Easy Hatchback", "Premium Sedan"],
  rental: ["Maruti Swift", "Hyundai Creta", "Honda City", "Tata Nexon"],
};
export function search(q) {
  const base = { bus: 1200, train: 850, flight: 5500, cab: 2400, rental: 1800 }[
    q.type
  ];
  if (
    !base ||
    !cities.includes(q.from) ||
    !cities.includes(q.to) ||
    q.from === q.to
  )
    throw Error("Choose two different supported cities.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(q.date) ||
    !Number.isFinite(Date.parse(`${q.date}T00:00:00Z`)) ||
    q.date < new Date().toISOString().slice(0, 10)
  )
    throw Error("Choose today or a future journey date.");
  const count = Number(q.passengers || 1);
  if (!Number.isInteger(count) || count < 1 || count > 6)
    throw Error("Choose 1–6 passengers.");
  if (
    q.type === "flight" &&
    q.trip === "round" &&
    (!q.returnDate || q.returnDate < q.date)
  )
    throw Error("Choose a return date after departure.");
  const days = Number(q.days || 1);
  if (!Number.isInteger(days) || days < 1 || days > 30)
    throw Error("Rental duration must be 1–30 days.");
  const vehicle = q.type === "cab" || q.type === "rental";
  if (vehicle && !/^([01]\d|2[0-3]):[0-5]\d$/.test(q.time || "09:00"))
    throw Error("Choose a valid pickup time.");
  const departure = (i) =>
    vehicle ? q.time || "09:00" : ["21:30", "22:15", "19:45", "08:00"][i];
  const travelMinutes = q.type === "flight" ? 115 : 435;
  const arrival = (i) => {
    const [h, m] = departure(i).split(":").map(Number);
    const minutes = (h * 60 + m + travelMinutes) % 1440;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  };
  return names[q.type].map((name, i) => ({
    id: `${q.type}-${i}`,
    name,
    type: q.type,
    from: q.from,
    to: q.to,
    date: q.date,
    departure: departure(i),
    arrival: arrival(i),
    duration: q.type === "flight" ? "1h 55m" : "7h 15m",
    fare: Math.round(
      (base + i * 170) *
        (q.class === "Business"
          ? 2.3
          : q.class === "1AC"
            ? 2
            : q.class === "2AC"
              ? 1.6
              : 1) *
        (q.type === "flight" && q.trip === "round" ? 2 : 1) *
        (q.type === "rental" ? days : 1),
    ),
    priceUnit: vehicle ? "vehicle" : "traveller",
    seats: 12 + i * 3,
    availableSeats: Array.from({ length: 24 }, (_, n) => n + 1)
      .filter((n) => n % 7 !== 0)
      .slice(0, 12 + i * 3),
    rating: [4.8, 4.6, 4.5, 4.3][i],
    amenities: ["Wi-Fi", "Charging point", "Water bottle"],
    variant:
      q.type === "bus"
        ? ["AC Sleeper", "AC Seater", "Non-AC Sleeper", "Non-AC Seater"][i]
        : q.type === "train"
          ? `${q.class || "3AC"} · ${12610 + i}`
          : q.type === "flight"
            ? `${q.class || "Economy"} · 15 kg baggage`
            : ["Sedan", "SUV", "Hatchback", "SUV"][i],
    driver: q.type === "cab" ? "Ravi Kumar · 4.9 ★" : null,
  }));
}
