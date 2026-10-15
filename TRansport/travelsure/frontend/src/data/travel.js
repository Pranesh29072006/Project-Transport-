import { BusFront, TrainFront, Plane, CarFront, KeyRound } from "lucide-react";
export const services = [
  { id: "bus", name: "Buses", singular: "Bus", Icon: BusFront },
  { id: "train", name: "Trains", singular: "Train", Icon: TrainFront },
  { id: "flight", name: "Flights", singular: "Flight", Icon: Plane },
  { id: "cab", name: "Cabs", singular: "Cab", Icon: CarFront },
  { id: "rental", name: "Car rentals", singular: "Car rental", Icon: KeyRound },
];
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
export const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
export const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const today = () => new Date().toLocaleDateString("en-CA");
export const defaultSearch = (type = "bus") => ({
  type,
  from: "Chennai",
  to: "Bangalore",
  date: tomorrow(),
  passengers: 1,
  class: type === "flight" ? "Economy" : "3AC",
  trip: "one",
  returnDate: "",
  time: "09:00",
  days: 1,
});
export const image = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export const routes = [
  {
    from: "Chennai",
    to: "Bangalore",
    tag: "THE WEEKEND RESET",
    price: 899,
    image: "photo-1596176530529-78163a4f7af2",
    description: "Garden city, great company.",
  },
  {
    from: "Mumbai",
    to: "Goa",
    tag: "A LITTLE SUNSHINE",
    price: 1299,
    image: "photo-1512343879784-a960bf40e7f2",
    description: "Trade the everyday for ocean air.",
  },
  {
    from: "Delhi",
    to: "Jaipur",
    tag: "A ROYAL ESCAPE",
    price: 699,
    image: "photo-1599661046289-e31897846e41",
    description: "A city that wears its heart in pink.",
  },
];
