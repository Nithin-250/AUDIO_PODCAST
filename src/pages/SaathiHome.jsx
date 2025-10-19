import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CustomCursor from "../components/CustomCursor";

export default function SaathiHome() {
  const [news, setNews] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loc, setLoc] = useState({ lat: 28.6139, lon: 77.2090, label: "New Delhi" });
  const [loading, setLoading] = useState({ news: true, weather: true });
  const [theme, setTheme] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light');
  const heroRef = useRef(null);
  const navigate = useNavigate();
  // Other native APIs
  const [net, setNet] = useState(() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    return c ? { type: c.effectiveType, downlink: c.downlink } : { type: navigator.onLine ? 'online' : 'offline', downlink: null };
  });
  const [battery, setBattery] = useState(null);
  const [visible, setVisible] = useState(document.visibilityState || 'visible');

  // Capability flags for native APIs we use instead of Notifications
  const supportsShare = typeof navigator !== 'undefined' && !!navigator.share;
  const supportsClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard;
  const supportsSpeech = typeof window !== 'undefined' && !!window.speechSynthesis;

  // Apply theme to <html> for Tailwind dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
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
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-white/85 via-white/70 to-white dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-950" />
      <CustomCursor />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/talkify-logo.svg" alt="Talkify" className="h-8 w-auto" />
            <span className="sr-only">Talkify</span>
          </div>
          {/* Mobile theme toggle */}
          <div className="sm:hidden">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300/60 dark:border-slate-600/60 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-700 dark:text-slate-300">
            <a href="#features" className="text-slate-900 dark:text-slate-300 hover:underline underline-offset-4">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#updates" className="hover:text-slate-900">Updates</a>
            <button
              type="button"
              onClick={() => navigate('/tool')}
              className="pointer-events-auto inline-flex items-center px-3 py-1.5 rounded-md border border-white/50 dark:border-white/20 bg-white/60 dark:bg-white/10 text-slate-900 dark:text-slate-100 hover:bg-white/80 dark:hover:bg-white/20 transition"
            >
              Open Tool
            </button>
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="ml-2 inline-flex items-center px-3 py-1.5 rounded-md border border-slate-300/60 dark:border-slate-600/60 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-slate-200/60 dark:border-slate-800/60">
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

      {/* Features */}
      <section id="features" className="relative border-b border-slate-200/60 dark:border-slate-800/60">
        {/* subtle strip to lift cards in light mode */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-white to-white/90 dark:from-transparent dark:via-transparent dark:to-transparent" />
        <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.h2 className="text-2xl font-medium" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>Key Features</motion.h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <motion.div
              className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg cursor-pointer bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600"
              initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.45 }}
              whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs uppercase tracking-wider opacity-90">AI Scriptwriting</div>
              <p className="mt-2 text-sm text-white/95">Generate podcast outlines and full scripts from a topic or brief.</p>
              <div aria-hidden className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 translate-x-6 translate-y-6 rounded-full bg-white/20 blur-2xl" />
            </motion.div>
            <motion.div
              className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg cursor-pointer bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600"
              initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs uppercase tracking-wider opacity-90">Realistic TTS Voices</div>
              <p className="mt-2 text-sm text-white/95">Choose natural voices with emotion, pacing control, and multi-speaker dialogs.</p>
              <div aria-hidden className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute top-0 left-0 h-16 w-16 -translate-x-6 -translate-y-6 rounded-full bg-white/20 blur-2xl" />
            </motion.div>
            <motion.div
              className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg cursor-pointer bg-gradient-to-br from-lime-500 via-green-500 to-emerald-600"
              initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.99 }}
            >
              <div className="text-xs uppercase tracking-wider opacity-90">Export & Share</div>
              <p className="mt-2 text-sm text-white/95">Export as MP3/WAV, auto-generate show notes, and publish faster.</p>
              <div aria-hidden className="absolute top-1/2 -translate-y-1/2 right-[-32px] h-40 w-40 rotate-12 rounded-full bg-white/15 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-16 w-24 rounded-full bg-white/20 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 py-16 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur">
          <motion.h2 className="text-2xl font-medium" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>How it works</motion.h2>
          <motion.div
            className="mt-8 grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          >
            {/* Step 1 - Draft (Indigo/Purple) */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 40, rotate: -2 }, show: { opacity: 1, y: 0, rotate: 0 } }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              className="relative rounded-2xl p-6 text-white overflow-hidden group shadow-lg"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600" />
              <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="text-xs uppercase tracking-wider opacity-90">1. Draft</div>
              <div className="mt-2 text-lg font-semibold">Turn ideas into scripts</div>
              <p className="mt-1 text-white/90 text-sm">Enter a topic or paste notes. Let AI outline, expand, and refine.</p>
              <div className="mt-4 inline-flex items-center text-xs opacity-90 group-hover:opacity-100 transition">✍️ AI Script Assistant</div>
            </motion.div>

            {/* Step 2 - Voice (Emerald/Teal) */}
            <motion.div
              variants={{ hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1 } }}
              transition={{ type: "spring", stiffness: 140, damping: 16 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              className="relative rounded-2xl p-6 text-white overflow-hidden group shadow-lg"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
              <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="text-xs uppercase tracking-wider opacity-90">2. Voice</div>
              <div className="mt-2 text-lg font-semibold">Choose your voices</div>
              <p className="mt-1 text-white/90 text-sm">Natural voices with emotion, pacing, and multi‑speaker dialogs.</p>
              <div className="mt-4 inline-flex items-center text-xs opacity-90 group-hover:opacity-100 transition">🎙️ Realistic TTS</div>
            </motion.div>

            {/* Step 3 - Export (Amber/Rose) */}
            <motion.div
              variants={{ hidden: { opacity: 0, x: 40, skewX: -4 }, show: { opacity: 1, x: 0, skewX: 0 } }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              className="relative rounded-2xl p-6 text-white overflow-hidden group shadow-lg"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-600 via-orange-600 to-rose-600" />
              <div className="absolute top-1/2 -translate-y-1/2 right-[-30px] h-40 w-40 rotate-12 rounded-full bg-white/10 blur-2xl" />
              <div className="text-xs uppercase tracking-wider opacity-90">3. Export</div>
              <div className="mt-2 text-lg font-semibold">Publish faster</div>
              <p className="mt-1 text-white/90 text-sm">Export MP3/WAV, generate show notes, and share everywhere.</p>
              <div className="mt-4 inline-flex items-center text-xs opacity-90 group-hover:opacity-100 transition">🚀 One‑click Export</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Updates */}
      <section id="updates" className="bg-gradient-to-br from-fuchsia-50 via-rose-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.h2 className="text-2xl font-medium" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>Latest Updates</motion.h2>

          {/* Weather card */}
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            <div className="rounded-xl p-5 border border-amber-200 bg-amber-100/60">
              <div className="text-xs uppercase tracking-wider text-amber-700">Weather</div>
              <div className="mt-2 text-slate-800 text-sm">
                {loading.weather ? (
                  <span>Loading current weather…</span>
                ) : weather ? (
                  <>
                    <div className="text-lg font-medium">{loc.label}</div>
                    <div className="mt-1">Temp: <b>{weather.temp}°C</b> • Wind: <b>{weather.wind} km/h</b></div>
                  </>
                ) : (
                  <span>Weather unavailable.</span>
                )}
              </div>
            </div>

            {/* System & Device APIs */}
            <div className="rounded-xl p-5 border border-fuchsia-200 bg-fuchsia-100/60">
              <div className="text-xs uppercase tracking-wider text-fuchsia-700">System & Device</div>
              <div className="mt-2 text-slate-800 text-sm grid gap-2">
                <div>Network: <b>{net.type}</b>{net.downlink ? ` • ${net.downlink}Mbps` : ''}</div>
                <div>Battery: <b>{battery ? Math.round(battery.level * 100) + '%' : 'n/a'}</b>{battery?.charging ? ' • Charging' : ''}</div>
                <div>Visibility: <b>{visible}</b></div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    className="px-4 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition"
                    onClick={() => { try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch {} }}
                  >Vibrate</button>
                  <button
                    className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition"
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
            <div className="rounded-xl p-5 border border-sky-200 bg-sky-100/60">
              <div className="text-xs uppercase tracking-wider text-sky-700">Preferences</div>
              <div className="mt-2 text-slate-800 text-sm">
                <div>Theme: <b>{theme}</b></div>
                <div className="mt-1">Location: <b>{loc.label}</b></div>
                <div className="mt-1">APIs: <b>{net ? 'Network' : 'No Network'}</b>, <b>{'getBattery' in navigator ? 'Battery' : 'No Battery'}</b>, <b>Visibility</b>, <b>Vibration</b>, <b>Fullscreen</b></div>
              </div>
            </div>
          </div>

          {/* News cards */}
          <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {loading.news && (
              <div className="text-sm text-slate-600">Loading top news…</div>
            )}
            {!loading.news && news.length === 0 && (
              <div className="text-sm text-slate-600">No news available right now.</div>
            )}
            {news.map((n, idx) => (
              <motion.a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className={`group border rounded-lg overflow-hidden block ${
                  [
                    "border-rose-200 bg-rose-50/60",
                    "border-emerald-200 bg-emerald-50/60",
                    "border-indigo-200 bg-indigo-50/60",
                  ][idx % 3]
                }`}
                whileHover={{ y: -4, scale: 1.01, boxShadow: "0 10px 24px rgba(0,0,0,0.10)" }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="p-4 flex items-start gap-3">
                  <img src="/news-placeholder.svg" alt="News" className="h-10 w-14 rounded-md shadow-sm" />
                  <div>
                    <div className="text-sm font-medium leading-snug group-hover:underline">
                      {n.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Source: Reddit r/news</div>
                  </div>
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
