"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import MarketingLayout from "@/components/layout/marketing-layout";
import {
  Upload,
  Cpu,
  CheckCircle,
  ScanText,
  Users,
  BarChart3,
  FileCheck,
  Layers,
  UserPlus,
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation wrapper                                                  */
/* ------------------------------------------------------------------ */

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <MarketingLayout>
      {/* ============================================================ */}
      {/*  1. Hero Section                                             */}
      {/* ============================================================ */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left – copy */}
          <FadeIn>
            <div className="flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Petition Verification
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-foreground">
                Verify Petition Signatures{" "}
                <span className="gradient-text">10x Faster</span>
              </h1>

              <p className="text-lg lg:text-xl text-muted leading-relaxed max-w-lg">
                AI-powered OCR reads every signature, then intelligently matches
                against voter databases with fuzzy logic&mdash;so you catch more
                valid signatures in a fraction of the time.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white font-semibold text-base shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border-2 border-border text-foreground font-semibold text-base hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  Watch Demo
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Right – mockup */}
          <FadeIn delay={0.2}>
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-success/20 blur-2xl scale-105" />

              {/* Card */}
              <div className="relative rounded-2xl bg-white border border-border/60 shadow-2xl shadow-primary/10 overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border/60 bg-card-hover/50">
                  <div className="w-3 h-3 rounded-full bg-danger/70" />
                  <div className="w-3 h-3 rounded-full bg-warning/70" />
                  <div className="w-3 h-3 rounded-full bg-success/70" />
                  <span className="ml-3 text-xs text-muted font-medium">
                    Petition Pilot &mdash; Verification
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  {/* Petition image placeholder */}
                  <div className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-border/40 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ScanText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          petition_ward7_pg3.pdf
                        </div>
                        <div className="text-[11px] text-muted">
                          Page 3 of 12 &middot; 24 signatures detected
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-6 rounded bg-slate-200/80 animate-pulse"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Matched results */}
                  {[
                    { name: "Maria J. Thompson", addr: "1247 Oak St NW", pct: 98 },
                    { name: "David Chen-Williams", addr: "892 Elm Ave SE", pct: 94 },
                    { name: "Robert A. Jackson", addr: "3301 Pine Rd NE", pct: 87 },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center justify-between rounded-xl bg-white border border-border/40 px-4 py-3 hover:border-success/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-success" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {row.name}
                          </div>
                          <div className="text-xs text-muted">{row.addr}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-success">
                        {row.pct}% match
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  2. Trusted By / Stats Bar                                   */}
      {/* ============================================================ */}
      <section className="border-y border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { num: "10,000+", label: "Petitions Verified" },
                { num: "50+", label: "Campaigns" },
                { num: "99.2%", label: "Accuracy" },
                { num: "2x", label: "Faster" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <span className="text-3xl lg:text-4xl font-extrabold gradient-text">
                    {s.num}
                  </span>
                  <span className="text-sm text-muted font-medium">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  3. How It Works                                             */}
      {/* ============================================================ */}
      <section id="features" className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">
                How It Works
              </p>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Three steps to verified petitions
              </h2>
              <p className="mt-4 text-muted text-lg max-w-2xl mx-auto">
                From scanned sheets to validated signatures in minutes, not days.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Upload,
                title: "Upload",
                desc: "Upload scanned petition sheets and your voter file. We accept PDF, PNG, and CSV.",
                color: "primary",
              },
              {
                step: 2,
                icon: Cpu,
                title: "AI Processing",
                desc: "Our OCR engine reads every signature while fuzzy matching cross-references the voter database.",
                color: "accent",
              },
              {
                step: 3,
                icon: CheckCircle,
                title: "Verify & Export",
                desc: "Review matches in our intuitive interface, resolve edge cases, and export validated results.",
                color: "success",
              },
            ].map((card, i) => (
              <FadeIn key={card.step} delay={i * 0.15}>
                <div className="relative group rounded-2xl bg-white border border-border/60 p-8 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                  {/* Step number */}
                  <span className="absolute top-6 right-6 text-5xl font-black text-border/40 select-none">
                    {card.step}
                  </span>

                  <div
                    className={`w-12 h-12 rounded-xl bg-${card.color}/10 flex items-center justify-center mb-5`}
                  >
                    <card.icon className={`w-6 h-6 text-${card.color}`} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  4. Features Grid                                            */}
      {/* ============================================================ */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">
                Features
              </p>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Everything you need to verify at scale
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ScanText,
                title: "AI-Powered OCR",
                desc: "State-of-the-art text recognition tuned for handwritten signatures and printed petition data.",
                badge: null,
              },
              {
                icon: Users,
                title: "Smart Voter Matching",
                desc: "Fuzzy matching algorithms handle misspellings, nicknames, and address variations with confidence scoring.",
                badge: null,
              },
              {
                icon: BarChart3,
                title: "Real-Time Analytics",
                desc: "Track verification progress, validity rates, and team performance with live dashboards.",
                badge: "NEW",
              },
              {
                icon: FileCheck,
                title: "Compliance Reports",
                desc: "Generate audit-ready reports that meet state and local election board requirements.",
                badge: "NEW",
              },
              {
                icon: Layers,
                title: "Batch Processing",
                desc: "Upload hundreds of petition pages at once and let our pipeline do the heavy lifting.",
                badge: null,
              },
              {
                icon: UserPlus,
                title: "Team Collaboration",
                desc: "Assign pages to team members, leave notes, and track review status in real time.",
                badge: null,
              },
            ].map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <div className="group relative rounded-2xl border border-border/60 bg-white p-7 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full">
                  {f.badge && (
                    <span className="absolute top-5 right-5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
                      {f.badge}
                    </span>
                  )}

                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  5. Pricing Preview                                          */}
      {/* ============================================================ */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-3">
                Pricing
              </p>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-muted text-lg max-w-2xl mx-auto">
                Pay per signature verified. No hidden fees.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-border/60 bg-white p-8 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Starter
                  </h3>
                  <p className="text-sm text-muted">
                    For small campaigns and independent petitioners
                  </p>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    $0.10
                  </span>
                  <span className="text-muted text-sm">/signature</span>
                </div>
                <p className="text-sm text-muted mb-8">
                  + $199 one-time setup fee
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Software platform access",
                    "AI-powered OCR & matching",
                    "Basic analytics dashboard",
                    "CSV & PDF export",
                    "Email support",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  Get Started
                </Link>
              </div>
            </FadeIn>

            {/* Professional */}
            <FadeIn delay={0.12}>
              <div className="relative rounded-2xl border-2 border-primary bg-white p-8 shadow-xl shadow-primary/10 h-full flex flex-col">
                {/* Popular badge */}
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold tracking-wide uppercase">
                  Most Popular
                </span>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    Professional
                  </h3>
                  <p className="text-sm text-muted">
                    Full-service verification for serious campaigns
                  </p>
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    $0.30
                  </span>
                  <span className="text-muted text-sm">/signature</span>
                </div>
                <p className="text-sm text-muted mb-8">
                  + $399 one-time setup fee
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Starter",
                    "Full-service verification team",
                    "Compliance & audit reports",
                    "Dedicated account manager",
                    "Priority support & onboarding",
                    "Custom integrations",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.25}>
            <p className="text-center text-sm text-muted mt-8">
              Need a custom plan?{" "}
              <Link
                href="/pricing"
                className="text-primary font-medium hover:underline"
              >
                View full pricing details &rarr;
              </Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  6. Final CTA                                                */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-[#312e81]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.15),transparent_60%)]" />

        <div className="relative max-w-4xl mx-auto px-6 py-24 lg:py-32 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              No credit card required
            </div>

            <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
              Ready to modernize your
              <br />
              petition process?
            </h2>

            <p className="text-lg text-white/70 max-w-xl mx-auto mb-10">
              Join campaigns across the country that are saving time, cutting
              costs, and verifying more signatures with Petition Pilot.
            </p>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold text-lg shadow-2xl shadow-black/20 hover:bg-white/90 hover:scale-[1.02] transition-all"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </MarketingLayout>
  );
}
