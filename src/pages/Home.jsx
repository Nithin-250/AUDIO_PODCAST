import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Intro from "../components/Intro";
import WorkGrid from "../components/WorkGrid";
import Capabilities from "../components/Capabilities";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <main>
        <Hero />
        <Intro />
        <WorkGrid />
        <Capabilities />
      </main>
      <Footer />
    </div>
  );
}
