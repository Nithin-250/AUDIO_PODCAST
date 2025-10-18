// src/api/ai.js
// Client-side summarization via OpenAI Chat Completions API.
// Note: Using an API key from the browser is not ideal for production.
// We store it in localStorage for convenience during development and also
// allow reading from environment or window for dev-only injection.

export function getStoredOpenAIKey() {
  try {
    // Priority:
    // 1) Explicitly saved in localStorage via the UI
    // 2) Build-time env var (Create React App): REACT_APP_OPENAI_API_KEY
    // 3) Runtime global for local dev (set in DevTools): window.__OPENAI_KEY__
    const ls = localStorage.getItem("openai_api_key");
    if (ls) return ls;

    const envKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (envKey) return envKey;

    // Optional runtime global injection for quick testing
    const winKey = typeof window !== "undefined" && window.__OPENAI_KEY__;
    if (winKey) return winKey;

    return "";
  } catch {
    return "";
  }
}
export function setStoredOpenAIKey(key) {
  try {
    if (key) localStorage.setItem("openai_api_key", key);
    else localStorage.removeItem("openai_api_key");
  } catch {}
}
const LANGUAGE_MAP = {
  en: { name: "English", promptLang: "English" },
  ta: { name: "Tamil", promptLang: "Tamil" },
  hi: { name: "Hindi", promptLang: "Hindi" },
};

export async function summarizeWithOpenAI({ text, language = "en", apiKey }) {
  const model = "gpt-4o-mini"; // lightweight, good quality
  if (!apiKey) {
    // Fallback to stored/env/runtime key so UI doesn't need to expose this
    apiKey = getStoredOpenAIKey();
  }
  if (!apiKey) throw new Error("Missing OpenAI API key");
  const langConfig = LANGUAGE_MAP[language] || LANGUAGE_MAP.en;

  // Trim excessively long inputs to keep latency and token usage reasonable
  const maxChars = 24000; // ~6-8k tokens approx
  const input = text.length > maxChars ? text.slice(0, maxChars) : text;
  const system = `You are a concise assistant that summarizes long web articles for a podcast. Return a clear, factual summary in ${langConfig.promptLang}. Keep it 6-10 bullet points or short paragraphs, suitable for voice narration.`;
  const user = `Article content:\n\n${input}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("No content returned from OpenAI");
  return content;
}

// Fallback naive summarizer if no key is present
export function naiveSummarize(text, targetSentences = 8) {
  const sentences = (text.match(/[^.!?\n]+[.!?\n]*/g) || []).map((s) => s.trim());
  if (sentences.length === 0) return text;
  return sentences.slice(0, targetSentences).join(" ");
}
