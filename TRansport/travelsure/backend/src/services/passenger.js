export function validatePassengers(passengers,count,trip,seats){
    if (
      !Array.isArray(passengers) ||
      passengers.length !== Number(count) ||
      passengers.some(
        (p) =>
          !p.name?.trim() ||
          !Number.isInteger(Number(p.age)) ||
          Number(p.age) < 1 ||
          Number(p.age) > 110,
      )
    )
      throw Error("Enter valid details for each passenger.");
    if (
      trip.type === "bus" &&
      (!Array.isArray(seats) ||
        seats.length !== passengers.length ||
        new Set(seats).size !== seats.length ||
        seats.some(
          (s) => !Number.isInteger(s) || !trip.availableSeats.includes(s),
        ))
    )
      throw Error("Select an available seat for each passenger.");

}
