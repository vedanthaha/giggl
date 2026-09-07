'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, MessageCircle, Search, Settings, LogOut } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import localFont from 'next/font/local'

const ttHoves = localFont({ src: '../app/fonts/TTHovesPro-Medium.ttf' })

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export default function GlobalSidebar() {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileData) {
                setCurrentUser({ ...user, profile: profileData })
            } else {
                setCurrentUser(user)
            }
        }
        fetchUser()
    }, [supabase])

    const navItems = [
        { label: 'Home', icon: Home, href: '/' },
        { label: 'Messages', icon: MessageCircle, href: '/chats' },
        { label: 'Find', icon: Search, href: '/find' },
        { label: 'Settings', icon: Settings, href: '/profile' },
    ]

    return (
        <>
            {/* Desktop Sidebar (lg+) */}
            <div className="hidden lg:flex flex-col w-[240px] h-[100dvh] border-r border-white/5 bg-[#0a0a0a] flex-shrink-0 relative z-40">
                <div className="px-8 pt-10 pb-6 flex items-center">
                    <img src="/Giggle Logo.png" alt="Giggl" className="h-8 object-contain opacity-90" />
                </div>
                
                <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')
                        return (
                            <Link 
                                key={item.label} 
                                href={item.href}
                                className={cn(
                                    `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold ${ttHoves.className}`,
                                    isActive 
                                        ? "bg-primary/10 text-primary border border-primary/20" 
                                        : "text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-[15px] tracking-wide">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 bg-black/20">
                    {currentUser ? (
                        <Link href="/profile" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                            <img 
                                src={currentUser.profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.profile?.username || 'default'}`} 
                                className="w-10 h-10 rounded-xl object-cover bg-white/5 border border-white/10" 
                                alt={currentUser.profile?.full_name || 'User'} 
                            />
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm text-white truncate group-hover:text-primary transition-colors ${ttHoves.className}`}>
                                    {currentUser.profile?.full_name || 'Loading...'}
                                </p>
                                <p className={`text-[11px] text-gray-500 truncate ${ttHoves.className}`}>
                                    @{currentUser.profile?.username || '...'}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3 p-3 opacity-50">
                            <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-white/5 rounded w-20 animate-pulse" />
                                <div className="h-2 bg-white/5 rounded w-16 animate-pulse" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navigation (lg hidden) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[72px] bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 z-[100] flex items-center justify-around px-2 pb-safe">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')
                    return (
                        <Link 
                            key={item.label} 
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-16 h-full gap-1.5 transition-colors relative",
                                isActive ? "text-primary" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            {isActive && (
                                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            )}
                            <item.icon className="w-5 h-5" />
                            <span className={`text-[9px] font-bold tracking-wider ${ttHoves.className}`}>{item.label}</span>
                        </Link>
                    )
                })}
            </div>
            {/* We will not add bottom padding here, we will handle mobile padding in the respective page layouts if necessary. */}
        </>
    )
}
