'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { Shield, Zap, Lock, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { CTASection } from '@/components/ui/hero-dithering-card';
import { InteractiveNebulaShader } from '@/components/ui/liquid-shader';
import AnoAI from '@/components/ui/animated-shader-background';
import ShaderAnimation from '@/components/ui/spiral-shader';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-stark-orange/30 overflow-x-hidden relative">
      <Header />

      {/* Global Background (Spiral Shader for entire page atmosphere) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none opacity-20 mix-blend-screen z-0">
        <ShaderAnimation />
      </div>

      {/* Hero 1: The CTA Section (Dithering Card) */}
      <div className="pt-32 relative z-10 w-full">
        <CTASection />
      </div>

      {/* Hero 2: Security & Encryption */}
      <section className="py-32 relative overflow-hidden bg-black/60 border-y border-white/5 mt-20">
        {/* Liquid Nebula Background for Security */}
        <InteractiveNebulaShader className="opacity-40" />

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 flex justify-center items-center"
            style={{ minHeight: "400px" }}
          >
            <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center bg-black/50 rounded-full border border-stark-orange/20 shadow-[0_0_100px_rgba(228,65,52,0.15)] backdrop-blur-sm">
              <Shield className="w-32 h-32 md:w-48 md:h-48 text-stark-orange drop-shadow-[0_0_30px_rgba(228,65,52,0.8)]" />
              <div className="absolute inset-0 rounded-full border border-stark-orange animate-ping opacity-20" style={{ animationDuration: '3s' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 order-1 lg:order-2"
          >
            <div className="w-12 h-12 bg-stark-orange/10 rounded-2xl flex items-center justify-center border border-stark-orange/20">
              <Lock className="w-6 h-6 text-stark-orange" />
            </div>
            <h2 className="text-5xl font-black tracking-tighter">Institutional Privacy <br /> <span className="text-stark-orange">at Retail Speed.</span></h2>
            <div className="space-y-6">
              {[
                { title: "Point-to-Point Encryption", desc: "Your balance is encrypted locally. Only you hold the viewing key." },
                { title: "Sealed Orderbook", desc: "No front-running. Prices and amounts are hidden until execution." },
                { title: "Homomorphic Settlements", desc: "Profit and Loss updates calculated on-chain without decryption." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full border border-stark-orange/50 flex items-center justify-center group-hover:bg-stark-orange/20 transition-colors">
                    <CheckCircle className="w-3 h-3 text-stark-orange" />
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
      <section className="py-32 relative min-h-screen flex items-center">
        {/* Abstract Network Node Background (AnoAI) */}
        <AnoAI className="opacity-80" />

        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-stark-blue/30 border border-stark-blue/50 rounded-full text-stark-blue text-[10px] font-bold uppercase tracking-widest text-blue-400">
              <Globe className="w-3 h-3 text-blue-400" /> Audit-Ready Infrastructure
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-tight">
              Privacy That <br />
              <span className="italic font-light text-foreground/80">Plays by the Rules.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              Total transparency for compliance, total privacy for trading.
              Our **Selective Disclosure** portal allows you to share trade proofs
              with auditors without exposing your master keys.
            </p>
            <div className="flex gap-6 pt-4">
              <div>
                <div className="text-3xl font-black text-stark-orange mb-1">0.8s</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Settlement Time</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl font-black text-stark-orange mb-1">∞</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Privacy Persistence</div>
              </div>
            </div>
            <Link href="/auditor" className="inline-flex items-center gap-2 text-stark-orange font-bold group mt-8">
              Explore Auditor Portal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: 5 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="relative hidden lg:flex justify-end items-center"
          >
            <div className="text-right p-8 bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl max-w-sm shadow-2xl relative z-10">
              <h4 className="font-mono text-stark-orange text-sm mb-4">{"// PROOF_GENERATED"}</h4>
              <div className="space-y-2 opacity-70">
                <div className="h-2 w-full bg-white/10 rounded overflow-hidden">
                  <div className="h-full bg-stark-orange w-1/3 animate-pulse" />
                </div>
                <div className="h-2 w-3/4 bg-white/10 rounded" />
                <div className="h-2 w-5/6 bg-white/10 rounded" />
                <div className="h-2 w-1/2 bg-white/10 rounded" />
              </div>
              <div className="mt-8 pt-4 border-t border-white/10">
                <span className="text-xs text-muted-foreground">Zero-Knowledge Attestation Valid</span>
                <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer / CTA */}
      <section className="py-32 bg-gradient-to-t from-stark-orange/10 to-transparent border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6 text-center space-y-12">
          <h2 className="text-6xl font-black tracking-tighter">READY TO GO<br />UNDERCOVER?</h2>
          <Link href="/perp" className="inline-flex px-12 py-6 bg-stark-orange text-white rounded-2xl font-black text-2xl hover:scale-105 transition-all shadow-[0_20px_50px_rgba(228,65,52,0.3)] group">
            Start Trading <Zap className="w-8 h-8 ml-4 group-hover:animate-bounce" />
          </Link>
          <div className="pt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
            <div className="font-orbitron font-black text-2xl tracking-widest text-[#E44134]">STARKNET</div>
            <div className="font-orbitron font-black text-2xl tracking-widest text-[#E6E6FA]">PYTH</div>
            <div className="font-orbitron font-black text-2xl tracking-widest text-[#3A1E8D]">TONGO</div>
            <div className="font-orbitron font-black text-2xl tracking-widest text-white">OBOLUS</div>
          </div>
        </div>
      </section>
    </div>
  );
}
