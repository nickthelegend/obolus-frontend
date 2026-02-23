import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, ShieldCheck } from 'lucide-react';

const GradientBars: React.FC = () => {
    const [numBars] = useState(15);

    const calculateHeight = (index: number, total: number) => {
        const position = index / (total - 1);
        const maxHeight = 100;
        const minHeight = 30;

        const center = 0.5;
        const distanceFromCenter = Math.abs(position - center);
        const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);

        return minHeight + (maxHeight - minHeight) * heightPercentage;
    };

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 mix-blend-screen">
            <div
                className="flex h-full w-full items-end"
                style={{
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                }}
            >
                {Array.from({ length: numBars }).map((_, index) => {
                    const height = calculateHeight(index, numBars);
                    return (
                        <div
                            key={index}
                            style={{
                                flex: '1 0 calc(100% / 15)',
                                maxWidth: 'calc(100% / 15)',
                                height: '100%',
                                // Stark Orange rgb: 228, 65, 52. Stark Purple: 58, 30, 141
                                background: index % 2 === 0
                                    ? 'linear-gradient(to top, rgba(228, 65, 52, 0.8), transparent)'
                                    : 'linear-gradient(to top, rgba(58, 30, 141, 0.8), transparent)',
                                transform: `scaleY(${height / 100})`,
                                transformOrigin: 'bottom',
                                transition: 'transform 0.5s ease-in-out',
                                animation: 'pulseBar 2.5s ease-in-out infinite alternate',
                                animationDelay: `${index * 0.15}s`,
                                outline: '1px solid rgba(0, 0, 0, 0)',
                                boxSizing: 'border-box',
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export const AuditorHeroSection: React.FC = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center px-6 sm:px-8 md:px-12 overflow-hidden border-t border-white/5 bg-black">
            <GradientBars />

            <div className="relative z-10 text-center w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-screen py-8 sm:py-16">

                <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-stark-blue/20 border border-stark-blue/40 rounded-full text-stark-blue text-xs font-bold uppercase tracking-widest text-[#38BDF8] backdrop-blur-md animate-fadeIn">
                    <Globe className="w-4 h-4 text-[#38BDF8]" /> Audit-Ready Infrastructure
                </div>

                <h1 className="w-full text-foreground leading-tight tracking-tight mb-8 animate-fadeIn">
                    <span className="block font-black text-[clamp(2rem,6vw,5rem)] whitespace-nowrap drop-shadow-lg">
                        Compliance inside
                    </span>
                    <span className="block italic font-light text-[clamp(2rem,6vw,5rem)] whitespace-nowrap text-foreground/80">
                        the Zero-Knowledge Zone.
                    </span>
                </h1>

                <div className="mb-12 max-w-3xl px-4 animate-fadeIn" style={{ animationDelay: '200ms' }}>
                    <p className="text-[clamp(1rem,3vw,1.3rem)] text-muted-foreground leading-relaxed">
                        Total transparency for compliance, total privacy for your trades.
                        Connect our <span className="text-stark-orange font-bold">Selective Disclosure</span> portal to generate cryptographic
                        proofs for auditors without exposing your master keys.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 mb-12 animate-fadeIn" style={{ animationDelay: '300ms' }}>
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl flex-1 flex flex-col items-center justify-center">
                        <div className="text-5xl font-black text-stark-orange mb-2 drop-shadow-[0_0_15px_rgba(228,65,52,0.5)]">0.8s</div>
                        <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total Settlement</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl flex-1 flex flex-col items-center justify-center">
                        <div className="text-5xl font-black text-stark-purple mb-2 drop-shadow-[0_0_15px_rgba(58,30,141,0.5)]">∞</div>
                        <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Privacy Scope</div>
                    </div>
                </div>

                <div className="animate-fadeIn" style={{ animationDelay: '400ms' }}>
                    <Link
                        href="/auditor"
                        className="group relative inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-12 text-lg font-bold text-black transition-all duration-300 hover:bg-gray-200 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                        <ShieldCheck className="h-6 w-6 relative z-10 text-stark-purple" />
                        <span className="relative z-10">Explore Auditor Portal</span>
                        <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Required CSS animation for GradientBars */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes pulseBar {
          0% { opacity: 0.5; filter: brightness(0.8); }
          100% { opacity: 1; filter: brightness(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}} />
        </section>
    );
};
