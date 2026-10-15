import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Ticket,
  Headphones,
  Star,
  Check,
  Compass,
  MoveRight,
} from "lucide-react";
import SearchForm from "../components/SearchForm";
import { routes, image, defaultSearch, money } from "../data/travel";
import { useTravel } from "../context/TravelContext";
export default function Home() {
  const navigate = useNavigate();
  const { setNotice } = useTravel();
  function pickRoute(route) {
    navigate(
      "/search?" +
        new URLSearchParams({
          ...defaultSearch(),
          from: route.from,
          to: route.to,
        }),
    );
  }
  return (
    <>
      <section className="hero">
        <div className="hero-landscape" />
        <div className="hero-shade" />
        <div className="container hero-content">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span /> THE JOURNEY IS PART OF THE STORY
            </div>
            <h1>
              Go somewhere <em>good.</em>
            </h1>
            <p>
              Big adventures. Quick escapes. The way home.
              <br />
              Find your next journey, all in one place.
            </p>
            <div className="hero-proof">
              <span className="avatar-stack">
                <img
                  src={image("photo-1500648767791-00dcc994a43e", 80)}
                  alt=""
                />
                <img
                  src={image("photo-1534528741775-53994a69daeb", 80)}
                  alt=""
                />
                <img
                  src={image("photo-1506794778202-cad84cf45f1d", 80)}
                  alt=""
                />
              </span>
              <span>
                <b>Made for every kind of traveller</b>
                <small>
                  <Star size={11} fill="currentColor" /> Thoughtful journeys,
                  from start to finish
                </small>
              </span>
            </div>
          </div>
          <div className="hero-caption">
            <span className="location-dot" /> SOMEWHERE WORTH THE JOURNEY{" "}
            <span>TAKE A DIFFERENT VIEW</span>
          </div>
        </div>
      </section>
      <div className="container search-overlap">
        <SearchForm />
      </div>
      <section className="trust-strip container">
        <span>
          <Check size={16} /> Five ways to get there
        </span>
        <i />
        <span>
          <ShieldCheck size={17} /> Protection when you want it
        </span>
        <i />
        <span>
          <Ticket size={17} /> One simple checkout
        </span>
        <i />
        <span>
          <Headphones size={17} /> Here to help, all the way
        </span>
      </section>
      <section className="section container routes-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A LITTLE INSPIRATION</span>
            <h2>Your next escape is closer than you think.</h2>
            <p>Favourite routes. Fresh perspectives. Where will you go?</p>
          </div>
          <Link className="outline-btn" to="/search">
            Explore all routes <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="route-grid">
          {routes.map((route, i) => (
            <button
              className="route-card"
              key={route.to}
              onClick={() => pickRoute(route)}
            >
              <div className="route-photo">
                <img
                  src={image(route.image, 800)}
                  alt={`${route.to} destination scenery`}
                />
                <span className="route-tag">{route.tag}</span>
                <span className="photo-arrow">
                  <ArrowUpRight size={22} />
                </span>
                <h3>
                  {route.to}
                  <span>0{i + 1}</span>
                </h3>
              </div>
              <div className="route-card-bottom">
                <div>
                  <b>
                    {route.from} <MoveRight size={14} /> {route.to}
                  </b>
                  <p>{route.description}</p>
                </div>
                <div>
                  <small>Demo fares from</small>
                  <strong>{money(route.price)}</strong>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="section offers-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                GOOD JOURNEYS. BETTER LITTLE EXTRAS.
              </span>
              <h2>A little more reason to go.</h2>
            </div>
            <span className="muted-small">
              Thoughtfully put together, for you.
            </span>
          </div>
          <div className="offers-grid">
            <article className="offer-card first">
              <span className="offer-icon">
                <Ticket />
              </span>
              <div>
                <small>YOUR FIRST ADVENTURE</small>
                <h3>New here? Hello, savings.</h3>
                <p>Explore great demo fares for your first journey.</p>
                <button
                  onClick={() => {
                    setNotice(
                      "WELCOME is copied. Demo offers are illustrative; checkout prices are shown before payment.",
                    );
                    navigator.clipboard?.writeText("WELCOME").catch(() => {});
                  }}
                >
                  WELCOME{" "}
                  <span>
                    Copy code <ArrowUpRight size={14} />
                  </span>
                </button>
              </div>
              <span className="offer-decoration">↗</span>
            </article>
            <article className="offer-card second">
              <span className="offer-icon">
                <ShieldCheck />
              </span>
              <div>
                <small>PEACE OF MIND, ON BOARD</small>
                <h3>Small extra. Big reassurance.</h3>
                <p>Explore optional journey protection from ₹10.</p>
                <Link to="/about">
                  Meet your travel protection <ArrowRight size={16} />
                </Link>
              </div>
              <span className="shield-decoration">
                <ShieldCheck size={100} strokeWidth={1} />
              </span>
            </article>
          </div>
        </div>
      </section>
      <section className="section container why-section">
        <div className="why-intro">
          <span className="eyebrow">LESS FRICTION. MORE EXPLORING.</span>
          <h2>
            Every great journey
            <br />
            starts with a little trust.
          </h2>
          <p>
            We bring the essentials together, so you can focus on what’s waiting
            at the other end.
          </p>
          <Link to="/about">
            Get to know TravelSure <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="why-grid">
          {[
            {
              Icon: Compass,
              title: "Your kind of journey",
              text: "Bus, train, flight, cab or a car of your own. All the ways to get away.",
            },
            {
              Icon: ShieldCheck,
              title: "Protection, on your terms",
              text: "Optional insurance. Clear cover. No preselected plans or surprises.",
            },
            {
              Icon: Ticket,
              title: "One booking. All sorted.",
              text: "Your journey and protection, together in one simple checkout.",
            },
            {
              Icon: Headphones,
              title: "A little help goes a long way",
              text: "Easy access to your bookings and support when you need a hand.",
            },
          ].map(({ Icon, title, text }) => (
            <article key={title}>
              <span>
                <Icon size={23} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="container journal-banner">
        <div>
          <span className="eyebrow">TAKE THE SCENIC ROUTE</span>
          <h2>
            The best stories start
            <br />
            with “let’s go.”
          </h2>
          <p>Your next one is waiting.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            window.scrollTo({ top: 300, behavior: "smooth" });
            document.querySelector("select")?.focus();
          }}
        >
          Find your journey <ArrowUpRight size={18} />
        </button>
        <div className="journal-lines" />
      </section>
      <section className="container demo-disclaimer">
        <span>THE HONEST LITTLE FOOTNOTE</span>
        <p>
          TravelSure is a demonstration transport merchant. Schedules,
          availability, payments and insurance are simulated. We are not an
          insurer, and these bookings are not valid for travel.
        </p>
      </section>
    </>
  );
}
