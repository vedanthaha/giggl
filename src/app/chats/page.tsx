'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'
import ChatSidebar from '@/components/ChatSidebar'

export default function ChatsPage() {
    const [currentUser, setCurrentUser] = useState<any>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setCurrentUser(user)
        }
        checkUser()
    }, [])

    return (
        <div className="h-screen w-full bg-[#0a0a0d] text-white flex overflow-hidden">
            {/* LEFT SIDEBAR - Always visible on mobile for /chats, hidden on mobile for /chats/[id] */}
            <div className="w-full md:w-[300px] lg:w-[350px] md:border-r border-white/5 h-full">
                <ChatSidebar />
            </div>

            {/* MAIN AREA - Only visible on desktop when no chat selected */}
            <div className="hidden md:flex flex-1 items-center justify-center bg-[#07070a] relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -top-1/2 -right-1/2 pointer-events-none" />

                <div className="text-center space-y-6 z-10">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl shadow-primary/10"
                    >
                        <MessageCircle className="w-12 h-12 text-primary" />
                    </motion.div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-normal font-brand text-white tracking-tighter">Welcome to Giggl</h2>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto font-medium">Select a conversation from the sidebar or start a new giggle to get started.</p>
                    </div>
                </div>

                {/* Decorative sparkles */}
                <div className="absolute top-10 right-10 opacity-20"><Sparkles className="w-6 h-6 text-primary" /></div>
                <div className="absolute bottom-20 left-20 opacity-10"><Sparkles className="w-4 h-4 text-accent" /></div>
            </div>
        </div>
    )
}
