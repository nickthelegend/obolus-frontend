import { ArrowRight } from "lucide-react"
import { useState, Suspense, lazy } from "react"
import Link from "next/link"

const Dithering = lazy(() =>
    import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
)

export function CTASection() {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <section className="py-12 w-full flex justify-center items-center px-4 md:px-6 relative z-10">
            <div
                className="w-full max-w-7xl relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative overflow-hidden rounded-[48px] border border-stark-orange/20 bg-background/50 backdrop-blur-md shadow-[0_0_50px_rgba(228,65,52,0.1)] min-h-[600px] md:min-h-[600px] flex flex-col items-center justify-center duration-500 hover:shadow-[0_0_80px_rgba(228,65,52,0.2)]">
                    <Suspense fallback={<div className="absolute inset-0 bg-muted/20" />}>
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
                            <Dithering
                                colorBack="#050507" // Background
                                colorFront="#E44134"  // Accent (Stark Orange)
                                shape="warp"
                                type="4x4"
                                speed={isHovered ? 0.6 : 0.2}
                                className="size-full"
                                minPixelRatio={1}
                            />
                        </div>
                    </Suspense>

                    <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">

                        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-stark-orange/30 bg-stark-orange/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-stark-orange backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stark-orange opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-stark-orange"></span>
                            </span>
                            Starknet Native Privacy
                        </div>

                        {/* Headline */}
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground mb-8 leading-[1]">
                            TRADE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stark-orange via-stark-purple to-stark-blue">WITHOUT</span> <br />
                            FOOTPRINTS.
                        </h2>

                        {/* Description */}
                        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
                            Obolus is the first sub-second Perpetual DEX on Starknet powered by
                            **ElGamal Homomorphic Encryption**. Keep your strategy yours.
                        </p>

                        {/* Button */}
                        <Link href="/perp" className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-stark-orange px-12 text-base font-black text-white transition-all duration-300 hover:bg-stark-orange/90 hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(228,65,52,0.5)]">
                            <span className="relative z-10">Start Trading</span>
                            <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
