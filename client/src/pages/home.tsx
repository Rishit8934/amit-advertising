import React, { useState, useEffect, useRef } from "react";
import {
  Menu, X, Globe, ArrowRight, CheckCircle2, Phone, Mail,
  Facebook, Twitter, Instagram, Linkedin, FileText, Layout,
  LayoutGrid, Package, MapPin, Clock
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ── tiny helpers ── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function RevealWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: ".08em", verticalAlign: "bottom" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "110%", opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: delay + i * 0.12 }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const TESTIMONIALS = [
  { quote: "Booked Tribune classified ads for 3 cities in under 5 minutes. The response rate was the best we've seen in years.", name: "Priya Anand", role: "Marketing Head, PropTech Startup" },
  { quote: "Best rates, instant booking, and real confirmation. Amit Advertising made our recruitment campaign completely stress-free.", name: "Lukas Brenner", role: "HR Director, Logistics Corp" },
  { quote: "Placed a matrimonial ad across five newspapers at once. Couldn't believe how simple it was — cheaper than calling agents.", name: "Sunita Rao", role: "Private Advertiser, Chandigarh" },
];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState("EN");
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [showRateCardModal, setShowRateCardModal] = useState(false);
  const [selectedRateCard, setSelectedRateCard] = useState<any>(null);
  const scrollY = useScrollY();
  const headerTransparent = scrollY < 60;

  // Cost estimator
  const [estimatorData, setEstimatorData] = useState({ newspaper: "", adType: "", city: "", date: "", size: "5" });
  const [estimatedCost, setEstimatedCost] = useState(1250);
  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [adTypes, setAdTypes] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/rate-cards").then(r => r.ok ? r.json() : []).then((cards: any[]) => {
      setRateCards(cards);
      if (cards.length > 0) setSelectedRateCard(cards[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([fetch("/api/newspapers"), fetch("/api/cities")])
      .then(([n, c]) => Promise.all([n.json(), c.json()]))
      .then(([n, c]) => { setNewspapers(n); setCities(c); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!estimatorData.newspaper) { setAdTypes([]); return; }
    fetch(`/api/newspapers/${estimatorData.newspaper}/ad-types`).then(r => r.json()).then(setAdTypes).catch(() => {});
  }, [estimatorData.newspaper]);

  useEffect(() => {
    if (!estimatorData.newspaper || !estimatorData.adType || !estimatorData.city || !estimatorData.date) return;
    fetch("/api/bookings/estimate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newspaper: estimatorData.newspaper, adType: estimatorData.adType, city: estimatorData.city, size: { unit: "line", value: parseInt(estimatorData.size) }, publishDates: [estimatorData.date] })
    }).then(r => r.ok ? r.json() : null).then(d => { if (d) setEstimatedCost(d.estimatedTotal); }).catch(() => {});
  }, [estimatorData]);

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerTransparent ? "bg-transparent" : "bg-white/95 backdrop-blur-md shadow-sm border-b border-neutral-100"}`}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-white/20 rounded-md flex items-center justify-center text-white font-bold text-base border border-white/30" style={headerTransparent ? {} : { background: "#1e40af", borderColor: "transparent", color: "#fff" }}>A</div>
            <span className={`text-lg font-bold tracking-tight ${headerTransparent ? "text-white" : "text-[#0f2f63]"}`}>Amit Advertising</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {[["Book Ad", "/booking"], ["Rate Card", "/rate-card"], ["Help Me Book", "/booking"]].map(([label, href]) => (
              <a key={label} href={href} className={`text-sm font-medium transition-colors ${headerTransparent ? "text-white/90 hover:text-white" : "text-neutral-600 hover:text-[#0f2f63]"}`}>{label}</a>
            ))}
            <a href="/login" className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${headerTransparent ? "border-white/40 text-white hover:bg-white/10" : "border-[#0f2f63] text-[#0f2f63] hover:bg-[#0f2f63] hover:text-white"}`}>My Ad History</a>
            <button onClick={() => setLang(l => l === "EN" ? "HI" : "EN")} className={`flex items-center gap-1 text-sm ${headerTransparent ? "text-white/70 hover:text-white" : "text-neutral-500 hover:text-[#0f2f63]"}`}>
              <Globe className="h-4 w-4" />{lang}
            </button>
          </nav>
          <button className={`md:hidden p-2 ${headerTransparent ? "text-white" : "text-neutral-700"}`} onClick={() => setIsMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div className="fixed inset-0 z-50 bg-[#0f2f63] flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between items-center px-6 h-16">
              <span className="text-white text-lg font-bold tracking-tight">Amit Advertising</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-white p-2"><X className="h-6 w-6" /></button>
            </div>
            <nav className="flex flex-col gap-2 px-6 pt-8 flex-1">
              {[["Book Ad", "/booking"], ["Rate Card", "/rate-card"], ["Help Me Book", "/booking"], ["My Ad History", "/login"]].map(([label, href], i) => (
                <motion.div key={label} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                  <a href={href} onClick={() => setIsMenuOpen(false)} className="block text-4xl font-bold text-white/90 hover:text-white py-3 border-b border-white/10">{label}</a>
                </motion.div>
              ))}
            </nav>
            <div className="px-6 pb-10 flex gap-6">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="text-white/60 hover:text-white transition-colors"><Icon className="h-5 w-5" /></a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col"
        style={{ height: "100svh", minHeight: "36rem", overflow: "hidden", backgroundColor: "#0a1e46" }}
      >
        {/* Newspaper background image — pointer-events none so it never blocks clicks */}
        <img
          src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&q=80"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/homepage-image.png"; }}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            zIndex: 0, pointerEvents: "none",
          }}
        />
        {/* Dark navy tint */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "linear-gradient(to bottom, rgba(10,30,70,0.60) 0%, rgba(10,30,70,0.40) 40%, rgba(10,30,70,0.75) 100%)"
        }} />

        <div className="relative flex flex-col flex-1 px-6 md:px-10" style={{ zIndex: 4 }}>
          {/* Big headline — top area */}
          <div className="mt-auto pt-24">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-white/60 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Amit Advertising — India's Trusted Ad Platform
              </span>
            </motion.div>
            <h1 style={{ fontSize: "clamp(3rem, 12.5vw, 10rem)", fontWeight: 500, textTransform: "uppercase", lineHeight: 0.88, letterSpacing: "-.02em", color: "#fff" }}>
              <RevealWords text="REACH" delay={0.4} />
              <br />
              <RevealWords text="MILLIONS" delay={0.6} />
            </h1>
          </div>

          {/* Bottom area */}
          <div className="mt-auto pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
              >
                <p style={{ fontSize: "clamp(1.4rem, 3.5vw, 2.5rem)", fontWeight: 500, textTransform: "uppercase", lineHeight: 0.95, letterSpacing: "-.02em", color: "rgba(255,255,255,0.8)" }}>
                  Book Smart,<br />Advertise Bold
                </p>
              </motion.div>
              <motion.div className="flex gap-3 mt-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }}>
                <a href="/booking" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold uppercase tracking-wide bg-white text-[#0f2f63] hover:bg-blue-100 transition-colors">
                  Book a Campaign <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/rate-card" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold uppercase tracking-wide border border-white/30 text-white hover:bg-white/10 transition-colors">
                  View Rates
                </a>
              </motion.div>
            </div>

            {/* Tribune newspaper card + stats */}
            <div className="flex flex-col items-end gap-4">
              {/* The Tribune newspaper clipping card */}
              <motion.div
                initial={{ opacity: 0, y: 32, rotate: 3 }}
                animate={{ opacity: 1, y: 0, rotate: 2 }}
                transition={{ delay: 0.9, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: "220px",
                  background: "#f5f0e8",
                  borderRadius: "6px",
                  padding: "14px 14px 18px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  transform: "rotate(2deg)",
                }}
              >
                {/* Masthead */}
                <div style={{ borderBottom: "3px solid #1a1a1a", paddingBottom: "6px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#444", marginBottom: "2px", textAlign: "center" }}>Est. 1881 · Chandigarh</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, textAlign: "center", color: "#0a0a0a", lineHeight: 1, letterSpacing: "-0.02em" }}>The Tribune</div>
                  <div style={{ height: "2px", background: "#1a1a1a", margin: "5px 0 3px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", color: "#555" }}>
                    <span>Vol. CXLIV No. 1</span>
                    <span style={{ fontStyle: "italic" }}>North India's Leading Daily</span>
                    <span>₹5.00</span>
                  </div>
                </div>
                {/* Fake headline */}
                <div style={{ fontSize: "11px", fontWeight: 700, lineHeight: 1.25, color: "#111", marginBottom: "6px" }}>
                  Book Your Ad Today — Reach Millions Across Punjab, Haryana & HP
                </div>
                {/* Fake columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {[0, 1].map(col => (
                    <div key={col}>
                      {[40, 55, 45, 60, 35].map((w, i) => (
                        <div key={i} style={{ height: "5px", background: "#bbb", borderRadius: "2px", width: `${w}%`, marginBottom: "3px" }} />
                      ))}
                    </div>
                  ))}
                </div>
                {/* Small ad box at bottom */}
                <div style={{ marginTop: "10px", border: "1px solid #aaa", borderRadius: "3px", padding: "5px 6px", background: "#ede8dc" }}>
                  <div style={{ fontSize: "7px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#333", borderBottom: "1px solid #bbb", marginBottom: "3px", paddingBottom: "2px" }}>ADVERTISEMENT</div>
                  <div style={{ fontSize: "8px", color: "#222", lineHeight: 1.4, fontStyle: "italic" }}>"Amit Advertising — Best Rates for Classifieds & Display Ads"</div>
                </div>
                {/* Tiny stamp */}
                <div style={{ marginTop: "8px", textAlign: "right", fontSize: "7px", color: "#888", letterSpacing: "0.1em" }}>AMIT ADVERTISING ✓</div>
              </motion.div>

              {/* Stats card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-white/15 backdrop-blur-md p-5 flex gap-6"
                style={{ background: "rgba(255,255,255,0.1)", minWidth: "220px" }}
              >
                {[["68+", "Newspapers"], ["500+", "Cities"]].map(([val, label]) => (
                  <div key={label}>
                    <div className="text-3xl font-semibold text-white leading-none">{val}</div>
                    <div className="text-xs text-white/65 mt-1">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ zIndex: 4 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
          <span className="text-[10px] uppercase tracking-[.25em] text-white/40">Scroll</span>
          <motion.div className="w-px h-8 bg-white/25" animate={{ scaleY: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} style={{ transformOrigin: "top" }} />
        </motion.div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-[#0f2f63] pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/15 pt-8">
            {[["68+", "Newspapers"], ["500+", "City Editions"], ["10K+", "Campaigns Booked"], ["15", "Years of Expertise"]].map(([val, label], i) => (
              <FadeUp key={label} delay={i * 0.09}>
                <div className="border-t-2 border-blue-400/40 pt-4">
                  <div className="text-4xl md:text-5xl font-semibold text-white leading-none">{val}</div>
                  <div className="text-sm text-white/55 mt-2">{label}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
            <FadeUp>
              <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center text-center shadow-sm flex-shrink-0">
                <div className="text-2xl font-semibold text-[#0f2f63]">100%</div>
                <div className="text-[10px] text-neutral-500 max-w-[7rem] mt-1 leading-tight">Online booking, instant confirmation</div>
              </div>
            </FadeUp>
            <FadeUp delay={0.12} className="max-w-md bg-white rounded-2xl p-6 shadow-sm">
              <div className="inline-flex bg-neutral-50 rounded-xl px-4 py-2 text-xl font-semibold text-[#0f2f63] mb-3">#01</div>
              <h3 className="text-lg font-semibold text-neutral-900">Trusted by serious advertisers</h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">From first-time classified bookers to national brands running multi-edition campaigns, advertisers choose us because the results show up in responses.</p>
            </FadeUp>
          </div>

          {/* Ghost heading */}
          <div className="pointer-events-none select-none" aria-hidden="true">
            <div className="flex justify-between items-baseline" style={{ fontSize: "clamp(2rem, 7vw, 6rem)", fontWeight: 500, textTransform: "uppercase", lineHeight: 1.02, letterSpacing: "-.02em" }}>
              <span className="text-neutral-900">REACH</span>
              <span className="text-neutral-200">THE</span>
            </div>
            <div className="flex justify-between items-baseline" style={{ fontSize: "clamp(2rem, 7vw, 6rem)", fontWeight: 500, textTransform: "uppercase", lineHeight: 1.02, letterSpacing: "-.02em" }}>
              <span className="text-neutral-200">RIGHT</span>
              <span className="text-neutral-900">READERS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AD FORMATS (Programs) ── */}
      <section className="bg-neutral-100 py-20" id="formats">
        <div className="container mx-auto px-6">
          <FadeUp>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />Ad formats
            </span>
            <h2 className="mt-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 500, lineHeight: 0.95, letterSpacing: "-.02em" }}>
              Built for<br />every budget
            </h2>
          </FadeUp>

          <ul className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
            {[
              { idx: "01", name: "Classified Text", desc: "Word-based ads for matrimonial, recruitment, property & more.", Icon: FileText, href: "/booking" },
              { idx: "02", name: "Classified Display", desc: "Box ads with images & custom design — maximum visual impact.", Icon: Layout, href: "/booking" },
              { idx: "03", name: "Display Ads", desc: "Full-page, half-page, quarter-page across premium newspapers.", Icon: LayoutGrid, href: "/booking" },
              { idx: "04", name: "Multi-Edition Packages", desc: "Book across 5, 10, or all editions in one click — best value.", Icon: Package, href: "/booking" },
            ].map(({ idx, name, desc, Icon, href }, i) => (
              <FadeUp key={idx} delay={i * 0.08}>
                <li>
                  <a href={href} className="flex items-center gap-5 py-7 group hover:bg-white/60 rounded-xl px-3 -mx-3 transition-colors">
                    <span className="text-sm font-semibold text-neutral-400 w-8 flex-shrink-0">{idx}</span>
                    <div className="flex-1">
                      <div className="text-xl md:text-2xl font-semibold text-neutral-900 group-hover:text-[#0f2f63] transition-colors" style={{ letterSpacing: "-.01em" }}>{name}</div>
                      <div className="text-sm text-neutral-500 mt-1">{desc}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-neutral-200 grid place-items-center group-hover:border-[#0f2f63] group-hover:bg-[#0f2f63] transition-all flex-shrink-0">
                      <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors group-hover:translate-x-0.5" />
                    </div>
                  </a>
                </li>
              </FadeUp>
            ))}
          </ul>
        </div>
      </section>

      {/* ── NEWSPAPER NETWORK ── */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
            <div>
              <FadeUp>
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />Our network
                </span>
                <h2 className="mt-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 500, lineHeight: 0.95, letterSpacing: "-.02em" }}>
                  Browse Our<br />Newspaper<br />Network
                </h2>
                <p className="text-neutral-500 text-sm mt-6 leading-relaxed max-w-md">
                  Choose from 68+ daily and weekly newspapers across India — from national heavyweights to regional editions — and reach your exact audience, wherever they are.
                </p>
                <a href="/booking" className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold uppercase tracking-wide bg-[#0f2f63] text-white hover:bg-blue-800 transition-colors">
                  Book Across Papers <ArrowRight className="h-4 w-4" />
                </a>
              </FadeUp>
            </div>

            <div className="flex items-end gap-4">
              {[
                { label: "National Dailies", sub: "TOI, HT, The Hindu, Indian Express & more.", color: "rgba(15,47,99,0.45)" },
                { label: "Regional Press", sub: "Dainik Jagran, Amar Ujala, Tribune & 50+ more.", color: "rgba(11,110,151,0.5)" }
              ].map(({ label, sub, color }, i) => (
                <FadeUp key={label} delay={i * 0.15} className="flex-1">
                  <div
                    className="rounded-2xl overflow-hidden relative"
                    style={{ aspectRatio: "3/4", marginBottom: i === 1 ? "2rem" : "0", background: i === 0 ? "#1e3a8a" : "#0e7490" }}
                  >
                    {/* Decorative newspaper grid pattern */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(255,255,255,.4) 18px,rgba(255,255,255,.4) 19px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(255,255,255,.2) 60px,rgba(255,255,255,.2) 61px)"
                    }} />
                    <div className="absolute inset-x-3 bottom-3 rounded-xl p-3" style={{ background: color, backdropFilter: "blur(8px)" }}>
                      <div className="text-sm font-semibold text-white">{label}</div>
                      <div className="text-[11px] text-white/80 mt-0.5">{sub}</div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COST ESTIMATOR ── */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="w-full md:w-1/2">
              <FadeUp>
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />Transparent pricing
                </span>
                <h2 className="mt-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 500, lineHeight: 0.95, letterSpacing: "-.02em" }}>
                  Instant Cost<br />Estimator
                </h2>
                <p className="text-neutral-500 mt-5 leading-relaxed">Get an estimated cost in seconds. No hidden charges, no long phone calls.</p>
                <ul className="mt-6 space-y-3">
                  {["Real-time rates from publications", "Compare prices across newspapers", "Instant size-based calculations"].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-neutral-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />{item}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowRateCardModal(true)} className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold uppercase tracking-wide bg-neutral-900 text-white hover:bg-[#0f2f63] transition-colors">
                  View Full Rate Card
                </button>
              </FadeUp>
            </div>

            <FadeUp delay={0.15} className="w-full md:w-1/2">
              <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-[#0f2f63] via-blue-400 to-[#0f2f63]" />
                <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
                  <h3 className="flex items-center gap-2 font-semibold text-neutral-900">
                    <Clock className="h-4 w-4 text-blue-600" />Quick Quote
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Newspaper</label>
                      <Select value={estimatorData.newspaper} onValueChange={v => setEstimatorData(d => ({ ...d, newspaper: v }))}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select Paper" /></SelectTrigger>
                        <SelectContent>{newspapers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Ad Type</label>
                      <Select value={estimatorData.adType} onValueChange={v => setEstimatorData(d => ({ ...d, adType: v }))}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select Type" /></SelectTrigger>
                        <SelectContent>{adTypes.map((t: any) => <SelectItem key={t.id} value={t.name.toLowerCase().replace(' ', '_')}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">City / Edition</label>
                    <Select value={estimatorData.city} onValueChange={v => setEstimatorData(d => ({ ...d, city: v }))}>
                      <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Choose City" /></SelectTrigger>
                      <SelectContent>{cities.map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Date</label>
                      <Input type="date" className="h-10 text-sm" value={estimatorData.date} onChange={e => setEstimatorData(d => ({ ...d, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Lines</label>
                      <Select value={estimatorData.size} onValueChange={v => setEstimatorData(d => ({ ...d, size: v }))}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{["5", "10", "15", "20"].map(n => <SelectItem key={n} value={n}>{n} Lines</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-dashed border-neutral-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-neutral-500">Estimated Cost</span>
                      <span className="text-2xl font-bold text-[#0f2f63]">₹ {estimatedCost.toLocaleString()}</span>
                    </div>
                    <a href="/booking" className="block w-full text-center rounded-full py-3 bg-[#0f2f63] text-white text-sm font-semibold uppercase tracking-wide hover:bg-blue-800 transition-colors">
                      Proceed to Book
                    </a>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="py-20 bg-[#0f2f63] text-white">
        <div className="container mx-auto px-6">
          <FadeUp>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Why choose us
            </span>
            <h2 className="mt-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 500, lineHeight: 0.95, letterSpacing: "-.02em" }}>
              A network that<br />keeps delivering
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { title: "Lowest Rates", desc: "Cheaper than direct rates due to bulk booking with publications.", icon: "₹" },
              { title: "Free Ad Design", desc: "Professional design assistance at no extra cost to you.", icon: "✦" },
              { title: "1000+ Clients", desc: "Trusted by businesses and individuals across the country.", icon: "★" },
              { title: "Pan-India Reach", desc: "Any corner of India with our extensive 68+ newspaper network.", icon: "◉" },
            ].map(({ title, desc, icon }, i) => (
              <FadeUp key={title} delay={i * 0.1}>
                <div className="border-t border-white/20 pt-5">
                  <div className="text-2xl text-blue-300 mb-3">{icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-white" id="reviews">
        <div className="container mx-auto px-6">
          <FadeUp>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />What advertisers say
            </span>
            <h2 className="mt-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 500, lineHeight: 0.95, letterSpacing: "-.02em" }}>
              Loved by<br />our clients
            </h2>
          </FadeUp>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
            {TESTIMONIALS.map(({ quote, name, role }, i) => (
              <FadeUp key={name} delay={i * 0.12}>
                <li className="bg-neutral-50 rounded-2xl p-6 flex flex-col justify-between h-full hover:-translate-y-1 transition-transform duration-300">
                  <div>
                    <div className="text-4xl text-blue-600 leading-none mb-3">"</div>
                    <p className="text-neutral-800 leading-relaxed">{quote}</p>
                  </div>
                  <div className="border-t border-neutral-200 pt-4 mt-6">
                    <div className="font-semibold text-neutral-900">{name}</div>
                    <div className="text-sm text-neutral-500 mt-0.5">{role}</div>
                  </div>
                </li>
              </FadeUp>
            ))}
          </ul>
        </div>
      </section>

      {/* ── ABOUT STRIP ── */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-6">
          <FadeUp>
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-neutral-100 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#0f2f63] mb-4">About Amit Advertising</h2>
                <p className="text-neutral-600 mb-4 leading-relaxed text-sm">Founded in 2010, Amit Advertising has grown to become one of India's most trusted advertising booking agencies. We bridge the gap between advertisers and publications — offering seamless, transparent, and cost-effective campaigns.</p>
                <p className="text-neutral-600 mb-6 leading-relaxed text-sm">Whether you are a small business looking for local reach or a corporation planning a national campaign, our team is here every step of the way.</p>
                <a href="mailto:amitadvt1@gmail.com" className="text-sm font-bold text-[#0f2f63] hover:text-blue-600 transition-colors flex items-center gap-1">Contact Us <ArrowRight className="h-4 w-4" /></a>
              </div>
              <div className="w-full md:w-48 h-48 bg-[#0f2f63] rounded-2xl flex items-center justify-center flex-shrink-0">
                <div className="text-center text-white">
                  <div className="text-5xl font-bold">15+</div>
                  <div className="text-sm text-white/70 mt-1">Years of Excellence</div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER CTA + FOOTER ── */}
      <footer className="bg-[#0f2f63] text-white rounded-t-3xl mx-0 mt-0">
        {/* CTA */}
        <div className="container mx-auto px-6 pt-16 pb-10 border-b border-white/15 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Get started
            </span>
            <div className="mt-4" style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 500, textTransform: "uppercase", lineHeight: 0.92, letterSpacing: "-.02em" }}>
              Ready to<br />go to print?
            </div>
          </div>
          <a href="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold uppercase tracking-wide bg-white text-[#0f2f63] hover:bg-blue-100 transition-colors flex-shrink-0">
            Book a Campaign <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Footer columns */}
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 bg-white/15 rounded-md flex items-center justify-center text-white font-bold text-base border border-white/20">A</div>
              <span className="text-lg font-bold tracking-tight">Amit Advertising</span>
            </div>
            <p className="text-sm text-white/55 leading-relaxed mb-6">Simplifying advertisement booking across India. Trusted, Transparent, Timely.</p>
            <address className="not-italic text-sm text-white/70 space-y-1">
              <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-white/40 flex-shrink-0 mt-0.5" />SCO 410, First Floor, Sector 8, Panchkula, Haryana 134109</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-white/40 flex-shrink-0" />+91 94170 80721</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-white/40 flex-shrink-0" />amitadvt1@gmail.com</p>
            </address>
          </div>
          {[
            { head: "Ad Formats", links: [["Classified Text", "/booking"], ["Classified Display", "/booking"], ["Display Ads", "/booking"], ["Multi-Edition", "/booking"]] },
            { head: "Newspapers", links: [["The Tribune", "/booking"], ["Times of India", "/booking"], ["Hindustan Times", "/booking"], ["All 68+ Papers", "/booking"]] },
            { head: "Company", links: [["About Us", "#"], ["Rate Cards", "/rate-card"], ["My Ad History", "/login"], ["Contact", "#contact"]] },
          ].map(({ head, links }) => (
            <nav key={head}>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40 mb-4">{head}</div>
              <ul className="space-y-3">
                {links.map(([label, href]) => (
                  <li key={label}><a href={href} className="text-sm text-white/70 hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Footer bottom */}
        <div className="container mx-auto px-6 pb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/10 pt-6">
          <p className="text-sm text-white/50">© {new Date().getFullYear()} Amit Advertising Agency. All rights reserved.</p>
          <div className="flex gap-5">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="text-white/50 hover:text-white transition-colors"><Icon className="h-4 w-4" /></a>
            ))}
          </div>
          <nav className="flex gap-5">
            {["Privacy", "Terms", "Refund Policy"].map(l => (
              <a key={l} href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a>
            ))}
          </nav>
        </div>
      </footer>

      {/* ── RATE CARD MODAL ── */}
      <AnimatePresence>
        {showRateCardModal && (
          <motion.div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRateCardModal(false)}>
            <motion.div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-[#0f2f63]">Rate Card</h2>
                <button onClick={() => setShowRateCardModal(false)} className="p-2 rounded-full hover:bg-neutral-100"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6">
                {selectedRateCard ? (
                  <>
                    <img src={`/api/rate-cards/${selectedRateCard.id}/image`} alt="Rate Card" className="w-full h-auto rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {rateCards.length > 1 && (
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {rateCards.map((card: any) => (
                          <button key={card.id} onClick={() => setSelectedRateCard(card)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedRateCard.id === card.id ? "bg-[#0f2f63] text-white" : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"}`}>
                            {card.imageName || "Rate Card"}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 text-neutral-500">No rate cards uploaded yet.<br /><span className="text-sm">Upload one via the admin panel.</span></div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
