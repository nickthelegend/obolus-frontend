'use client';

import React, { useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { Header } from '@/components/ui/Header';
import { IdentityOnboarding } from '@/components/perp/IdentityOnboarding';
import { PerpTerminal } from '@/components/perp/PerpTerminal';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';

export default function PerpPage() {
    const { address, status } = useAccount();
    const { tongoPrivKey, setTongoPrivKey } = useStore();

    // Initial check for stored key
    useEffect(() => {
        if (address && !tongoPrivKey) {
            const stored = localStorage.getItem(`tongo_priv_${address}`);
            if (stored) setTongoPrivKey(stored);
        }
    }, [address, tongoPrivKey, setTongoPrivKey]);

    return (
        <div className="h-screen w-screen bg-background overflow-hidden flex flex-col relative text-foreground selection:bg-primary/30">
            <Header />

            <main className="flex-1 w-full h-full relative p-2 md:p-4 pt-16 md:pt-20">
                <AnimatePresence mode="wait">
                    {!tongoPrivKey ? (
                        <motion.div
                            key="onboarding"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-center h-full w-full"
                        >
                            <IdentityOnboarding onDerived={setTongoPrivKey} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full w-full"
                        >
                            <PerpTerminal />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
