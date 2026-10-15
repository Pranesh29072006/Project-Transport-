import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Star,
  Wifi,
  Zap,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import SearchForm from "../components/SearchForm";
import { api, errorMessage } from "../services/api";
import { Loading, ErrorBox } from "../components/Layout";
import { defaultSearch, money, services } from "../data/travel";
export default function Search() {
  const [params] = useSearchParams();
  const key = params.toString();
  const q = { ...defaultSearch(params.get('type') || 'bus'), ...Object.fromEntries(params) };
  const [results, setResults] = useState([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [filters, setFilters] = useState([]),
    [sort, setSort] = useState("recommended"),
    [maxPrice, setMaxPrice] = useState(30000);
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    setFilters([]);
    setMaxPrice(30000);
    api
      .get("/search", {
        params: {
          ...defaultSearch(new URLSearchParams(key).get('type') || 'bus'),
          ...Object.fromEntries(new URLSearchParams(key)),
        },
      })
      .then((r) => {
        if (active) setResults(r.data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [key]);
  const options =
    q.type === "bus"
      ? ["AC Sleeper", "AC Seater", "Non-AC Sleeper", "Non-AC Seater"]
      : q.type === "cab" || q.type === "rental"
        ? ["Sedan", "SUV", "Hatchback"]
        : [];
  const visible = results
    .filter(
      (t) =>
        t.fare <= maxPrice && (!filters.length || filters.includes(t.variant)),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.fare - b.fare
        : sort === "departure"
          ? a.departure.localeCompare(b.departure)
          : b.rating - a.rating,
    );
  const Service = services.find((s) => s.id === q.type)?.Icon;
  return (
    <main className="page container">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Find your journey</span>
      </div>
      <SearchForm key={key} initial={q} compact />
      <div className="results-heading">
        <div>
          <span className="eyebrow">THE NEXT CHAPTER</span>
          <h1>
            {q.from} <ArrowRight /> {q.to}
          </h1>
          <p>
            {q.date} · {q.passengers} traveller(s) · {visible.length} demo
            options
          </p>
        </div>
        <label className="sort">
          Sort by{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="price">Lowest fare</option>
            <option value="departure">Departure time</option>
          </select>
        </label>
      </div>
      <div className="results-layout">
        <aside className="filter-card">
          <h3>
            <SlidersHorizontal size={17} /> Make it your journey
          </h3>
          <label className="range-label">
            Maximum fare <b>{money(maxPrice)}</b>
            <input
              type="range"
              min={500}
              max={30000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </label>
          {options.length > 0 && (
            <div className="filter-options">
              <h4>{q.type === "bus" ? "Bus type" : "Vehicle type"}</h4>
              {options.map((o) => (
                <label key={o}>
                  <input
                    type="checkbox"
                    checked={filters.includes(o)}
                    onChange={() =>
                      setFilters((v) =>
                        v.includes(o) ? v.filter((a) => a !== o) : [...v, o],
                      )
                    }
                  />
                  {o}
                </label>
              ))}
            </div>
          )}
          <button
            className="text-btn"
            onClick={() => {
              setFilters([]);
              setMaxPrice(30000);
            }}
          >
            Reset filters
          </button>
          <div className="filter-note">
            <ShieldCheck />
            <b>A little extra peace of mind</b>
            <p>
              Explore optional protection during checkout. Never preselected.
            </p>
          </div>
        </aside>
        <div>
          <ErrorBox error={error} />
          {busy ? (
            <Loading />
          ) : visible.length ? (
            visible.map((trip, i) => (
              <article className="trip-card" key={trip.id}>
                <div className="trip-card-main">
                  <div className="operator">
                    <span className="transport-icon">
                      {Service && <Service size={27} />}
                    </span>
                    <div>
                      {i === 0 && (
                        <span className="recommended">TRAVELLER FAVOURITE</span>
                      )}
                      <h3>{trip.name}</h3>
                      <p>{trip.variant}</p>
                      <span className="rating">
                        <Star size={12} fill="currentColor" /> {trip.rating}
                      </span>
                    </div>
                  </div>
                  <div className="trip-time">
                    <strong>{trip.departure}</strong>
                    <span>{q.from}</span>
                  </div>
                  <div className="duration">
                    <span>{trip.duration}</span>
                    <div>
                      ○<i />○
                    </div>
                    <small>Direct journey</small>
                  </div>
                  <div className="trip-time">
                    <strong>{trip.arrival}</strong>
                    <span>{q.to}</span>
                  </div>
                  <div className="trip-price">
                    <small>
                      per {trip.priceUnit || "traveller"}{" "}
                      {q.type === "flight" &&
                        q.trip === "round" &&
                        "· return included"}
                    </small>
                    <strong>{money(trip.fare)}</strong>
                    <button
                      className="primary"
                      onClick={() =>
                        navigate("/reserve", { state: { trip, q } })
                      }
                    >
                      {q.type === "bus" ? "Select seats" : "Book journey"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
                <div className="trip-card-footer">
                  <span>
                    <Wifi size={14} />{" "}
                    {q.type === "flight"
                      ? "15 kg check-in baggage"
                      : "Comfort on board"}
                  </span>
                  <span>
                    <Zap size={14} />
                    {q.type === "rental"
                      ? `${q.days} rental day(s)`
                      : "Demo availability"}
                  </span>
                  <span className="seats-count">{trip.seats} available</span>
                </div>
              </article>
            ))
          ) : (
            !error && (
              <div className="empty-state">
                <h2>No journeys with these filters.</h2>
                <p>Try a higher fare limit or another vehicle type.</p>
                <button
                  className="primary"
                  onClick={() => {
                    setFilters([]);
                    setMaxPrice(30000);
                  }}
                >
                  Show all journeys
                </button>
              </div>
            )
          )}
          <p className="fine-print">
            All schedules and fares are illustrative. No live transport provider
            or IRCTC connection is used.
          </p>
        </div>
      </div>
    </main>
  );
}
