import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";
import {
  summarizeWithOpenAI,
  naiveSummarize,
} from "./api/ai";

// Translation helper via our backend proxy to avoid CORS/provider failures.
// Falls back to original text on error.
async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text;
  try {
    // Primary: server proxy using Libre-compatible providers
    const res = await fetch('http://127.0.0.1:8010/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target: targetLang, source: 'en' })
    });
    if (res.ok) {
      const data = await res.json();
      const out = data?.translatedText || data?.translated_text || '';
      if (out && hasTargetScript(out, targetLang)) return out;
    }
  } catch (_) {}

  // Fallback: LLM translation via backend (requires OPENAI_API_KEY on server)
  try {
    const res2 = await fetch('http://127.0.0.1:8010/translate_llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target: targetLang })
    });
    if (!res2.ok) throw new Error('llm translate failed');
    const data2 = await res2.json();
    const out2 = data2?.translatedText || data2?.translated_text;
    return out2 || text;
  } catch (_) {
    return text;
  }
}

function hasTargetScript(text, lang) {
  if (!text) return false;
  if (lang === 'ta') {
    return /[\u0B80-\u0BFF]/.test(text); // Tamil block
  }
  if (lang === 'hi') {
    return /[\u0900-\u097F]/.test(text); // Devanagari
  }
  return true;
}

// Client-side extraction fallback using Jina Reader proxy for many sites.
async function clientExtractWithJina(rawUrl) {
  try {
    let u = rawUrl.trim();
    if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
    // Jina Reader expects full URL appended after /http:// or /https://
    const jinaUrl = u.startsWith('https://')
      ? `https://r.jina.ai/https://${u.slice('https://'.length)}`
      : `https://r.jina.ai/http://${u.slice('http://'.length)}`;
    const res = await fetch(jinaUrl, { method: 'GET' });
    if (!res.ok) throw new Error('Jina reader failed');
    const text = await res.text();
    const content = (text || '').trim();
    if (!content) throw new Error('empty');
    // Use URL as the title fallback
    return { title: rawUrl, content };
  } catch (_) {
    return null;
  }
}

// Global TTS state
let sentenceQueue = [];
let currentUtterance = null;
let cloudAudio = null; // used for optional backend TTS playback

function convertTextToSpeech(text, startFrom = 0, onProgress, onEnd, language = "en") {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech Synthesis not supported"));
      return;
    }

    // Wait for voices to be loaded if not ready yet
    const ensureVoices = () => {
      return new Promise((r) => {
        const vs = window.speechSynthesis.getVoices();
        if (vs && vs.length) return r(vs);
        const onVoices = () => {
          const got = window.speechSynthesis.getVoices();
          window.speechSynthesis.onvoiceschanged = null;
          r(got);
        };
        window.speechSynthesis.onvoiceschanged = onVoices;
        // Fallback timer in case event doesn't fire
        setTimeout(() => {
          const retry = window.speechSynthesis.getVoices();
          window.speechSynthesis.onvoiceschanged = null;
          r(retry || []);
        }, 1000);
      });
    };

    // Multilingual sentence splitting (supports ., !, ?, and Devanagari danda '।')
    sentenceQueue = text.match(/[^.!?।]+[.!?।]*/g) || [text];

    const speakNext = (index, voices) => {
      if (index >= sentenceQueue.length) {
        if (onEnd) onEnd();
        resolve();
        return;
      }

      const sentence = sentenceQueue[index].trim();
      if (!sentence) {
        speakNext(index + 1, voices);
        return;
      }

      currentUtterance = new SpeechSynthesisUtterance(sentence);
      // Map app language to TTS BCP-47 codes
      const langToBCP = {
        en: "en-US",
        ta: "ta-IN",
        hi: "hi-IN",
      };
      const targetLang = langToBCP[language] || "en-US";
      currentUtterance.lang = targetLang;
      const preferredVoice =
        voices.find(v => v.lang === targetLang) ||
        voices.find(v => v.lang?.toLowerCase().startsWith(targetLang.split("-")[0])) ||
        voices[0];
      if (!preferredVoice) {
        reject(new Error("no matching voice"));
        return;
      }
      currentUtterance.voice = preferredVoice;

      currentUtterance.onend = () => {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
        onProgress(index + 1);
        speakNext(index + 1, voices);
      };

      currentUtterance.onerror = (e) => reject(e.error);

      window.speechSynthesis.speak(currentUtterance);
    };

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    ensureVoices().then((voices) => speakNext(startFrom, voices));
  });
}

// Voice availability check (no cloud fallback). Returns true if a local voice exists for lang
async function hasVoiceForLanguage(lang) {
  const langToBCP = { en: 'en-US', ta: 'ta-IN', hi: 'hi-IN' };
  const target = langToBCP[lang] || 'en-US';
  // Ensure voices are loaded
  const voices = await new Promise((resolve) => {
    const vs = window.speechSynthesis?.getVoices?.() || [];
    if (vs.length) return resolve(vs);
    const handler = () => {
      const got = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = null;
      resolve(got || []);
    };
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = handler;
    setTimeout(() => {
      const retry = window.speechSynthesis?.getVoices?.() || [];
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
      resolve(retry);
    }, 800);
  });
  return !!(
    voices.find(v => v.lang === target) ||
    voices.find(v => v.lang?.toLowerCase().startsWith(target.split('-')[0]))
  );
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [article, setArticle] = useState(null);
  const [summary, setSummary] = useState("");
  const [rawSummary, setRawSummary] = useState("");
  const [taSummary, setTaSummary] = useState("");
  const [hiSummary, setHiSummary] = useState("");
  const [podcastText, setPodcastText] = useState("");
  const [language, setLanguage] = useState("en"); // en | ta | hi
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pausedIndex, setPausedIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [notice, setNotice] = useState("");
  const [ttsLoading, setTtsLoading] = useState(false);

  const navigate = useNavigate();
  const speakingRef = useRef(false);

  useEffect(() => {
    // no-op: API key is loaded internally via env/local storage in ai.js
  }, []);

  // No modal on tools page

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark = stored ? stored === "dark" : prefersDark;
      if (shouldDark) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      }
    } catch (_) {}
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      try { localStorage.setItem("theme", "dark"); } catch (_) {}
    } else {
      document.documentElement.classList.remove("dark");
      try { localStorage.setItem("theme", "light"); } catch (_) {}
    }
  };

  // Speaker helper: uses browser TTS with optional language override
  const speak = async (text, startAt = 0, langOverride) => {
    setIsSpeaking(true);
    speakingRef.current = true;
    const onEnd = () => {
      setIsSpeaking(false);
      speakingRef.current = false;
      setPausedIndex(0);
    };
    try {
      await convertTextToSpeech(text, startAt, setPausedIndex, onEnd, langOverride || language);
    } catch (e) {
      onEnd();
      throw e;
    }
  };

  // Cloud TTS helper (FastAPI backend). Used when TA/HI local voice is missing.
  const speakCloud = async (text, lang) => {
    setIsSpeaking(true);
    speakingRef.current = true;
    setPausedIndex(0);
    try {
      const res = await fetch('http://127.0.0.1:8010/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang })
      });
      if (!res.ok) throw new Error('cloud tts error');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (cloudAudio) {
        try { cloudAudio.pause(); } catch {}
        try { cloudAudio.src = ''; } catch {}
      }
      cloudAudio = new Audio(url);
      await cloudAudio.play();
      cloudAudio.onended = () => {
        try { URL.revokeObjectURL(url); } catch {}
        cloudAudio = null;
        setIsSpeaking(false);
        speakingRef.current = false;
        setPausedIndex(0);
      };
    } catch (e) {
      setIsSpeaking(false);
      speakingRef.current = false;
      setPausedIndex(0);
      throw e;
    }
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError(null);
    setArticle(null);
    setSummary("");
    setTaSummary("");
    setHiSummary("");
    setPodcastText("");

    try {
      const response = await fetch("https://rman.onrender.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      let effective = null;
      if (response.ok && data?.content && data.content.trim()) {
        effective = data;
      } else {
        // Try client-side fallback extractor
        const alt = await clientExtractWithJina(url);
        if (alt && alt.content.trim()) {
          effective = alt;
        } else {
          throw new Error("Couldn't extract readable content from this URL. The site may block extraction or require login.");
        }
      }

      setArticle(effective);

      // Try OpenAI summarization using internal key; fallback to naive
      let sum = "";
      try {
        sum = await summarizeWithOpenAI({ text: effective.content, language });
      } catch (e) {
        console.error("AI summarize failed, falling back:", e);
        sum = naiveSummarize(effective.content, 8);
      }
      setRawSummary(sum);
      try {
        const [ta, hi] = await Promise.all([
          translateText(sum, 'ta'),
          translateText(sum, 'hi')
        ]);
        setTaSummary(ta);
        setHiSummary(hi);
      } catch (_) {}
      // Always translate summary for TA/HI; never fallback to English content for display
      let sumOut = sum;
      setNotice("");
      if (language !== 'en') {
        sumOut = await translateText(sum, language);
      }
      setSummary(sumOut);
      setPodcastText(sumOut);
      setNotice('Click Play to start audio.');
      // Do not auto-play here to avoid autoplay blocking. Use Play button.
    } catch (err) {
      setError(err.message);
      setIsSpeaking(false);
      speakingRef.current = false;
    }

    setLoading(false);
  };

  const handlePlay = async () => {
    if (!podcastText || speakingRef.current) return;
    try {
      // Always play selected language; use cloud TTS to guarantee TA/HI
      if (language !== 'en') {
        setTtsLoading(true);
        let toSpeak = podcastText;
        if (!hasTargetScript(toSpeak, language)) {
          toSpeak = await translateText(podcastText, language);
        }
        await speakCloud(toSpeak, language);
        return;
      }
      await speak(podcastText, pausedIndex, 'en');
    } catch (_) {
      // no-op
    } finally {
      if (language !== 'en') setTtsLoading(false);
    }
  };

  const handleStop = () => {
    if (currentUtterance) currentUtterance.onend = null;
    window.speechSynthesis.cancel();
    if (cloudAudio) {
      try { cloudAudio.pause(); } catch {}
      try { cloudAudio.src = ''; } catch {}
      cloudAudio = null;
    }
    setIsSpeaking(false);
    speakingRef.current = false;
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-black text-slate-900 dark:text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/talkify-logo.svg" alt="Talkify" className="h-8 w-auto" />
            <span className="font-semibold tracking-tight">Talkify Tool</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex items-center px-3 py-2 rounded-md border border-slate-300/70 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-3 py-2 rounded-md border border-slate-300/70 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
            >
              ← Back Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12 grid md:grid-cols-12 gap-6">
        {/* Left column: input + options */}
        <section className="md:col-span-5 lg:col-span-4">
          <div className="rounded-2xl p-5 bg-white/70 dark:bg-white/[0.06] border border-white/40 dark:border-white/10 backdrop-blur shadow">
            <h1 className="text-xl font-semibold tracking-tight">Article to Audio</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Paste a URL, pick a language, then generate a narrated summary.</p>

            <div className="mt-5 space-y-3">
              <input
                type="text"
                placeholder="Enter article URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300/70 dark:border-white/10 bg-white dark:bg-white/5 outline-none focus:ring-2 focus:ring-sky-400/50"
              />

              <div className="grid grid-cols-3 gap-2" title="Language">
                {[
                  { id: "en", label: "English" },
                  { id: "ta", label: "Tamil" },
                  { id: "hi", label: "Hindi" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setLanguage(opt.id)}
                    className={`px-3 py-2 rounded-md text-sm border transition ${
                      language === opt.id
                        ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-transparent"
                        : "bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-300/70 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-md text-white bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 shadow hover:brightness-110 transition disabled:opacity-60"
              >
                {loading ? "Fetching & Summarizing…" : "Generate Podcast"}
              </button>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {notice && (
                <p className="text-amber-600 dark:text-amber-400 text-sm">{notice}</p>
              )}
            </div>

            <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              Tips: Ensure the article is publicly accessible. Language affects both summary and voice.
            </div>
          </div>
        </section>

        {/* Right column: result preview + controls */}
        <section className="md:col-span-7 lg:col-span-8">
          <div className="rounded-2xl p-5 bg-white/70 dark:bg-white/[0.06] border border-white/40 dark:border-white/10 backdrop-blur shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Preview</h2>
              {article && (
                <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">Ready</span>
              )}
            </div>

            {!article && (
              <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                No article yet. Paste a URL and click Generate Podcast.
              </div>
            )}

            {article && (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</div>
                  <div className="mt-1 text-lg font-medium leading-snug">{article.title}</div>
                </div>

                {summary && (
                  <div className="mt-2">
                    <div className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Summary ({language === "en" ? "English" : language === "ta" ? "Tamil" : "Hindi"})</div>
                    <div className="mt-2 whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">{summary}</div>
                  </div>
                )}

                {/* Show only the selected language summary on tools page */}

                <details className="group mt-2">
                  <summary className="cursor-pointer text-sm inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="group-open:hidden">Show full article</span>
                    <span className="hidden group-open:inline">Hide full article</span>
                  </summary>
                  <div className="mt-2 whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
                    {article.content}
                  </div>
                </details>

                {/* No features row on tools page */}

                {/* Audio controls */}
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={handlePlay}
                    disabled={isSpeaking || ttsLoading}
                    className="px-4 py-2 rounded-md text-white bg-gradient-to-r from-sky-600 to-indigo-600 shadow hover:brightness-110 transition disabled:opacity-50"
                  >
                    {ttsLoading ? "Preparing audio…" : `▶️ ${pausedIndex > 0 ? "Resume" : "Play"}`}
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={!isSpeaking}
                    className="px-4 py-2 rounded-md border border-slate-300/70 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition disabled:opacity-50"
                  >
                    ⏹ Stop
                  </button>
                  <button
                    onClick={() => setPodcastText(summary || article.content)}
                    className="px-4 py-2 rounded-md border border-slate-300/70 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition"
                  >
                    Use Summary Audio
                  </button>
                  <button
                    onClick={async () => {
                      const text = language === 'en' ? article.content : await translateText(article.content, language);
                      setPodcastText(text);
                    }}
                    className="px-4 py-2 rounded-md border border-slate-300/70 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition"
                  >
                    Use Full Article Audio
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      {/* No modal on tools page */}
    </div>
  );
}

export default App;
