import { AsciiArt } from '@/components/ui/ember'
import localFont from 'next/font/local'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import FooterSection from '@/components/ui/footer'

const svetze = localFont({ src: '../fonts/Svetze.otf' })
const ttHoves = localFont({ src: '../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../fonts/Astonpoliz.otf' })

export default function TermsPage() {
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
                    <FileText className="w-12 h-12 text-white" />
                    <h1 className={`text-5xl md:text-7xl font-bold tracking-tight text-white ${svetze.className}`}>
                        Terms.
                    </h1>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className={`text-xl text-primary font-bold tracking-widest uppercase ${astonpoliz.className}`}>
                            The Agreement
                        </h2>
                        <p className={`text-gray-300 text-lg leading-relaxed ${ttHoves.className}`}>
                            Our terms of service are designed to be as minimalist as our app. By using Giggl, you agree to treat others with respect and use the platform for its intended purpose: private, meaningful conversation.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className={`text-xl text-primary font-bold tracking-widest uppercase ${astonpoliz.className}`}>
                            Acceptable Use
                        </h2>
                        <p className={`text-gray-300 text-lg leading-relaxed ${ttHoves.className}`}>
                            While we cannot see what you say due to our encryption, we ask that you do not use Giggl for unlawful purposes. The network is built for privacy, not as a sanctuary for malice.
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className={`text-xl text-primary font-bold tracking-widest uppercase ${astonpoliz.className}`}>
                            Service Availability
                        </h2>
                        <p className={`text-gray-300 text-lg leading-relaxed ${ttHoves.className}`}>
                            We strive for constant uptime, but we are a boutique service. We reserve the right to perform maintenance to keep our encryption protocols and server infrastructure running at peak performance.
                        </p>
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
