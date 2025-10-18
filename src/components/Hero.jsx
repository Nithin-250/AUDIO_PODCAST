import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight"
        >
          Ideas to Audio, quickly.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 max-w-2xl text-base md:text-lg text-black/70"
        >
          Turn any article into a clean, narrated summary. Minimal interface.
          Thoughtful motion. Zero friction.
        </motion.p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            to="/tool"
            className="inline-flex items-center px-5 py-3 rounded border border-black text-black hover:bg-black hover:text-white transition"
          >
            Open the tool
          </Link>
          <a
            href="#work"
            className="inline-flex items-center px-5 py-3 rounded text-black/70 hover:text-black transition"
          >
            See examples
          </a>
        </div>
      </div>
    </section>
  );
}
