"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Cpu,
  Activity,
  Layers,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  Timer,
} from "lucide-react";
import { AspecLogo } from "@/components/aspec-logo";
import { Badge } from "@/components/ui/badge";

/* ──────────────────────────────────────────────────────────
   ASPEC Theme-aligned Landing Page
   ────────────────────────────────────────────────────────── */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const FEATURES = [
  {
    icon: Timer,
    tag: "MODUL 01",
    title: "Estimasi Sisa Umur Aset (RUL)",
    desc: "Memproyeksikan Remaining Useful Life (RUL) armada aset menggunakan model Machine Learning prediktif untuk meminimalkan kegagalan tak terduga.",
  },
  {
    icon: Cpu,
    tag: "MODUL 02",
    title: "Klasifikasi Keluhan NLP",
    desc: "Menganalisis teks deskripsi keluhan dari teknisi di lapangan secara instan untuk menentukan tingkat keparahan (Healthy, Warning, Critical).",
  },
  {
    icon: Layers,
    tag: "MODUL 03",
    title: "Klusterisasi Kerusakan KMeans",
    desc: "Mengelompokkan keluhan sejenis secara otomatis guna memetakan kerusakan dominan, kebutuhan suku cadang, dan estimasi biaya perbaikan.",
  },
  {
    icon: ClipboardCheck,
    tag: "MODUL 04",
    title: "Dashboard & Alur Kerja Terpadu",
    desc: "Memfasilitasi pelaporan teknisi hingga proses verifikasi manajer aset dalam satu sistem monitoring real-time yang tersinkronisasi.",
  },
];

const WORKFLOW = [
  { step: "01", title: "Laporan Lapangan", desc: "Teknisi memasukkan data aset dan catatan keluhan operasional secara berkala." },
  { step: "02", title: "Prediksi RUL & Keparahan", desc: "Model Machine Learning memproyeksikan sisa umur aset (RUL) dan memetakan tingkat keparahan masalah." },
  { step: "03", title: "Klusterisasi Kerusakan", desc: "Sistem mengelompokkan riwayat keluhan sejenis untuk merekomendasikan suku cadang dan biaya perbaikan." },
  { step: "04", title: "Pencegahan Terjadwal", desc: "Manajer menyetujui work order preventif sebelum terjadi kegagalan operasional aset." },
];

/* ── helpers ──────────────────────────────────────────────── */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

function Reveal({
  as: Tag = "div",
  className = "",
  delay = 0,
  children,
  ...rest
}: {
  as?: any;
  className?: string;
  delay?: number;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(22px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}


/* ── page ─────────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    const t = setTimeout(() => setVisible(true), 80);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="bg-background text-foreground relative font-sans overflow-x-hidden min-h-screen">
      <style>{`
        ${FONT_IMPORT}
        html {
          scroll-behavior: smooth;
        }
        .aspec-display { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }
        .aspec-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

        .aspec-grid {
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.15;
        }

        .aspec-feature-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .aspec-feature-card:hover {
          border-color: var(--cyan) !important;
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -15px rgba(6, 182, 212, 0.12);
        }
        .aspec-nav-link { position: relative; }
        .aspec-nav-link::after {
          content: ""; position: absolute; left: 0; bottom: -4px; height: 1px; width: 0;
          background: var(--cyan); transition: width 0.25s ease;
        }
        .aspec-nav-link:hover::after { width: 100%; }

        @keyframes ambient-glow {
          0%, 100% { opacity: 0.05; transform: scale(1) translate(0px, 0px); }
          50% { opacity: 0.09; transform: scale(1.08) translate(15px, -15px); }
        }
        .aspec-ambient-glow {
          animation: ambient-glow 12s ease-in-out infinite;
        }
      `}</style>

      {/* ── NAVBAR ────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-10 h-16 transition-all duration-300 border-b ${scrolled
          ? "bg-card/80 backdrop-blur-md border-border"
          : "bg-transparent border-transparent"
          }`}
      >
        <div className="flex items-center gap-3">
          <AspecLogo size={28} />
          <span className="aspec-display text-lg font-bold tracking-[0.14em] text-foreground">ASPEC</span>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-cyan/30 text-cyan bg-cyan/5 hidden sm:inline-flex">
            ML-RUL & NLP
          </Badge>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {[
            { label: "Fitur Utama", href: "#fitur" },
            { label: "Alur Sistem", href: "#cara-kerja" },
          ].map((n) => (
            <a key={n.label} href={n.href} className="aspec-nav-link hover:text-foreground transition-colors">
              {n.label}
            </a>
          ))}
        </div>

        <Link
          href="/login"
          className="aspec-display inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] bg-primary text-primary-foreground shadow-md shadow-primary/10"
        >
          Masuk Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      {/* ── HERO ──────────────────────────────────── */}
      <section className="relative px-6 pt-40 pb-24 md:pt-48 md:pb-32 flex items-center justify-center min-h-[90vh]">
        <div className="absolute inset-0 aspec-grid pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none aspec-ambient-glow"
          style={{ background: "radial-gradient(circle at 50% 50%, var(--cyan)/0.08, transparent 65%)" }}
        />
        <div
          className="max-w-[800px] w-full mx-auto text-center relative"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* copy */}
          <div
            className="aspec-mono inline-flex items-center gap-2.5 rounded px-3 py-1.5 text-[11px] tracking-widest mb-8 border border-cyan/30 bg-cyan/5 text-cyan mx-auto"
          >
            <Sparkles className="h-3.5 w-3.5" />
            INTEGRASI ML-RUL & NLP CLUSTERING
          </div>

          <h1
            className="aspec-display font-bold leading-[1.1] tracking-tight mb-6 text-foreground animate-fade-in"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}
          >
            Estimasi Sisa Umur Aset (RUL) & Klasifikasi Keluhan Kerusakan{" "}
            <br className="hidden md:inline" />
            <span className="text-cyan bg-gradient-to-r from-primary to-cyan bg-clip-text text-transparent">Secara Akurat.</span>
          </h1>

          <p className="text-base max-w-[620px] leading-relaxed mb-10 text-muted-foreground mx-auto">
            ASPEC menggabungkan pemodelan Machine Learning untuk memproyeksikan sisa umur operasional aset (RUL) dengan pemrosesan bahasa alami (NLP) guna mengklasifikasikan keparahan keluhan serta mengelompokkan pola kerusakan secara otomatis.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login"
              className="aspec-display inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] bg-gradient-to-r from-primary to-cyan text-white shadow-lg shadow-primary/20"
            >
              Mulai Analisis <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a
              href="#cara-kerja"
              className="aspec-display inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:bg-muted/40 border border-border text-foreground"
            >
              Pelajari Alur Sistem
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section id="fitur" className="py-24 md:py-32 px-6 border-t border-border relative">
        <div className="absolute inset-0 aspec-grid pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none aspec-ambient-glow"
          style={{ background: "radial-gradient(ellipse 60% 40% at 85% 20%, var(--cyan)/0.04, transparent 70%)" }}
        />
        <div className="max-w-[1240px] mx-auto relative">
          <Reveal className="mb-16 max-w-[560px]">
            <div className="aspec-mono inline-block text-[11px] tracking-widest mb-5 text-cyan">
              [ KEMAMPUAN SISTEM ]
            </div>
            <h2 className="aspec-display font-bold tracking-tight mb-4 text-3xl md:text-4xl text-foreground">
              Manajemen Pemeliharaan Cerdas
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              ASPEC menyediakan infrastruktur digital untuk mengotomatiskan analisis laporan teknisi dan menyajikannya dalam format data terstruktur.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <div
                  className="aspec-feature-card group relative rounded-xl p-8 bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-7">
                    <div
                      className="w-11 h-11 rounded-md flex items-center justify-center bg-cyan/10 border border-cyan/20"
                    >
                      <f.icon className="h-5 w-5 text-cyan" />
                    </div>
                    <span className="aspec-mono text-[10px] tracking-widest text-muted-foreground/60">{f.tag}</span>
                  </div>
                  <h3 className="aspec-display text-lg font-semibold mb-2.5 tracking-tight text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ───────────────────────────────── */}
      <section id="cara-kerja" className="py-24 md:py-32 px-6 bg-muted/10 border-y border-border">
        <div className="max-w-[1240px] mx-auto">
          <Reveal className="text-center mb-20">
            <div className="aspec-mono inline-block text-[11px] tracking-widest mb-5 text-cyan">
              [ ALUR PROSES ]
            </div>
            <h2 className="aspec-display font-bold tracking-tight text-3xl md:text-4xl text-foreground">
              Alur Operasional ASPEC
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 relative">
            <div
              className="hidden md:block absolute top-6 left-[12%] right-[12%] h-px"
              style={{ background: "repeating-linear-gradient(90deg, var(--border) 0 6px, transparent 6px 12px)", opacity: 0.8 }}
            />
            {WORKFLOW.map((w, i) => (
              <Reveal key={w.step} delay={i * 110} className="relative px-2">
                <div className="flex items-center gap-2 mb-5">
                  <span
                    className="aspec-mono flex items-center justify-center text-xs font-semibold rounded border border-cyan/40 text-cyan bg-cyan/5"
                    style={{ width: 32, height: 32 }}
                  >
                    {w.step}
                  </span>
                </div>
                <h3 className="aspec-display font-semibold text-[15px] mb-2 text-foreground">{w.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{w.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="py-28 md:py-36 px-6 relative text-center">
        <div className="absolute inset-0 aspec-grid pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none aspec-ambient-glow"
          style={{ background: "radial-gradient(circle at 50% 50%, var(--cyan)/0.06, transparent 60%)" }}
        />
        <Reveal className="max-w-[640px] mx-auto relative z-10">
          <div className="flex items-center justify-center mx-auto mb-8">
            <AspecLogo size={42} />
          </div>
          <h2 className="aspec-display font-bold tracking-tight mb-5 text-3xl md:text-5xl text-foreground">
            Mulai Optimasi Perawatan Aset
          </h2>
          <p className="text-base leading-relaxed mb-10 text-muted-foreground">
            Masuk ke panel kontrol utama ASPEC untuk memantau visualisasi kesehatan aset, prediksi RUL, dan hasil analisis kluster keluhan secara terpadu.
          </p>
          <Link
            href="/login"
            className="aspec-display inline-flex items-center gap-2 rounded-lg px-8 py-4 text-[15px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] bg-gradient-to-r from-primary to-cyan text-white shadow-lg shadow-primary/20"
          >
            Akses Dashboard Kontrol <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </Reveal>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer
        className="py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1240px] mx-auto border-t border-border"
      >
        <div className="flex items-center gap-2.5">
          <AspecLogo size={20} />
          <span className="aspec-display font-semibold tracking-[0.14em] text-sm text-foreground">ASPEC</span>
        </div>
        <p className="aspec-mono text-[11px] text-muted-foreground/60">
          © 2026 ASPEC — AI-Powered Asset Predictive Maintenance
        </p>
      </footer>
    </div>
  );
}
