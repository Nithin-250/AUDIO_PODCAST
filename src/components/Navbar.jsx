import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight text-lg">Talkify</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/" className={pathname === "/" ? "opacity-100" : "opacity-60 hover:opacity-100 transition"}>Home</Link>
          <Link to="/tool" className={pathname.startsWith("/tool") ? "opacity-100" : "opacity-60 hover:opacity-100 transition"}>Tool</Link>
        </nav>
      </div>
    </header>
  );
}
