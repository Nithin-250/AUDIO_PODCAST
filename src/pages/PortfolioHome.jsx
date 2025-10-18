import React from "react";
import { Link } from "react-router-dom";

export default function PortfolioHome() {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight text-lg">Portfolio</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="opacity-100">Home</Link>
            <Link to="/tool" className="opacity-60 hover:opacity-100 transition">Tool</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b border-black/10">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              Shirshen Das Gupta Shuvro
            </h1>
            <p className="mt-5 max-w-2xl text-black/70">
              Web developer crafting interactive experiences. Minimal interface, thoughtful motion.
            </p>
            <div className="mt-8 flex gap-4">
              <Link to="/tool" className="inline-flex items-center px-5 py-3 rounded border border-black text-black hover:bg-black hover:text-white transition">
                Open the Tool
              </Link>
              <a href="#work" className="inline-flex items-center px-5 py-3 rounded text-black/70 hover:text-black transition">
                View Work
              </a>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="border-b border-black/10" id="about">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-4 text-sm uppercase tracking-wider text-black/50">About</div>
            <div className="md:col-span-8 text-black/80 leading-relaxed">
              I am a Web Developer, passionate and dedicated to my work. I enjoy every step of the design process, from discussion to collaboration.
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="border-b border-black/10" id="services">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
            <h2 className="text-2xl font-medium">Services</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              <div className="border border-black/10 rounded-lg p-5">
                <div className="text-sm uppercase tracking-wider text-black/50">Web</div>
                <p className="mt-2 text-sm text-black/80">Designing and building responsive, accessible websites with modern tooling.</p>
              </div>
              <div className="border border-black/10 rounded-lg p-5">
                <div className="text-sm uppercase tracking-wider text-black/50">Graphics</div>
                <p className="mt-2 text-sm text-black/80">Attention to detail, motion and performance for delightful experiences.</p>
              </div>
              <div className="border border-black/10 rounded-lg p-5">
                <div className="text-sm uppercase tracking-wider text-black/50">SEO</div>
                <p className="mt-2 text-sm text-black/80">Technical and on-page best practices to improve discoverability.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Work Grid */}
        <section className="border-b border-black/10" id="work">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
            <h2 className="text-2xl font-medium">Selected Work</h2>
            <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="group border border-black/10 rounded-lg overflow-hidden">
                  <div className="aspect-[4/3] bg-black/5" />
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Project {i}</div>
                      <div className="text-xs text-black/60">Category</div>
                    </div>
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition">View →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="border-b border-black/10" id="testimonials">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
            <h2 className="text-2xl font-medium">Testimonials</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="border border-black/10 rounded-lg p-5 text-sm text-black/80">
                  “Shuvro is an excellent web designer and faultless technician.”
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-medium">Get In Touch</h2>
              <p className="mt-3 text-black/70 text-sm">Have a project in mind? Let’s talk.</p>
            </div>
            <form className="space-y-3">
              <input className="w-full p-3 border border-black/20 rounded" placeholder="Full Name" />
              <input type="email" className="w-full p-3 border border-black/20 rounded" placeholder="Email" />
              <input className="w-full p-3 border border-black/20 rounded" placeholder="Subject" />
              <textarea rows="4" className="w-full p-3 border border-black/20 rounded" placeholder="Message" />
              <button type="button" className="px-5 py-3 border border-black rounded hover:bg-black hover:text-white transition">Submit</button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-black/60">© 2024 Shuvro.</div>
      </footer>
    </div>
  );
}
