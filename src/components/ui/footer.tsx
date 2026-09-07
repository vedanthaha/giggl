import Link from 'next/link'
import {
    Globe,
    Share2,
    MessageCircle,
    Link as LinkIcon,
    Send,
    Feather,
} from 'lucide-react'

const links = [
    {
        title: 'Security',
        href: '#',
    },
    {
        title: 'Privacy',
        href: '#',
    },
    {
        title: 'Transparency',
        href: '#',
    },
    {
        title: 'Terms',
        href: '#',
    },
    {
        title: 'Help',
        href: '#',
    },
]

export default function FooterSection() {
    return (
        <footer className="py-16 md:py-32 border-t border-white/[0.03] bg-[#0a0a0a]">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
                    <img src="/Giggle%20Logo.png" alt="Giggl Logo" className="h-12 object-contain" />
                </Link>

                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            className="text-gray-400 hover:text-white block transition-colors duration-150">
                            <span>{link.title}</span>
                        </Link>
                    ))}
                </div>
                <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
                    <Link
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter / X"
                        className="text-gray-500 hover:text-white block transition-colors">
                        <Share2 className="size-6" /> 
                    </Link>
                    <Link
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Community"
                        className="text-gray-500 hover:text-white block transition-colors">
                        <MessageCircle className="size-6" /> 
                    </Link>
                    <Link
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Links"
                        className="text-gray-500 hover:text-white block transition-colors">
                        <LinkIcon className="size-6" /> 
                    </Link>
                </div>
                <span className="text-gray-600 block text-center text-xs tracking-widest uppercase font-bold mt-12"> © {new Date().getFullYear()} Giggl Private Communications Systems. All rights reserved.</span>
            </div>
        </footer>
    )
}
