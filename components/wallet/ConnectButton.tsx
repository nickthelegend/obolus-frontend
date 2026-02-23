"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useDisconnect } from "@starknet-react/core";
import { Copy, Check, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import ConnectModal from "@/components/wallet/ConnectModal";
import { useStore } from "@/lib/store";

export default function ConnectButton() {
    const { address, isConnected, isConnecting } = useAccount();
    const { disconnect } = useDisconnect();
    const { setAddress, setIsConnected } = useStore();

    const [showWalletModal, setShowWalletModal] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

    // Connect/Disconnect sync with store
    useEffect(() => {
        console.log("ConnectButton Account State:", { isConnected, address, isConnecting });
        if (isConnected && address) {
            console.log("Syncing address to store:", address);
            setAddress(address);
            setIsConnected(true);
        } else if (!isConnecting) {
            console.log("Not connected - clearing store address");
            setAddress(null);
            setIsConnected(false);
        }
    }, [isConnected, address, isConnecting, setAddress, setIsConnected]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setDropdownOpen(false);
    };

    return (
        <>
            <ConnectModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />

            {/* Loading state */}
            {isConnecting ? (
                <button disabled className="h-10 px-4 sm:px-5 rounded-xl bg-muted animate-pulse text-xs sm:text-sm font-medium text-muted-foreground border border-border">
                    Connecting...
                </button>
            ) : !isConnected ? (
                <button
                    onClick={() => setShowWalletModal(true)}
                    className="h-10 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-lg shadow-primary/20"
                >
                    Connect Wallet
                </button>
            ) : (
                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-border text-xs sm:text-sm font-mono font-medium transition-colors"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="hidden sm:inline">{shortAddress}</span>
                        <span className="sm:hidden">{address?.slice(0, 4)}...</span>
                        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 rounded-xl bg-[#111111] border border-border p-1.5 z-50">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                <span>{copied ? "Copied!" : "Copy address"}</span>
                            </button>

                            <a
                                href={`https://voyager.online/contract/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                                onClick={() => setDropdownOpen(false)}
                            >
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                <span>View on Explorer</span>
                            </a>

                            <div className="my-1 border-t border-border/50" />

                            <button
                                onClick={handleDisconnect}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Disconnect</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
