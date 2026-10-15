import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  ArrowLeftRight,
  CalendarDays,
  UsersRound,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { services, cities, defaultSearch, today } from "../data/travel";
export default function SearchForm({ initial, compact = false }) {
  const navigate = useNavigate();
  const [q, setQ] = useState(() => ({ ...defaultSearch(initial?.type), ...initial }));
  const [error, setError] = useState("");
  const update = (k, v) => setQ((s) => ({ ...s, [k]: v }));
  function submit(e) {
    e.preventDefault();
    if (q.from === q.to) {
      setError("Choose different departure and destination cities.");
      return;
    }
    if (
      q.trip === "round" &&
      q.type === "flight" &&
      (!q.returnDate || q.returnDate < q.date)
    ) {
      setError("Select a return date after departure.");
      return;
    }
    setError("");
    navigate(`/search?${new URLSearchParams(q)}`);
  }
  return (
    <div className={`search-panel ${compact ? "compact" : ""}`}>
      <div className="service-tabs" role="tablist" aria-label="Travel service">
        {services.map(({ id, name, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={q.type === id}
            className={q.type === id ? "active" : ""}
            onClick={() =>
              setQ((s) => ({
                ...s,
                type: id,
                class: id === "flight" ? "Economy" : "3AC",
                trip: "one",
                returnDate: "",
              }))
            }
          >
            <Icon size={22} />
            <span>{name}</span>
            {id === "rental" && <small>NEW</small>}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        {q.type === "flight" && (
          <div className="flight-options">
            <label>
              <input
                type="radio"
                checked={q.trip === "one"}
                onChange={() => update("trip", "one")}
              />{" "}
              One way
            </label>
            <label>
              <input
                type="radio"
                checked={q.trip === "round"}
                onChange={() => update("trip", "round")}
              />{" "}
              Round trip
            </label>
          </div>
        )}
        <div className="search-fields">
          <label className="location-field">
            <span>
              <MapPin size={15} />
              {q.type === "cab" || q.type === "rental"
                ? "PICKUP LOCATION"
                : "FROM"}
            </span>
            <select
              value={q.from}
              onChange={(e) => update("from", e.target.value)}
              aria-label="Departure city"
            >
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <small>
              {q.type === "flight"
                ? "All airports"
                : "Choose your starting point"}
            </small>
          </label>
          <button
            type="button"
            className="swap-btn"
            aria-label="Swap cities"
            onClick={() => setQ((s) => ({ ...s, from: s.to, to: s.from }))}
          >
            <ArrowLeftRight size={17} />
          </button>
          <label className="location-field">
            <span>
              <MapPin size={15} />
              {q.type === "cab" || q.type === "rental"
                ? "DROP-OFF LOCATION"
                : "TO"}
            </span>
            <select
              value={q.to}
              onChange={(e) => update("to", e.target.value)}
              aria-label="Destination city"
            >
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <small>
              {q.type === "flight" ? "All airports" : "Where are you headed?"}
            </small>
          </label>
          <label className="date-field">
            <span>
              <CalendarDays size={15} />
              {q.type === "rental" || q.type === "cab"
                ? "PICKUP DATE"
                : "DEPARTURE"}
            </span>
            <input
              type="date"
              min={today()}
              value={q.date}
              required
              onChange={(e) => update("date", e.target.value)}
              aria-label="Journey date"
            />
            <small>A good day to get going</small>
          </label>
          <label className="passenger-field">
            <span>
              <UsersRound size={15} />
              TRAVELLERS
            </span>
            <select
              value={q.passengers}
              onChange={(e) => update("passengers", Number(e.target.value))}
              aria-label="Number of passengers"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option value={n} key={n}>
                  {n} {n === 1 ? "Adult" : "Adults"}
                </option>
              ))}
            </select>
            <small>{q.type === "flight" ? q.class : "Room for everyone"}</small>
          </label>
          <button className="search-btn" type="submit">
            Search {services.find((s) => s.id === q.type)?.name.toLowerCase()}
            <ArrowRight size={21} />
          </button>
        </div>
        {(q.type === "train" ||
          q.type === "flight" ||
          q.type === "cab" ||
          q.type === "rental") && (
          <div className="extra-fields">
            {(q.type === "train" || q.type === "flight") && (
              <label>
                Travel class{" "}
                <select
                  value={q.class}
                  onChange={(e) => update("class", e.target.value)}
                >
                  {(q.type === "flight"
                    ? ["Economy", "Business"]
                    : ["Sleeper", "3AC", "2AC", "1AC"]
                  ).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {q.type === "flight" && q.trip === "round" && (
              <label>
                Return date{" "}
                <input
                  type="date"
                  required
                  min={q.date}
                  value={q.returnDate}
                  onChange={(e) => update("returnDate", e.target.value)}
                />
              </label>
            )}
            {(q.type === "cab" || q.type === "rental") && (
              <label>
                Pickup time{" "}
                <input
                  type="time"
                  required
                  value={q.time}
                  onChange={(e) => update("time", e.target.value)}
                />
              </label>
            )}
            {q.type === "rental" && (
              <label>
                Rental days{" "}
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={q.days}
                  required
                  onChange={(e) => update("days", Number(e.target.value))}
                />
              </label>
            )}
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
      <div className="search-bottom">
        <span>
          <ShieldMini />
          Your plans, a little more protected.{" "}
          <b>Optional travel insurance at checkout.</b>
        </span>
        <span className="demo-label">
          <i />
          Demo schedules
        </span>
      </div>
    </div>
  );
}
function ShieldMini() {
  return (
    <svg width="15" height="17" viewBox="0 0 20 22" fill="none">
      <path
        d="M10 1L18 4V10C18 15 15 19 10 21C5 19 2 15 2 10V4L10 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M6 10L9 13L14 8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
