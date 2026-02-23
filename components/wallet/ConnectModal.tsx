"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Connector, useConnect } from "@starknet-react/core";
import { X } from "lucide-react";

export default function ConnectModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { connectors, connect } = useConnect();
    const overlayRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only show wallets that are actually installed
    const availableConnectors = useMemo(
        () => connectors.filter((c) => c.available()),
        [connectors]
    );

    function handleConnectWallet(connector: Connector) {
        connect({ connector });
        onClose();
    }

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95"
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <div className="w-full max-w-[380px] rounded-2xl bg-[#111111] border border-border p-6 shadow-2xl animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground">
                        Connect a Wallet
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Wallet list */}
                <div className="flex flex-col gap-3">
                    {availableConnectors.length > 0 ? availableConnectors.map((connector) => (
                        <WalletOption
                            key={connector.id}
                            connector={connector}
                            onClick={() => handleConnectWallet(connector)}
                        />
                    )) : (
                        <div className="text-center p-4 text-muted-foreground text-sm bg-muted/20 border border-border/50 rounded-xl">
                            No Starknet wallets detected. Please install Argent X or Braavos.
                        </div>
                    )}
                </div>

                <p className="text-xs text-muted-foreground text-center mt-6">
                    By connecting, you agree to the Terms of Service
                </p>
            </div>
        </div>,
        document.body
    );
}

function WalletOption({
    connector,
    onClick,
}: {
    connector: Connector;
    onClick: () => void;
}) {
    const icon =
        typeof connector.icon === "object"
            ? (connector.icon.dark as string)
            : (connector.icon as string);

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 w-full p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group text-left"
        >
            {icon ? (
                <img
                    src={icon}
                    alt={connector.name}
                    className="w-10 h-10 rounded-xl object-cover"
                />
            ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {connector.name.charAt(0)}
                </div>
            )}
            <div className="flex-1">
                <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {connector.name}
                </div>
                <div className="text-xs text-muted-foreground">Starknet wallet</div>
            </div>
        </button>
    );
}
