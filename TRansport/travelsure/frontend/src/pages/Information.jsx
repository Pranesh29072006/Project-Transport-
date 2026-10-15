import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ShieldCheck, Mail, Headphones } from "lucide-react";
export default function Information() {
  const { pathname } = useLocation();
  return (
    <main className="page container information">
      <span className="eyebrow">HERE FOR YOUR JOURNEY</span>
      {pathname === "/support" ? (
        <>
          <h1>A little help goes a long way.</h1>
          <p>Your journeys should feel simple. Start with the answers below.</p>
          <div className="white-card">
            <Headphones size={32} />
            <h2>How can we help?</h2>
            {[
              [
                "Where is my ticket?",
                "Open My bookings, choose View booking, then Download ticket. A PDF is available after verified demo payment.",
              ],
              [
                "Why is my insurance processing?",
                "Your transport ticket is confirmed, but the middleware has not confirmed policy issuance. Check its status or retry from your confirmation page. Protection is not active while pending.",
              ],
              [
                "How do I cancel?",
                "Open My bookings and choose Request cancellation. This records a request only; no refund or insurance cancellation is automatically processed.",
              ],
              [
                "Is this real availability?",
                "No. All journeys, seats, payments, drivers and insurance policies are simulated. No IRCTC, airline or bus operator connection is used.",
              ],
              [
                "What if payment fails?",
                "Your booking remains a draft. Turn off Simulate payment decline in the checkout demo options and retry. Repeated payments on a paid booking do not charge again.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <Link className="primary" to="/bookings">
            Open my bookings <ArrowRight size={18} />
          </Link>
        </>
      ) : pathname === "/terms" ? (
        <>
          <h1>Clear terms. No surprises.</h1>
          <section className="white-card">
            <h2>Demonstration use</h2>
            <p>
              TravelSure is a functional prototype. All transport schedules,
              availability, payments and insurance are simulated. Documents are
              marked DEMO and are not valid for travel or claims.
            </p>
            <h2>Optional insurance</h2>
            <p>
              TravelSure is an independent transport merchant, not an insurer.
              Insurance is never preselected. Quotes, limits, exclusions,
              consent records and issuance are supplied by a separate mock or
              external middleware service. No cover is active until issuance is
              confirmed. The illustrative mock service provides no real
              protection.
            </p>
            <h2>Payments and cancellation</h2>
            <p>
              The merchant server calculates the fare, booking fee and selected
              protection as one total. Payment methods are simulated. A
              cancellation request does not automatically cancel transport,
              cancel protection, or issue a refund.
            </p>
            <h2>Privacy</h2>
            <p>
              Use fictional details. Account email, salted password hash,
              passenger details, explicit consent, payment records and bookings
              are stored in a local SQLite database. Session tokens are stored
              in your browser. This prototype has no account deletion interface;
              an operator can reset the local database after stopping the
              services. Do not enter real card or bank information.
            </p>
          </section>
        </>
      ) : (
        <>
          <h1>Made for the way you travel.</h1>
          <p className="lead">
            Big adventures. Quick escapes. The way home.
            <br />
            Five ways to get there, with everything together.
          </p>
          <section className="white-card">
            <ShieldCheck size={35} />
            <h2>Your journey. Your choice.</h2>
            <p>
              TravelSure brings bus, train, flight, cab and car rental journeys
              into one experience. Optional insurance is provided through an
              independent middleware integration, inside the same checkout.
            </p>
            <p>
              You choose a plan, review the cover and explicitly consent. One
              combined demo payment covers your fare and optional premium. Your
              policy status stays visible with your ticket, even if issuance is
              still processing.
            </p>
            <p>
              TravelSure does not underwrite insurance, calculate production
              premiums or generate real policies. The demo adapter is kept
              separate, ready to be replaced by your middleware platform.
            </p>
          </section>
          <Link className="primary" to="/search">
            Find your next journey <ArrowRight size={18} />
          </Link>
        </>
      )}
    </main>
  );
}
