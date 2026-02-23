'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { Shield, Zap, Lock, Globe, ArrowRight, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 overflow-x-hidden">
      <Header />

      {/* Hero 1: The Privacy Dex */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
              <Zap className="w-3 h-3" /> Starknet Native Privacy
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              TRADE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">WITHOUT</span> <br />
              FOOTPRINTS.
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Obolus is the first sub-second Perpetual DEX on Starknet powered by
              **ElGamal Homomorphic Encryption**. Keep your strategy yours.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/perp" className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-primary/20">
                Launch App <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/options" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors">
                Binary Options
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-[100px] opacity-20" />
            <img
              src="/images/hero_perp.png"
              alt="Obolus Trading"
              className="relative z-10 w-full h-auto rounded-3xl shadow-2xl border border-white/10 ring-1 ring-white/20"
            />
          </motion.div>
        </div>
      </section>

      {/* Hero 2: Security & Encryption */}
      <section className="py-32 relative overflow-hidden bg-black/40 border-y border-white/5">
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <img
              src="/images/hero_security.png"
              alt="Security Shield"
              className="w-full max-w-lg mx-auto drop-shadow-[0_0_50px_rgba(16,185,129,0.2)]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 order-1 lg:order-2"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-5xl font-bold tracking-tight">Institutional Privacy <br />at Retail Speed.</h2>
            <div className="space-y-6">
              {[
                { title: "Point-to-Point Encryption", desc: "Your balance is encrypted locally. Only you hold the viewing key." },
                { title: "Sealed Orderbook", desc: "No front-running. Prices and amounts are hidden until execution." },
                { title: "Homomorphic Settlements", desc: "Profit and Loss updates calculated on-chain without decryption." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full border border-primary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{item.title}</h4>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hero 3: Zero-Knowledge Compliance */}
      <section className="py-32 relative">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
              <Globe className="w-3 h-3" /> Audit-Ready Infrastructure
            </div>
            <h2 className="text-5xl font-bold tracking-tight leading-tight">
              Privacy That <br />
              <span className="italic">Plays by the Rules.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Total transparency for compliance, total privacy for trading.
              Our **Selective Disclosure** portal allows you to share trade proofs
              with auditors without exposing your master keys.
            </p>
            <div className="flex gap-6 pt-4">
              <div>
                <div className="text-3xl font-black text-primary mb-1">0.8s</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Settlement Time</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl font-black text-primary mb-1">∞</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Privacy Persistence</div>
              </div>
            </div>
            <Link href="/auditor" className="inline-flex items-center gap-2 text-primary font-bold group">
              Explore Auditor Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: 5 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src="/images/hero_privacy.png"
              alt="Privacy Node"
              className="relative z-10 w-full h-auto drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* Footer / CTA */}
      <section className="py-32 bg-gradient-to-t from-primary/10 to-transparent border-t border-white/5">
        <div className="container mx-auto px-6 text-center space-y-12">
          <h2 className="text-6xl font-black tracking-tighter">READY TO GO<br />UNDERCOVER?</h2>
          <Link href="/perp" className="inline-flex px-12 py-6 bg-primary text-primary-foreground rounded-2xl font-black text-2xl hover:scale-105 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] group">
            Start Trading <Zap className="w-8 h-8 ml-4 group-hover:animate-bounce" />
          </Link>
          <div className="pt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="font-orbitron font-black text-2xl">STARKNET</div>
            <div className="font-orbitron font-black text-2xl">PYTH</div>
            <div className="font-orbitron font-black text-2xl">TONGO</div>
            <div className="font-orbitron font-black text-2xl">OBOLUS</div>
          </div>
        </div>
      </section>
    </div>
  );
}
