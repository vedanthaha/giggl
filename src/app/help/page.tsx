import { AsciiArt } from '@/components/ui/ember'
import localFont from 'next/font/local'
import Link from 'next/link'
import { ArrowLeft, LifeBuoy, Mail } from 'lucide-react'
import MotionButton from '@/components/ui/motion-button'
import FooterSection from '@/components/ui/footer'

const svetze = localFont({ src: '../fonts/Svetze.otf' })
const ttHoves = localFont({ src: '../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../fonts/Astonpoliz.otf' })

export default function HelpPage() {
    return (
        <div className="relative min-h-screen w-full bg-[#0a0a0a] text-white selection:bg-primary/30 flex flex-col">
            <div className="fixed inset-0 z-0">
                <AsciiArt className="h-full w-full object-cover opacity-50 grayscale" />
                <div className="absolute inset-0 bg-[#0a0a0a]/40" />
            </div>

            <div className="relative z-10 flex-1 flex items-center justify-center py-20 px-6 w-full">
                <div className="w-full max-w-4xl mx-auto p-8 md:p-16">
                <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white transition-colors mb-12">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className={`text-sm font-bold uppercase tracking-widest ${astonpoliz.className}`}>Return Home</span>
                </Link>

                <div className="mb-12 flex items-center gap-6">
                    <LifeBuoy className="w-12 h-12 text-white" />
                    <h1 className={`text-5xl md:text-7xl font-bold tracking-tight text-white ${svetze.className}`}>
                        Support.
                    </h1>
                </div>

                <div className="space-y-12">
                    <div className="space-y-4">
                        <p className={`text-gray-300 text-lg leading-relaxed ${ttHoves.className}`}>
                            Giggl is designed to be effortlessly intuitive, but if you've encountered an issue or simply have a question about how our privacy architecture works, we are here to provide clarity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05]">
                            <h3 className={`text-lg font-bold text-white mb-2 ${astonpoliz.className}`}>Account Recovery</h3>
                            <p className={`text-gray-400 text-sm leading-relaxed ${ttHoves.className}`}>
                                Because we operate on a zero-knowledge framework, we cannot recover forgotten passwords. Please ensure you keep your credentials secure.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05]">
                            <h3 className={`text-lg font-bold text-white mb-2 ${astonpoliz.className}`}>Encryption Details</h3>
                            <p className={`text-gray-400 text-sm leading-relaxed ${ttHoves.className}`}>
                                Wondering how our E2E encryption works? Reach out to our technical team for whitepapers and architecture breakdowns.
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/[0.05]">
                        <h2 className={`text-xl text-primary font-bold tracking-widest uppercase mb-6 ${astonpoliz.className}`}>
                            Contact Us
                        </h2>
                        <MotionButton href="mailto:support@giggl.app" label="SUPPORT@GIGGL.APP" classes="w-[320px]" />
                    </div>
                </div>
            </div>
            </div>

            <div className="relative z-10 w-full">
                <FooterSection />
            </div>
        </div>
    )
}
