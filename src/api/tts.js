// src/api/tts.js
let utterance = null;
let isPaused = false;

export function convertTextToSpeech(text) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech Synthesis not supported in this browser."));
      return;
    }

    window.speechSynthesis.cancel();
    isPaused = false;

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    function setVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(v => v.name === "Google US English") || voices[0];
        utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(setVoice, 100);
      }
    }
    setVoice();

    utterance.onend = () => {
      utterance = null;
      resolve();
    };

    utterance.onerror = (e) => {
      utterance = null;
      reject(new Error("Speech synthesis error: " + e.error));
    };
  });
}

export function pauseSpeech() {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    isPaused = true;
  }
}

export function resumeSpeech() {
  if (window.speechSynthesis.paused && isPaused) {
    window.speechSynthesis.resume();
    isPaused = false;
  }
}

export function stopSpeech() {
  if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
    window.speechSynthesis.cancel();
    utterance = null;
    isPaused = false;
  }
}
