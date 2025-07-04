// App.js
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import logo from "./assets/logo.png";
import darthVader from "./assets/darth-vader.jpg";
import starwarsBg from "./assets/starwars-bg.jpg";
import { useNavigate } from "react-router-dom";

// Global TTS state
let sentenceQueue = [];
let currentIndex = 0;
let currentUtterance = null;

function convertTextToSpeech(text, startFrom = 0, onEndCallback) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech Synthesis not supported"));
      return;
    }

    let voices = [];
    const loadVoices = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speakChunks();
      } else {
        setTimeout(loadVoices, 100);
      }
    };

    const speakChunks = () => {
      sentenceQueue = text.match(/[^.!?]+[.!?]*/g) || [text];
      currentIndex = startFrom;

      const speakNext = () => {
        if (currentIndex >= sentenceQueue.length) {
          if (onEndCallback) onEndCallback();
          resolve();
          return;
        }

        const sentence = sentenceQueue[currentIndex].trim();
        if (!sentence) {
          currentIndex++;
          speakNext();
          return;
        }

        currentUtterance = new SpeechSynthesisUtterance(sentence);
        currentUtterance.lang = "en-US";

        const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices[0];
        if (preferredVoice) currentUtterance.voice = preferredVoice;

        currentUtterance.onend = () => {
          currentIndex++;
          speakNext();
        };

        currentUtterance.onerror = (e) => reject(e.error);

        window.speechSynthesis.speak(currentUtterance);
      };

      speakNext();
    };

    window.speechSynthesis.cancel();
    loadVoices();
  });
}

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [article, setArticle] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pausedIndex, setPausedIndex] = useState(0);

  const speakingRef = useRef(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError(null);
    setArticle(null);

    try {
      const response = await fetch("https://rman.onrender.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");

      setArticle(data);
      setIsSpeaking(true);
      speakingRef.current = true;

      await convertTextToSpeech(data.content, 0, () => {
        setIsSpeaking(false);
        speakingRef.current = false;
        setPausedIndex(0);
      });
    } catch (err) {
      setError(err.message);
      setIsSpeaking(false);
      speakingRef.current = false;
    }

    setLoading(false);
  };

  const handlePlay = async () => {
    if (!article?.content || speakingRef.current) return;

    setIsSpeaking(true);
    speakingRef.current = true;

    try {
      await convertTextToSpeech(article.content, pausedIndex, () => {
        setIsSpeaking(false);
        speakingRef.current = false;
        setPausedIndex(0);
      });
    } catch (e) {
      setIsSpeaking(false);
      speakingRef.current = false;
    }
  };

  const handleStop = () => {
    if (currentUtterance) currentUtterance.onend = null;
    window.speechSynthesis.cancel();
    setPausedIndex(currentIndex);
    setIsSpeaking(false);
    speakingRef.current = false;
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <div
      className="relative min-h-screen flex flex-col justify-center items-center bg-cover bg-center p-8"
      style={{ backgroundImage: `url(${starwarsBg})` }}
    >
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => navigate("/darth-vader")}
          className="rounded-full overflow-hidden w-16 h-16 border-4 border-yellow-500 shadow-lg hover:scale-110 transition-transform duration-300"
        >
          <img src={darthVader} alt="Darth Vader" className="w-full h-full object-cover" />
        </button>
      </div>

      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-60 flex justify-between items-center px-8 py-4 z-10">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <h1 className="floating-title text-yellow-400 text-6xl md:text-8xl font-starwars text-center drop-shadow-[2px_2px_0_black] mb-6">
        Talkify: The Podcast Force Awakens
      </h1>
      <p className="text-yellow-400 text-2xl md:text-3xl font-starwars text-center drop-shadow-[2px_2px_0_black] mb-12 max-w-2xl">
        Paste a URL below and generate your Star Wars-inspired podcast!
      </p>

      <div className="flex flex-col sm:flex-row items-center w-full max-w-xl space-y-4 sm:space-y-0 sm:space-x-4 z-10">
        <input
          type="text"
          placeholder="Enter article URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-grow p-4 rounded-lg text-black font-starwars text-lg outline-none border-2 border-yellow-400 focus:ring-2 focus:ring-yellow-500 transition"
        />
        <button
          onClick={handleGenerate}
          className="px-6 py-4 bg-yellow-400 text-black font-starwars text-lg rounded-lg hover:bg-yellow-500 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Generate Podcast"}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-lg font-starwars mt-4">{error}</p>
      )}

      {article && (
        <div className="bg-black bg-opacity-70 p-6 mt-6 rounded-lg border-2 border-yellow-500 shadow-lg max-w-3xl text-white space-y-4 z-10">
          <h2 className="text-3xl font-starwars border-b border-yellow-400 pb-2">
            {article.title}
          </h2>

          <p className="text-yellow-300 font-starwars text-xl mt-4">Full Article:</p>
          <p className="text-md font-starwars whitespace-pre-line">{article.content}</p>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handlePlay}
              disabled={isSpeaking}
              className="px-4 py-2 bg-yellow-400 text-black font-starwars rounded hover:bg-yellow-500 transition disabled:opacity-50"
            >
              ▶️ {pausedIndex > 0 ? "Resume" : "Play"}
            </button>
            <button
              onClick={handleStop}
              disabled={!isSpeaking}
              className="px-4 py-2 bg-yellow-400 text-black font-starwars rounded hover:bg-yellow-500 transition disabled:opacity-50"
            >
              ⏹ Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

