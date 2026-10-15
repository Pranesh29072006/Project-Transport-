import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Headphones,
  Menu,
  X,
  CheckCircle2,
  LogOut,
  LoaderCircle,
} from "lucide-react";
import { useTravel } from "../context/TravelContext";
import { api, errorMessage } from "../services/api";
export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="TravelSure home">
      <span className="logo-symbol">
        t<span>↗</span>
      </span>
      <span>
        travel<span className="logo-sure">sure</span>
        <i>●</i>
      </span>
    </Link>
  );
}
export function Header() {
  const { user, setAuthOpen, logout, setNotice } = useTravel();
  const [menu, setMenu] = useState(false);
  return (
    <>
      <div className="announcement">
        <span>A little wanderlust. A lot of possibilities.</span>
        <span>
          Plan your next escape <ArrowUpRight size={13} />
        </span>
      </div>
      <header className="header">
        <div className="container nav">
          <Logo />
          <nav className={menu ? "nav-links open" : "nav-links"}>
            <NavLink to="/" onClick={() => setMenu(false)}>
              Explore
            </NavLink>
            <NavLink to="/bookings" onClick={() => setMenu(false)}>
              My bookings
            </NavLink>
            <NavLink to="/support" onClick={() => setMenu(false)}>
              <Headphones size={16} /> Help & support
            </NavLink>
          </nav>
          <div className="nav-right">
            <span className="currency">
              INR <ChevronDown size={13} />
            </span>
            {user ? (
              <button
                className="login-btn"
                onClick={() => {
                  logout();
                  setNotice("You have been signed out.");
                }}
              >
                {user.name.split(" ")[0]} <LogOut size={15} />
              </button>
            ) : (
              <button className="login-btn" onClick={() => setAuthOpen(true)}>
                Log in / Sign up <ArrowUpRight size={15} />
              </button>
            )}
            <button
              className="mobile-menu icon-btn"
              aria-label="Toggle navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="container footer-top">
        <div>
          <Logo />
          <p>
            More journeys. More stories.
            <br />A little more peace of mind.
          </p>
        </div>
        <div>
          <h4>GO SOMEWHERE GOOD</h4>
          <Link to="/search?type=bus">Bus journeys</Link>
          <Link to="/search?type=train">Train journeys</Link>
          <Link to="/search?type=flight">Flights</Link>
        </div>
        <div>
          <h4>HERE FOR YOUR JOURNEY</h4>
          <Link to="/bookings">My bookings</Link>
          <Link to="/support">Help & support</Link>
          <Link to="/about">About TravelSure</Link>
        </div>
        <div className="footer-note">
          <ShieldCheck size={25} />
          <h4>Your journey. Your choice.</h4>
          <p>
            Optional protection, clearly explained.
            <br />
            Always in your hands.
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} TravelSure. Made for the way you travel.
        </span>
        <span>
          Demo bookings & illustrative insurance ·{" "}
          <Link to="/terms">Terms & privacy</Link>
        </span>
      </div>
    </footer>
  );
}
export function AuthModal() {
  const { authOpen, setAuthOpen, login } = useTravel();
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (authOpen) ref.current?.focus();
  }, [authOpen]);
  if (!authOpen) return null;
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      login(
        (await api.post(`/auth/${register ? "register" : "login"}`, values))
          .data,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-overlay" onClick={() => setAuthOpen(false)}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAuthOpen(false);
        }}
      >
        <button
          className="modal-close icon-btn"
          aria-label="Close"
          onClick={() => setAuthOpen(false)}
        >
          <X />
        </button>
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2 id="auth-title">
          {register ? "Hello, new adventures." : "Welcome back, traveller."}
        </h2>
        <p>Keep your journeys and protection in one place.</p>
        <form onSubmit={submit}>
          {register && (
            <label>
              Full name
              <input name="name" required maxLength={80} autoComplete="name" />
            </label>
          )}
          <label>
            Email address
            <input
              ref={ref}
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={register ? "new-password" : "current-password"}
            />
          </label>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          <button className="primary wide" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" />
            ) : register ? (
              "Create account"
            ) : (
              "Log in"
            )}
            <ArrowRight size={18} />
          </button>
        </form>
        <button
          className="text-btn"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register
            ? "Already have an account? Log in"
            : "New here? Create an account"}
        </button>
        <small>
          Demo platform. Use a test account and fictional passenger details.
        </small>
      </section>
    </div>
  );
}
export function Notice() {
  const { notice, setNotice } = useTravel();
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 5000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  return notice ? (
    <div className="toast" role="status">
      <CheckCircle2 size={19} />
      {notice}
      <button onClick={() => setNotice("")} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  ) : null;
}
export function Loading({ text = "Finding your next journey…" }) {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={30} />
      <p>{text}</p>
    </div>
  );
}
export function ErrorBox({ error }) {
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}
