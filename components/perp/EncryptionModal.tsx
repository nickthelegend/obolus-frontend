import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Cpu, CheckCircle2 } from 'lucide-react';

interface EncryptionModalProps {
    isOpen: boolean;
    onComplete: () => void;
    title?: string;
    ctSizeL?: string;
    ctSizeR?: string;
    ctPriceL?: string;
    ctPriceR?: string;
}

export function EncryptionModal({ isOpen, onComplete, title = "Tongo Encryption Protocol", ctSizeL, ctSizeR, ctPriceL, ctPriceR }: EncryptionModalProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setStep(0);
            return;
        }

        const timers = [
            setTimeout(() => setStep(1), 1000), // Encrypting size
            setTimeout(() => setStep(2), 2500), // Encrypting price
            setTimeout(() => setStep(3), 4000), // Generating ZK Proof
            setTimeout(() => {
                setStep(4);
                setTimeout(onComplete, 1200); // Auto close after success
            }, 6000), // Submitting
        ];

        return () => timers.forEach(clearTimeout);
    }, [isOpen, onComplete]);

    if (!isOpen) return null;

    const displaySizeL = ctSizeL ? `${ctSizeL.slice(0, 5)}...${ctSizeL.slice(-4)}` : '0x6b8...4a21';
    const displaySizeR = ctSizeR ? `${ctSizeR.slice(0, 5)}...${ctSizeR.slice(-4)}` : '0x1f4...bc99';
    const displayPriceL = ctPriceL ? `${ctPriceL.slice(0, 5)}...${ctPriceL.slice(-4)}` : '0x9a2...fe11';
    const displayPriceR = ctPriceR ? `${ctPriceR.slice(0, 5)}...${ctPriceR.slice(-4)}` : '0x33c...00da';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-black/90 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)]"
                >
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6 relative">
                            <div className="w-10 h-10 rounded-full bg-stark-purple/20 flex items-center justify-center relative z-10">
                                <Shield className="w-5 h-5 text-stark-purple" />
                                {step < 4 && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-2 border-stark-purple/30 border-t-stark-purple rounded-full"
                                    />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight">{title}</h3>
                                <p className="text-xs text-muted-foreground font-mono">ElGamal Homomorphic Encryption</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className={`flex items-start gap-4 transition-all duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
                                <div className="mt-1">{step > 0 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-stark-purple animate-pulse" />}</div>
                                <div>
                                    <p className="text-sm font-bold">Encrypting Size</p>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ct_L: {displaySizeL}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">ct_R: {displaySizeR}</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className={`flex items-start gap-4 transition-all duration-500 delay-100 ${step >= 1 ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
                                <div className="mt-1">{step > 1 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : step === 1 ? <Lock className="w-4 h-4 text-stark-purple animate-pulse" /> : <Lock className="w-4 h-4 text-white/20" />}</div>
                                <div>
                                    <p className="text-sm font-bold" style={{ opacity: step >= 1 ? 1 : 0.5 }}>Encrypting Limit Price</p>
                                    {step >= 1 && (
                                        <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                                            <p>ct_L: {displayPriceL}</p>
                                            <p>ct_R: {displayPriceR}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className={`flex items-start gap-4 transition-all duration-500 delay-100 ${step >= 2 ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
                                <div className="mt-1">{step > 2 ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : step === 2 ? <Cpu className="w-4 h-4 text-stark-orange animate-pulse" /> : <Cpu className="w-4 h-4 text-white/20" />}</div>
                                <div>
                                    <p className="text-sm font-bold" style={{ opacity: step >= 2 ? 1 : 0.5 }}>Generating Range Proof</p>
                                    {step >= 2 && (
                                        <p className="text-[10px] text-stark-orange font-mono mt-0.5">ZK Proof Generation...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 border-t border-white/5 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {step < 4 ? <span className="animate-pulse">Awaiting Signature...</span> : <span className="text-green-500">Execution Ready</span>}
                        </p>
                    </div>

                    {/* Matrix background effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://transparenttextures.com/patterns/binary-code.png')]" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
