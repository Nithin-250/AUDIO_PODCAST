import React from "react";

export default function Capabilities() {
  return (
    <section className="border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-12 gap-6">
        <div className="md:col-span-4 text-sm uppercase tracking-wider text-black/50">Capabilities</div>
        <div className="md:col-span-8 grid md:grid-cols-2 gap-6 text-black/80">
          <div>
            <div className="font-medium">Summarization</div>
            <p className="text-black/70">Concise AI summaries with controllable tone and length.</p>
          </div>
          <div>
            <div className="font-medium">Voices</div>
            <p className="text-black/70">System voice selection per language. Smooth playback controls.</p>
          </div>
          <div>
            <div className="font-medium">Performance</div>
            <p className="text-black/70">Fast start, minimal layout shift, responsive.</p>
          </div>
          <div>
            <div className="font-medium">Extensible</div>
            <p className="text-black/70">Modular components and clean styles for easy iteration.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
