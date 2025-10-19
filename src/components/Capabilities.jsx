import React from "react";

export default function Capabilities() {
  const tiles = [
    { key: "discover", label: "Discover", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
    )},
    { key: "translate", label: "Translate", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 5h8v6H4z"/><path d="M12 9h8v10h-8z"/><path d="M8 8l2-3"/></svg>
    )},
    { key: "listen", label: "Listen", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M17 8v8"/></svg>
    )},
    { key: "share", label: "Share", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12v8h16v-8"/><path d="M12 16V4"/><path d="M8 8l4-4 4 4"/></svg>
    )},
    { key: "responsive", label: "Responsive", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="13" height="12" rx="2"/><rect x="18" y="8" width="3" height="8" rx="1"/></svg>
    )},
    { key: "export", label: "Export Audio", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 20h14"/><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/></svg>
    )},
    { key: "simple", label: "Simple UI", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="5" width="16" height="12" rx="2"/><path d="M4 9h16"/></svg>
    )},
    { key: "extensible", label: "Extensible", icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2l4 4h-3v6h-2V6H8l4-4z"/><path d="M8 16l4 4 4-4h-3v-6h-2v6H8z"/></svg>
    )},
  ];

  return (
    <section className="border-b border-black/10 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-semibold">Key features</h2>
        <p className="mt-1 text-sm text-black/60">A clean set of tools to read, listen, and share.</p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map((t, i) => (
            <div key={t.key} className={`card-appear${i===1?' card-appear-2':i===2?' card-appear-3':''}`}>
              <div className="w-full h-full bg-white rounded-xl border border-black/10 shadow-sm hover:shadow-md transition focus-ring p-5 text-left group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-black/5 text-black/70 flex items-center justify-center">
                    {t.icon}
                  </div>
                  <div className="text-sm font-medium text-black/80">{t.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
