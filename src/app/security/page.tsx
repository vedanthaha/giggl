import { AsciiArt } from '@/components/ui/ember'
import localFont from 'next/font/local'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import FooterSection from '@/components/ui/footer'

const svetze = localFont({ src: '../fonts/Svetze.otf' })
const ttHoves = localFont({ src: '../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../fonts/Astonpoliz.otf' })

export default function SecurityPage() {
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
                    <Shield className="w-12 h-12 text-white" />
                    <h1 className={`text-5xl md:text-7xl font-bold tracking-tight text-white ${svetze.className}`}>
                        Security.
                    </h1>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className={`text-xl text-primary font-bold tracking-widest uppercase ${astonpoliz.className}`}>
                            Uncompromising Architecture
                        </h2>
                        <p className={`text-gray-300 text-lg leading-relaxed ${ttHoves.className}`}>
                            Your conversations are protected by state-of-the-art end-to-end encryption. Every message, image, and connection is cryptographically scrambled before it ever leaves your device, ensuring that no one—not even us—can decipher your data. 
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className={`text-xl text-primary font-bold tracking-widest uppercase ${astonpoliz.className}`}>
                            Zero-Knowledge Proofs
                        </h2>
                        <p className={`text-gray-300 text-lg leading-relaxed ${ttHoves.className}`}>
                            We operate on a zero-knowledge framework. We do not store your encryption keys, meaning it is mathematically impossible for us to access your private spaces. Your data belongs exclusively to you.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className={`text-xl text-primary font-bold tracking-widest uppercase ${astonpoliz.className}`}>
                            Biometric Locking
                        </h2>
                        <p className={`text-gray-300 text-lg leading-relaxed ${ttHoves.className}`}>
                            Security extends beyond the network. Giggl integrates deeply with your device's native hardware security, allowing you to lock your most sensitive chats behind biometric authentication. Physical and digital safety, perfectly harmonized.
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
