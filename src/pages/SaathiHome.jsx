import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CustomCursor from "../components/CustomCursor";

export default function SaathiHome() {
  const [news, setNews] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loc, setLoc] = useState({ lat: 28.6139, lon: 77.2090, label: "New Delhi" });
  const [loading, setLoading] = useState({ news: true, weather: true });
  const [theme, setTheme] = useState('dark');
  const heroRef = useRef(null);
  const navigate = useNavigate();
  // Other native APIs
  const [net, setNet] = useState(() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    return c ? { type: c.effectiveType, downlink: c.downlink } : { type: navigator.onLine ? 'online' : 'offline', downlink: null };
  });
  const [battery, setBattery] = useState(null);
  const [visible, setVisible] = useState(document.visibilityState || 'visible');
  const [intro, setIntro] = useState(true);

  // Capability flags for native APIs we use instead of Notifications
  const supportsShare = typeof navigator !== 'undefined' && !!navigator.share;
  const supportsClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard;
  const supportsSpeech = typeof window !== 'undefined' && !!window.speechSynthesis;

  // Apply theme to <html> for Tailwind dark mode
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    try { localStorage.setItem('theme', 'dark'); } catch {}
  }, [theme]);

  // Get geolocation (fallback to Delhi)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLoc((l) => ({ ...l, lat, lon, label: "Your Location" }));
        },
        () => {
          // keep default
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Opening animation overlay
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 900);
    return () => clearTimeout(t);
  }, []);

  // Network Information API
  useEffect(() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    function onConn() {
      setNet({ type: c?.effectiveType || (navigator.onLine ? 'online' : 'offline'), downlink: c?.downlink ?? null });
    }
    if (c) {
      c.addEventListener('change', onConn);
      onConn();
      return () => c.removeEventListener('change', onConn);
    } else {
      const online = () => setNet({ type: 'online', downlink: null });
      const offline = () => setNet({ type: 'offline', downlink: null });
      window.addEventListener('online', online);
      window.addEventListener('offline', offline);
      return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
    }
  }, []);

  // Battery Status API (where supported)
  useEffect(() => {
    let batt;
    async function load() {
      try {
        if ('getBattery' in navigator) {
          batt = await navigator.getBattery();
          const set = () => setBattery({ level: batt.level, charging: batt.charging });
          set();
          batt.addEventListener('levelchange', set);
          batt.addEventListener('chargingchange', set);
        }
      } catch {}
    }
    load();
    return () => {
      try {
        if (batt) {
          batt.removeEventListener('levelchange', () => {});
          batt.removeEventListener('chargingchange', () => {});
        }
      } catch {}
    };
  }, []);

  // Page Visibility API
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Fetch weather from Open-Meteo (no API key)
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading((s) => ({ ...s, weather: true }));
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        setWeather({
          temp: data?.current_weather?.temperature,
          wind: data?.current_weather?.windspeed,
          code: data?.current_weather?.weathercode,
        });
      } catch (e) {
        // ignore
      } finally {
        setLoading((s) => ({ ...s, weather: false }));
      }
    };
    run();
    return () => controller.abort();
  }, [loc.lat, loc.lon]);

  // Fetch top news (no key) from Reddit r/news
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading((s) => ({ ...s, news: true }));
        const res = await fetch("https://www.reddit.com/r/news/top.json?limit=6&t=day", { signal: controller.signal });
        const json = await res.json();
        const items = (json?.data?.children || []).map((c) => {
          // Prefer preview images; fallback to thumbnail; sanitize URLs
          const preview = c.data?.preview?.images?.[0];
          const src = preview?.source?.url || preview?.resolutions?.slice(-1)?.[0]?.url || c.data?.thumbnail;
          const safeUrl = typeof src === 'string' ? src.replace(/&amp;/g, '&') : null;
          return {
          id: c.data.id,
          title: c.data.title,
          url: `https://www.reddit.com${c.data.permalink}`,
          thumb: safeUrl && safeUrl.startsWith('http') ? safeUrl : null,
        };
        });
        setNews(items);

        // Web Audio API small chime (kept)
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 660;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          o.start(); o.stop(ctx.currentTime + 0.28);
          setTimeout(() => ctx.close(), 400);
        } catch {}
      } catch (e) {
        // ignore
      } finally {
        setLoading((s) => ({ ...s, news: false }));
      }
    };
    run();
    return () => controller.abort();
  }, []);
  return (
    <div className="relative min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-x-clip">
      {intro && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed inset-0 z-[60] bg-white dark:bg-slate-950"
        />
      )}
      {/* Background image + gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: "url(/talkify-bg.svg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(18px) saturate(120%)",
          transform: "scale(1.05)",
        }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-950" />
      <CustomCursor />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/talkify-logo.svg" alt="Talkify" className="h-8 w-auto" />
            <span className="sr-only">Talkify</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:underline underline-offset-4">Features</a>
            <a href="#how" className="hover:text-slate-100">How it works</a>
            <a href="#updates" className="hover:text-slate-100">Updates</a>
            <button
              type="button"
              onClick={() => navigate('/tool')}
              className="pointer-events-auto inline-flex items-center px-3 py-1.5 rounded-md border border-white/20 bg-white/10 text-slate-100 hover:bg-white/20 transition"
            >
              Open Tool
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-slate-800">
        {/* Hero-only background image (studies theme) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: "url(/studies-hero.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-white/70 via-white/60 to-white/80 dark:from-slate-950/70 dark:via-slate-950/60 dark:to-slate-950/80" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid md:grid-cols-12 gap-8 items-center min-h-[70vh]">
          {/* Centered brand */}
          <div className="md:col-span-12 flex justify-center -mt-6 md:-mt-8 mb-2">
            <img src="/talkify-wordmark.svg" alt="Talkify – Text to Speech" className="h-16 md:h-20 w-auto drop-shadow" />
          </div>
          <motion.div
            className="md:col-span-7 relative p-6 rounded-2xl bg-white/70 dark:bg-white/[0.06] backdrop-blur border border-white/40 dark:border-white/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            {/* gradient halo behind content for better contrast in dark mode */}
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-fuchsia-500/20 via-purple-500/20 to-amber-400/20 dark:from-fuchsia-500/35 dark:via-purple-600/35 dark:to-amber-400/35 blur-xl"
            />
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              Create AI Podcasts and Voiceovers in Minutes
            </h1>
            <p className="mt-5 text-slate-600 dark:text-slate-300 max-w-xl">
              Talkify helps you turn ideas into rich audio content. Generate scripts, pick realistic voices, and export podcast-ready audio—no studio needed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 md:gap-4">
              <button onClick={() => navigate('/tool')} className="inline-flex items-center px-6 py-3 rounded-md bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 text-white shadow hover:brightness-110 transition">
                Start Creating
              </button>
              <a href="#features" className="inline-flex items-center px-5 py-3 rounded-md text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow hover:brightness-110 transition">
                Explore Features
              </a>
              <a href="#how" className="inline-flex items-center px-5 py-3 rounded-md text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow hover:brightness-110 transition">How it works</a>
            </div>
          </motion.div>
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div ref={heroRef} className="relative rounded-2xl p-[2px] bg-gradient-to-tr from-fuchsia-400 via-amber-300 to-sky-400 shadow-xl transition-transform hover:-translate-y-1">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/70 dark:bg-white/[0.06] backdrop-blur-md border border-white/40 dark:border-white/10">
                <img
                  src="/talkify-hero.svg"
                  alt="Talkify – Your Smartest, Friendliest Chat Companion"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-700/30 via-fuchsia-500/20 to-amber-400/20 dark:from-purple-700/20 dark:via-fuchsia-500/15 dark:to-amber-400/15" />
                {/* top highlight */}
                <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-white/20 blur-2xl" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200/60 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800/60">
        <motion.div
          className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="text-2xl font-semibold">100+</div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Episodes Generated</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">20+</div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Voices</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">10+</div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Languages</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">4.7/5</div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Avg. Rating</div>
          </div>
        </motion.div>
      </section>

      {/* Features (dark cards with yellow icons, 2x2 grid) */}
      <section id="features" className="relative border-b border-slate-800">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[#0F1115]" />
        <div className="max-w-6xl mx-auto px-6 py-16 text-slate-100">
          <motion.h2 className="text-2xl font-medium" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>Key features</motion.h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { title: 'Summaries', desc: 'Concise overviews generated from any article.', icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5C84B" strokeWidth="2"><rect x="4" y="4" width="16" height="14" rx="3"/><path d="M8 8h8M8 12h6"/></svg>
              )},
              { title: 'Keyless Translate', desc: 'Reliable Tamil/Hindi translation without API keys.', icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5C84B" strokeWidth="2"><path d="M4 5h8v6H4z"/><path d="M12 9h8v10h-8z"/><path d="M8 8l2-3"/></svg>
              )},
              { title: 'Multilingual TTS', desc: 'Natural playback in English, Tamil, and Hindi.', icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5C84B" strokeWidth="2"><path d="M3 10v4h4l5 5V5L7 10H3z"/><path d="M17 8v8"/></svg>
              )},
              { title: 'Export & Share', desc: 'MP3/WAV export and easy sharing.', icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5C84B" strokeWidth="2"><path d="M5 20h14"/><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/></svg>
              )},
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.05 }}
              >
                <div className="rounded-2xl bg-gradient-to-br from-[#171A20] to-[#14171C] border border-[#262A33] shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#1E222A] flex items-center justify-center ring-1 ring-[#2F3541]">
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold tracking-wide text-slate-100">{c.title}</div>
                    <div className="mt-1 text-[13px] text-slate-300 leading-relaxed">{c.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works (flat white cards with orange icons) */}
      <section id="how" className="border-b border-slate-200/60">
        <div className="relative">
          <div className="absolute inset-0 top-10 h-[58%] bg-teal-200/70 -z-10" />
          <div className="max-w-6xl mx-auto px-6 py-16">
            <motion.h2 className="text-2xl font-medium" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>How it works</motion.h2>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { k: 'step1', title: 'Paste URL', desc: 'Provide any public link to get started.', icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v2H3V4zm0 4h12v2H3V8zm0 4h18v2H3v-2zm0 4h12v2H3v-2z"/></svg>) },
                { k: 'step2', title: 'Generate', desc: 'We extract and summarize for you.', icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z"/></svg>) },
                { k: 'step3', title: 'Choose Voice', desc: 'Play in English, Tamil, or Hindi.', icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>) },
                { k: 'step4', title: 'Export', desc: 'Copy notes or export audio.', icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM12 2L8 6h3v8h2V6h3l-4-4z"/></svg>) },
              ].map((s, i) => (
                <motion.div key={s.k} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.04 }}>
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col min-h-[220px]">
                    <div className="h-12 w-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">{s.icon}</div>
                    <div className="mt-3 text-left text-[11px] font-semibold tracking-wider text-slate-500">{`${i+1}. ${s.title}`.toUpperCase()}</div>
                    <div className="mt-1 text-left text-base font-semibold text-slate-900">{i===0? 'Turn ideas into scripts' : i===1? 'Choose your voices' : i===2? 'Publish faster' : 'Publish faster'}</div>
                    <div className="mt-1 text-left text-sm text-slate-600 leading-relaxed">{s.desc}</div>
                    <div className="mt-auto pt-4 text-left text-xs font-bold tracking-widest text-slate-700 cursor-pointer">MORE</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Updates */}
      <section id="updates" className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.h2 className="text-2xl font-medium text-slate-100" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>Latest Updates</motion.h2>

          {/* Weather / System / Preferences – dark, modern cards */}
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {/* Weather */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#171A20] to-[#14171C] border border-[#262A33] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#F5C84B]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5C84B" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
                Weather
              </div>
              <div className="mt-3 text-slate-100 text-sm min-h-[72px]">
                {loading.weather ? (
                  <span className="text-slate-400">Loading current weather…</span>
                ) : weather ? (
                  <>
                    <div className="text-lg font-semibold">{loc.label}</div>
                    <div className="mt-1 text-slate-300">Temp: <b>{weather.temp}°C</b> • Wind: <b>{weather.wind} km/h</b></div>
                  </>
                ) : (
                  <span className="text-slate-400">Weather unavailable.</span>
                )}
              </div>
            </div>

            {/* System & Device */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#171A20] to-[#14171C] border border-[#262A33] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#C084FC]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="2"><rect x="3" y="6" width="13" height="12" rx="2"/><rect x="18" y="8" width="3" height="8" rx="1"/></svg>
                System & Device
              </div>
              <div className="mt-3 text-slate-100 text-sm grid gap-2">
                <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded-md bg-[#1E222A] text-[11px] text-slate-300">{net.type}</span>{net.downlink ? <span className="text-slate-300">• {net.downlink}Mbps</span> : null}</div>
                <div className="text-slate-300">Battery: <b>{battery ? Math.round(battery.level * 100) + '%' : 'n/a'}</b>{battery?.charging ? ' • Charging' : ''}</div>
                <div className="text-slate-300">Visibility: <b>{visible}</b></div>
                {/* battery bar */}
                <div className="mt-1 h-2 w-full rounded-md bg-[#1E222A] overflow-hidden">
                  <div className="h-full bg-[#22c55e]" style={{ width: `${battery ? Math.round(battery.level * 100) : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    className="px-3 py-2 rounded-md bg-[#F5C84B] text-black hover:brightness-110 transition"
                    onClick={() => { try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch {} }}
                  >Vibrate</button>
                  <button
                    className="px-3 py-2 rounded-md bg-[#ef4444] text-white hover:brightness-110 transition"
                    onClick={async () => {
                      try {
                        const el = heroRef.current;
                        if (!document.fullscreenElement && el?.requestFullscreen) await el.requestFullscreen();
                        else if (document.exitFullscreen) await document.exitFullscreen();
                      } catch {}
                    }}
                  >Toggle Fullscreen</button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#171A20] to-[#14171C] border border-[#262A33] shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#60A5FA]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><circle cx="12" cy="12" r="8"/><path d="M12 6v6l4 2"/></svg>
                Preferences
              </div>
              <div className="mt-3 text-slate-100 text-sm">
                <div>Theme: <b>dark</b></div>
                <div className="mt-1">Location: <b>{loc.label}</b></div>
                <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-slate-300">
                  {['Network', 'Battery', 'Visibility', 'Vibration', 'Fullscreen'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-[#1E222A] border border-[#2F3541]">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* News cards (dark, modern) */}
          <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {loading.news && (
              <div className="text-sm text-slate-400">Loading top news…</div>
            )}
            {!loading.news && news.length === 0 && (
              <div className="text-sm text-slate-400">No news available right now.</div>
            )}
            {news.map((n, idx) => (
              <motion.a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl overflow-hidden block bg-gradient-to-br from-[#151821] to-[#12151C] border border-[#262A33] shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="relative aspect-[16/9] bg-[#1E222A]">
                  <img src={n.thumb || "/news-placeholder.svg"} alt="News" className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100 transition" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-4">
                  <div className="text-[13px] font-semibold text-slate-100 leading-snug group-hover:text-white transition line-clamp-3">{n.title}</div>
                  <div className="mt-1 text-[11px] text-slate-400">Source: Reddit r/news</div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-slate-500 flex items-center justify-between">
          <div>© 2025 Talkify.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-700">Terms</a>
            <a href="#" className="hover:text-slate-700">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
