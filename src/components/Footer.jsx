import React from "react";

export default function Footer() {
  return (
    <footer className="py-12">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between border-t border-black/10 pt-6 text-sm text-black/60">
        <div>© {new Date().getFullYear()} Talkify</div>
        <a href="mailto:hello@example.com" className="hover:text-black">hello@example.com</a>
      </div>
    </footer>
  );
}
