import React, { useEffect } from "react";
import { Routes, Route, useLocation, Link } from "react-router-dom";
import { Header, Footer, AuthModal, Notice } from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import { Reserve, Checkout, Confirmation } from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import Information from "./pages/Information";
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/reserve" element={<Reserve />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/confirmation/:id" element={<Confirmation />} />
        <Route path="/bookings" element={<Dashboard />} />
        {["support", "about", "terms"].map((p) => (
          <Route path={`/${p}`} element={<Information />} key={p} />
        ))}
        <Route
          path="*"
          element={
            <main className="page container empty-state">
              <h1>This road leads somewhere else.</h1>
              <Link className="primary" to="/">
                Back to home
              </Link>
            </main>
          }
        />
      </Routes>
      <Footer />
      <AuthModal />
      <Notice />
    </>
  );
}
