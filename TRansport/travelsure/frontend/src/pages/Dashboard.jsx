import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Ticket,
  CalendarDays,
  Download,
} from "lucide-react";
import { api, errorMessage, downloadDocument } from "../services/api";
import { useTravel } from "../context/TravelContext";
import { Loading, ErrorBox } from "../components/Layout";
import { money, today } from "../data/travel";
export default function Dashboard() {
  const { user, setAuthOpen, setNotice } = useTravel();
  const [items, setItems] = useState([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [tab, setTab] = useState("Upcoming"),
    [cancelId, setCancelId] = useState(null);
  useEffect(() => {
    if (!user) {
      setBusy(false);
      return;
    }
    setBusy(true);
    api
      .get("/bookings")
      .then((r) => setItems(r.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  }, [user]);
  async function cancel(id) {
    try {
      const { data } = await api.post(`/bookings/${id}/cancel`);
      setItems((v) => v.map((b) => (b.id === id ? data : b)));
      setNotice("Cancellation requested. No refund has been processed.");
      setCancelId(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function download(id, kind) {
    try {
      await downloadDocument(id, kind);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const visible = items.filter((b) =>
    tab === "Drafts"
      ? b.status === "draft"
      : tab === "Cancellation requests"
        ? b.cancellationRequested
        : tab === "Completed"
          ? b.status === "paid" &&
            b.trip.date < today() &&
            !b.cancellationRequested
          : b.status === "paid" &&
            b.trip.date >= today() &&
            !b.cancellationRequested,
  );
  return (
    <main className="page container dashboard">
      <span className="eyebrow">YOUR JOURNEYS, ALL TOGETHER</span>
      <h1>
        {user
          ? `${user.name.split(" ")[0]}, your next story awaits.`
          : "Every journey has a home."}
      </h1>
      <p>Tickets, receipts and protection. All right here.</p>
      {!user ? (
        <div className="empty-state">
          <Ticket size={40} />
          <h2>Sign in to see your journeys.</h2>
          <button className="primary" onClick={() => setAuthOpen(true)}>
            Log in / Create account <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <>
          <div className="dashboard-tabs">
            {["Upcoming", "Completed", "Cancellation requests", "Drafts"].map(
              (t) => (
                <button
                  key={t}
                  className={t === tab ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          <ErrorBox error={error} />
          {busy ? (
            <Loading text="Getting your journeys together…" />
          ) : visible.length ? (
            visible.map((b) => (
              <article className="dashboard-card" key={b.id}>
                <div className="dashboard-card-heading">
                  <span className="eyebrow">
                    {b.trip.type.toUpperCase()} · {b.ticketNumber || "DRAFT"}
                  </span>
                  <span className={`status-pill ${b.policy.status}`}>
                    <ShieldCheck size={13} />
                    {b.policy.status === "pending"
                      ? "Insurance Processing"
                      : b.policy.status === "issued"
                        ? "Demo policy issued"
                        : b.policy.status === "failed"
                          ? "Policy issuance failed"
                          : "No protection"}
                  </span>
                </div>
                <div className="dashboard-card-main">
                  <div>
                    <h2>
                      {b.trip.from} <ArrowRight size={20} /> {b.trip.to}
                    </h2>
                    <p>
                      {b.trip.name} · {b.trip.date} · {b.passengers.length}{" "}
                      traveller(s)
                    </p>
                    <small>{b.passengers.map((p) => p.name).join(", ")}</small>
                  </div>
                  <div>
                    <small>
                      {b.status === "paid" ? "Total paid" : "Payable"}
                    </small>
                    <h2>{money(b.total)}</h2>
                    <small>Including {money(b.premium)} protection</small>
                  </div>
                  <Link
                    className="primary"
                    to={
                      b.status === "draft"
                        ? `/checkout/${b.id}`
                        : `/confirmation/${b.id}`
                    }
                  >
                    {b.status === "draft" ? "Continue booking" : "View booking"}
                    <ArrowRight size={16} />
                  </Link>
                </div>
                {b.status === "paid" && (
                  <div className="dashboard-actions">
                    <button onClick={() => download(b.id, "ticket")}>
                      <Download size={14} />
                      Ticket
                    </button>
                    <button onClick={() => download(b.id, "receipt")}>
                      <Download size={14} />
                      Receipt
                    </button>
                    {b.policy.status === "issued" && (
                      <button onClick={() => download(b.id, "policy")}>
                        <Download size={14} />
                        Policy · {b.policy.policyNumber}
                      </button>
                    )}
                    {b.cancellationRequested ? (
                      <span>Cancellation requested · awaiting review</span>
                    ) : (
                      <button
                        className="cancel-btn"
                        onClick={() => setCancelId(b.id)}
                      >
                        Request cancellation
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <CalendarDays size={38} />
              <h2>
                {tab === "Upcoming"
                  ? "Your next adventure is waiting."
                  : `No ${tab.toLowerCase()} yet.`}
              </h2>
              <p>Find somewhere good to go.</p>
              <Link className="primary" to="/search">
                Explore journeys <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </>
      )}
      {cancelId && (
        <div className="modal-overlay">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
          >
            <h2 id="cancel-title">Request a cancellation?</h2>
            <p>
              This records a request for review. Your demo ticket remains
              confirmed until the request is processed. No refund or policy
              cancellation is automatic.
            </p>
            <div className="button-row">
              <button className="outline-btn" onClick={() => setCancelId(null)}>
                Keep booking
              </button>
              <button className="primary" onClick={() => cancel(cancelId)}>
                Submit request
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
