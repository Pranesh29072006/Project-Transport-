import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  CheckCircle2,
  Download,
  Clock,
  Info,
  Armchair,
  RefreshCw,
  LoaderCircle,
} from "lucide-react";
import { useTravel } from "../context/TravelContext";
import { api, errorMessage, downloadDocument } from "../services/api";
import { ErrorBox, Loading } from "../components/Layout";
import { money } from "../data/travel";
export function Steps({ active }) {
  return (
    <div className="steps">
      {["Your journey", "Travellers", "Protection & payment", "All set"].map(
        (s, i) => (
          <span key={s} className={i <= active ? "active" : ""}>
            <i>{i < active ? <Check size={12} /> : i + 1}</i>
            {s}
            {i < 3 && <b />}
          </span>
        ),
      )}
    </div>
  );
}
export function Summary({ b, children }) {
  return (
    <aside className="summary">
      <span className="eyebrow">YOUR LITTLE GETAWAY</span>
      <h3>
        {b.trip.from} <ArrowRight size={17} /> {b.trip.to}
      </h3>
      <p>{b.trip.name}</p>
      <div className="summary-trip">
        <span>{b.trip.date}</span>
        <strong>
          {b.trip.departure} → {b.trip.arrival}
        </strong>
        <small>
          {b.trip.variant} · {b.passengers?.length || b.search?.passengers}{" "}
          traveller(s)
        </small>
        {b.search?.type === "rental" && (
          <small>{b.search.days} rental day(s)</small>
        )}
        {b.search?.trip === "round" && (
          <small>Return: {b.search.returnDate}</small>
        )}
        {b.trip.driver && <small>Demo driver: {b.trip.driver}</small>}
      </div>
      <div className="fare-lines">
        <span>
          Ticket fare <b>{money(b.fare)}</b>
        </span>
        <span>
          Booking fee <b>{money(b.fee ?? 20)}</b>
        </span>
        <span>
          Optional protection <b>{money(b.premium)}</b>
        </span>
        <div className="fare-total">
          {b.status === "paid" ? "Total paid" : "Total payable"}
          <strong>{money(b.total)}</strong>
        </div>
      </div>
      {children}
      <p className="fine-print">
        <ShieldCheck size={13} /> One combined, simulated payment. No real money
        is charged.
      </p>
    </aside>
  );
}
export function Reserve() {
  const { state } = useLocation(),
    navigate = useNavigate(),
    { user, setAuthOpen } = useTravel();
  const [seats, setSeats] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!state?.trip)
    return (
      <main className="page container empty-state">
        <h1>Let’s find your journey first.</h1>
        <Link className="primary" to="/search">
          Search journeys <ArrowRight />
        </Link>
      </main>
    );
  const { trip, q } = state;
  const count = Number(q.passengers);
  async function submit(e) {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (q.type === "bus" && seats.length !== count) {
      setError(`Select ${count} seat(s) to continue.`);
      return;
    }
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const passengers = Array.from({ length: count }, (_, i) => ({
      name: f.get(`name-${i}`),
      age: Number(f.get(`age-${i}`)),
      gender: f.get(`gender-${i}`),
    }));
    try {
      const { data } = await api.post("/bookings", {
        search: q,
        tripId: trip.id,
        seats,
        passengers,
      });
      navigate(`/checkout/${data.id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page container">
      <Steps active={1} />
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE PEOPLE MAKE THE JOURNEY</span>
          <h1>A few details, then you’re on your way.</h1>
        </div>
      </div>
      <div className="checkout-layout">
        <form onSubmit={submit} className="booking-form">
          {q.type === "bus" && (
            <section className="white-card">
              <h2>Pick your favourite spot.</h2>
              <p>Select {count} seat(s). Demo layout · blue seats are yours.</p>
              <div className="seat-layout">
                <div className="driver">
                  <span>FRONT</span>
                  <span>◉</span>
                </div>
                <div className="seat-grid">
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <button
                      type="button"
                      key={n}
                      aria-label={`Seat ${n}${!trip.availableSeats.includes(n) ? " unavailable" : ""}`}
                      aria-pressed={seats.includes(n)}
                      disabled={!trip.availableSeats.includes(n)}
                      className={`seat ${seats.includes(n) ? "selected" : ""}`}
                      onClick={() =>
                        setSeats((v) =>
                          v.includes(n)
                            ? v.filter((s) => s !== n)
                            : v.length < count
                              ? [...v, n]
                              : v,
                        )
                      }
                    >
                      <Armchair size={19} />
                      <small>{n}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="seat-key">
                <span>
                  <i /> Available
                </span>
                <span>
                  <i className="selected" /> Selected
                </span>
                <span>
                  <i className="unavailable" /> Unavailable
                </span>
              </div>
            </section>
          )}
          <section className="white-card">
            <h2>Who’s coming along?</h2>
            <p>Use fictional details for this demonstration.</p>
            {Array.from({ length: count }, (_, i) => (
              <div className="passenger-row" key={i}>
                <h4>Traveller {i + 1}</h4>
                <div className="form-row">
                  <label>
                    Full name
                    <input
                      name={`name-${i}`}
                      required
                      maxLength={80}
                      placeholder="Name as on ID"
                    />
                  </label>
                  <label>
                    Age
                    <input
                      name={`age-${i}`}
                      type="number"
                      required
                      min={1}
                      max={110}
                      placeholder="Age"
                    />
                  </label>
                  <label>
                    Gender
                    <select name={`gender-${i}`}>
                      <option>Prefer not to say</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </section>
          <ErrorBox error={error} />
          {!user && (
            <p className="info-note">
              Sign in or create a demo account to keep your booking safe.
            </p>
          )}
          <button className="primary wide" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" />
            ) : (
              "Continue to protection & payment"
            )}
            <ArrowRight size={18} />
          </button>
        </form>
        <Summary
          b={{
            trip,
            search: q,
            fare: trip.fare * (trip.priceUnit === "vehicle" ? 1 : count),
            premium: 0,
            total: trip.fare * (trip.priceUnit === "vehicle" ? 1 : count) + 20,
          }}
        />
      </div>
    </main>
  );
}
function useBooking() {
  const { id } = useParams();
  const [b, setB] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .get(`/bookings/${id}`)
      .then((r) => {
        if (active) setB(r.data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [id]);
  return { b, setB, error, setError, id };
}
export function Checkout() {
  const { b, setB, error, setError, id } = useBooking();
  const navigate = useNavigate();
  const [planId, setPlanId] = useState(""),
    [consent, setConsent] = useState(false),
    [method, setMethod] = useState("UPI"),
    [busy, setBusy] = useState(false),
    [details, setDetails] = useState(null),
    [scenario, setScenario] = useState("success"),
    [failPayment, setFailPayment] = useState(false);
  if (error && !b)
    return (
      <main className="page container">
        <ErrorBox error={error} />
        <Link to="/bookings">Back to bookings</Link>
      </main>
    );
  if (!b) return <Loading />;
  if (b.status === "paid")
    return (
      <main className="page container empty-state">
        <h1>This journey is already booked.</h1>
        <Link className="primary" to={`/confirmation/${id}`}>
          View confirmation
        </Link>
      </main>
    );
  const selected = b.quote?.plans?.find((p) => p.id === planId);
  const display = {
    ...b,
    premium: selected?.premium || 0,
    total: b.fare + b.fee + (selected?.premium || 0),
  };
  async function pay(e) {
    e.preventDefault();
    if (selected && !consent) {
      setError(
        "Please explicitly accept the insurance terms, or continue without protection.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(`/bookings/${id}/insurance`, {
        planId: planId || null,
        consent,
        scenario,
      });
      const { data } = await api.post(`/bookings/${id}/pay`, {
        method,
        simulateFailure: failPayment,
      });
      setB(data);
      navigate(`/confirmation/${id}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page container">
      <Steps active={2} />
      <span className="eyebrow">A LITTLE PEACE OF MIND</span>
      <h1>One last step. Then, let’s go.</h1>
      <div className="checkout-layout">
        <form onSubmit={pay}>
          <section className="white-card protection-section">
            <div className="protection-title">
              <span>
                <ShieldCheck size={28} />
              </span>
              <div>
                <h2>Protect your journey.</h2>
                <p>Optional cover. Your choice, always.</p>
              </div>
              <small>ILLUSTRATIVE DEMO PLANS</small>
            </div>
            {b.quote?.error && <p className="info-note">{b.quote.error}</p>}
            {b.quote?.plans?.map((plan) => (
              <div
                className={`plan-card ${planId === plan.id ? "chosen" : ""}`}
                key={plan.id}
              >
                <label>
                  <input
                    type="radio"
                    name="plan"
                    checked={planId === plan.id}
                    onChange={() => {
                      setPlanId(plan.id);
                      setConsent(false);
                    }}
                  />
                  <div>
                    <strong>{plan.name}</strong>
                    <p>{plan.coverage}</p>
                    <small>{plan.limit}</small>
                  </div>
                  <b>
                    {money(plan.premium)}
                    <small>per booking</small>
                  </b>
                </label>
                <button
                  className="text-btn"
                  type="button"
                  onClick={() =>
                    setDetails(details === plan.id ? null : plan.id)
                  }
                >
                  {details === plan.id ? "Hide" : "View"} cover details{" "}
                  <Info size={13} />
                </button>
                {details === plan.id && (
                  <div className="plan-details">
                    <p>
                      <b>Duration:</b> {plan.duration}
                    </p>
                    <p>
                      <b>Exclusions:</b> {plan.exclusions}
                    </p>
                    <p>
                      <b>Terms:</b> {plan.terms}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <label className="decline-plan">
              <input
                type="radio"
                name="plan"
                checked={!planId}
                onChange={() => {
                  setPlanId("");
                  setConsent(false);
                }}
              />
              I’ll travel without additional protection.
            </label>
            {selected && (
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />{" "}
                <span>
                  I have read the cover details, exclusions and terms for{" "}
                  {selected.name}. I explicitly consent to purchase this
                  optional demo protection for {money(selected.premium)}.
                </span>
              </label>
            )}
            <p className="fine-print">
              TravelSure is an independent booking merchant. Insurance
              eligibility, quotes and policies come from the separate middleware
              platform.
            </p>
          </section>
          <section className="white-card">
            <h2>Your travellers</h2>
            {b.passengers.map((p, i) => (
              <p key={i}>
                {p.name} · {p.age} years
                {b.seats[i] ? ` · Seat ${b.seats[i]}` : ""}
              </p>
            ))}
          </section>
          <section className="white-card">
            <h2>One payment. Everything together.</h2>
            <p>Securely simulated. No bank details needed.</p>
            <div className="payment-methods">
              {["UPI", "Debit card", "Credit card"].map((m) => (
                <label key={m} className={method === m ? "active" : ""}>
                  <input
                    type="radio"
                    name="method"
                    checked={method === m}
                    onChange={() => setMethod(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
            <div className="payment-demo">
              <CheckCircle2 size={18} />
              {method === "UPI"
                ? "Demo UPI · travelsure@test"
                : `Demo ${method.toLowerCase()} · •••• 4242`}
              <small>Automatically verified by the merchant backend.</small>
            </div>
            <details className="demo-controls">
              <summary>Demo testing options</summary>
              <label>
                <input
                  type="checkbox"
                  checked={failPayment}
                  onChange={(e) => setFailPayment(e.target.checked)}
                />{" "}
                Simulate payment decline
              </label>
              {selected && (
                <label>
                  Insurance response{" "}
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                  >
                    <option value="success">Confirmed issuance</option>
                    <option value="pending">Issuance pending</option>
                    <option value="failure">Issuance failure</option>
                    <option value="timeout">API timeout</option>
                  </select>
                </label>
              )}
              <small>
                Scenarios are available with the merchant mock adapter.
              </small>
            </details>
          </section>
          <ErrorBox error={error} />
          <button className="primary wide pay-btn" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle className="spin" />
                Verifying your demo payment…
              </>
            ) : (
              <>
                Pay {money(display.total)} <ArrowRight size={20} />
              </>
            )}
          </button>
          <p className="fine-print">
            By continuing, you accept the <Link to="/terms">booking terms</Link>
            . This is a demonstration payment only.
          </p>
        </form>
        <Summary b={display}>
          <div className="summary-protection">
            <ShieldCheck size={20} />
            <span>
              {selected ? selected.name : "No additional protection selected"}
            </span>
          </div>
        </Summary>
      </div>
    </main>
  );
}
export function Confirmation() {
  const { b, setB, error, setError, id } = useBooking();
  const [busy, setBusy] = useState(false);
  if (error && !b)
    return (
      <main className="page container">
        <ErrorBox error={error} />
      </main>
    );
  if (!b) return <Loading />;
  async function download(kind) {
    try {
      await downloadDocument(id, kind);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function retry() {
    setBusy(true);
    try {
      setB((await api.post(`/bookings/${id}/retry-policy`)).data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page container confirmation">
      <Steps active={3} />
      {b.status !== "paid" ? (
        <div className="empty-state">
          <h1>Your booking is awaiting payment.</h1>
          <Link className="primary" to={`/checkout/${id}`}>
            Continue checkout
          </Link>
        </div>
      ) : (
        <>
          <div className="confirmation-hero">
            <span>
              <CheckCircle2 size={42} />
            </span>
            <div className="eyebrow">GOOD TIMES AHEAD</div>
            <h1>You’re going places.</h1>
            <p>
              Your demo journey is confirmed. Everything you need is right here.
            </p>
            <strong>{b.ticketNumber}</strong>
          </div>
          <div className="checkout-layout">
            <div>
              <section className="white-card">
                <span className="eyebrow">BOOKING CONFIRMATION</span>
                <h2>
                  {b.trip.from} <ArrowRight size={22} /> {b.trip.to}
                </h2>
                <p>
                  {b.trip.name} · {b.trip.type.toUpperCase()} · {b.trip.variant}
                </p>
                <div className="confirmation-details">
                  <div>
                    <small>Journey date</small>
                    <b>{b.trip.date}</b>
                  </div>
                  <div>
                    <small>Departure</small>
                    <b>{b.trip.departure}</b>
                  </div>
                  <div>
                    <small>Booking ID</small>
                    <b className="booking-id">{b.id}</b>
                  </div>
                  <div>
                    <small>Travellers</small>
                    <b>{b.passengers.map((p) => p.name).join(", ")}</b>
                  </div>
                </div>
                <div className="button-row">
                  <button
                    className="outline-btn"
                    onClick={() => download("ticket")}
                  >
                    <Download size={17} />
                    Download ticket
                  </button>
                  <button
                    className="outline-btn"
                    onClick={() => download("receipt")}
                  >
                    <Download size={17} />
                    Payment receipt
                  </button>
                </div>
              </section>
              <section
                className={`white-card policy-status ${b.policy.status}`}
              >
                <ShieldCheck size={30} />
                <span className="eyebrow">YOUR JOURNEY PROTECTION</span>
                <h2>
                  {b.policy.status === "issued"
                    ? "Demo protection issued"
                    : b.policy.status === "pending"
                      ? "Insurance Processing"
                      : b.policy.status === "failed"
                        ? "Insurance issuance unsuccessful"
                        : "Travelling without additional protection"}
                </h2>
                {b.plan && (
                  <>
                    <p>
                      {b.plan.name} · {money(b.premium)}
                    </p>
                    {b.policy.status === "issued" ? (
                      <>
                        <p>
                          <b>Policy number: {b.policy.policyNumber}</b>
                        </p>
                        <p>
                          {b.policy.coverage || b.plan.coverage}
                          <br />
                          {b.policy.startDate || b.trip.date} –{" "}
                          {b.policy.endDate || b.trip.date}
                        </p>
                        <button
                          className="outline-btn"
                          onClick={() => download("policy")}
                        >
                          <Download size={17} />
                          Download policy PDF
                        </button>
                      </>
                    ) : (
                      <>
                        <p>
                          Your transport booking is confirmed. Insurance cover
                          is not active until the middleware confirms issuance.
                        </p>
                        <button
                          className="outline-btn"
                          disabled={busy}
                          onClick={retry}
                        >
                          <RefreshCw size={16} />
                          {busy ? "Checking…" : "Retry policy issuance"}
                        </button>
                      </>
                    )}
                  </>
                )}
                <p className="fine-print">
                  All protection is illustrative. No real policy or coverage is
                  provided.
                </p>
              </section>
              <ErrorBox error={error} />
              <Link className="primary" to="/bookings">
                View my bookings <ArrowRight size={18} />
              </Link>
            </div>
            <Summary b={b} />
          </div>
        </>
      )}
    </main>
  );
}
