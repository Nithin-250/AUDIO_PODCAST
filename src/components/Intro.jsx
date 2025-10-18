import React from "react";

export default function Intro() {
  return (
    <section className="border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-4 text-sm uppercase tracking-wider text-black/50">About</div>
        <div className="md:col-span-8 text-black/80 leading-relaxed">
          Talkify distills long-form reading into a succinct, spoken brief.
          Built with care for typography, motion, and pace.
        </div>
      </div>
    </section>
  );
}
