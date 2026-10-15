import React, { createContext, useContext, useState } from "react";
const Context = createContext(null);
export function TravelProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("travelsure-user"));
    } catch {
      return null;
    }
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [notice, setNotice] = useState("");
  function login(data) {
    localStorage.setItem("travelsure-token", data.token);
    localStorage.setItem("travelsure-user", JSON.stringify(data.user));
    setUser(data.user);
    setAuthOpen(false);
  }
  function logout() {
    localStorage.removeItem("travelsure-token");
    localStorage.removeItem("travelsure-user");
    setUser(null);
  }
  return (
    <Context.Provider
      value={{ user, login, logout, authOpen, setAuthOpen, notice, setNotice }}
    >
      {children}
    </Context.Provider>
  );
}
export const useTravel = () => useContext(Context);
