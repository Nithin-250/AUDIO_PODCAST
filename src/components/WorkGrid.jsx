import React from "react";
import { motion } from "framer-motion";

const items = [
  { title: "Article to Podcast", desc: "Paste a URL, get a narrated summary.", id: 1 },
  { title: "Multilingual", desc: "English, Tamil, Hindi voices.", id: 2 },
  { title: "Lightweight", desc: "Fast, focused, minimal UI.", id: 3 },
];

export default function WorkGrid() {
  return (
    <section id="work" className="border-b border-black/10">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group border border-black/10 rounded-lg p-6 hover:-translate-y-1 hover:shadow-sm transition"
            >
              <div className="text-sm uppercase tracking-wider text-black/50">Feature</div>
              <h3 className="mt-2 text-xl font-medium">{item.title}</h3>
              <p className="mt-2 text-black/70">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
