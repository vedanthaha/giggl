'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Settings, UserPlus, Search, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface Chat {
    id: string
    type: 'dm' | 'group'
    name: string
    photo_url: string
    lastMessage?: {
        text: string
        created_at: string
    }
    status?: 'pending' | 'accepted'
}

export default function ChatSidebar() {
    const [chats, setChats] = useState<Chat[]>([])
    const [activeTab, setActiveTab] = useState<'dm' | 'group' | 'requests'>('dm')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const router = useRouter()
    const { chatId } = useParams()
    const supabase = createClient()

    const getData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch profile data
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

        // Fetch chats for current user
        const { data, error } = await supabase
            .from('members')
            .select(`
                chat_id,
                status,
                chats (
                    id,
                    type,
                    name,
                    photo_url
                )
            `)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error fetching chats:', error)
        } else if (data) {
            const formattedChats = await Promise.all(data.map(async (item: any) => {
                const chat = item.chats
                if (!chat) return null

                // Get last message
                const { data: msgData } = await supabase
                    .from('messages')
                    .select('text, created_at, sender_id')
                    .eq('chat_id', chat.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                // If DM, get other user's info
                let chatName = chat.name
                let chatPhoto = chat.photo_url

                if (chat.type === 'dm') {
                    const { data: otherMember } = await supabase
                        .from('members')
                        .select('profiles (full_name, photo_url)')
                        .eq('chat_id', chat.id)
                        .neq('user_id', user.id)
                        .maybeSingle()

                    if (otherMember?.profiles) {
                        chatName = (otherMember.profiles as any).full_name
                        chatPhoto = (otherMember.profiles as any).photo_url
                    }
                }

                return {
                    ...chat,
                    name: chatName || 'Unknown User',
                    photo_url: chatPhoto,
                    lastMessage: msgData,
                    status: item.status
                }
            }))

            setChats(formattedChats.filter(Boolean) as Chat[])
        }
        setLoading(false)
    }

    useEffect(() => {
        getData()

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const channel = supabase
                .channel('global_chat_updates_sidebar')
                .on('postgres_changes' as any, { event: '*', table: 'messages' }, () => getData())
                .on('postgres_changes' as any, {
                    event: 'INSERT',
                    table: 'members',
                    filter: `user_id=eq.${user.id}`
                }, () => getData())
                .subscribe()

            return channel
        }

        const channelPromise = setupRealtime()

        return () => {
            channelPromise.then(channel => {
                if (channel) supabase.removeChannel(channel)
            })
        }
    }, [])

    const filteredChats = chats.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
        if (activeTab === 'requests') return matchesSearch && c.status === 'pending'
        return matchesSearch && c.status === 'accepted' && c.type === (activeTab === 'dm' ? 'dm' : 'group')
    })

    return (
        <div className="w-full h-full flex flex-col border-r border-white/5 bg-black/10">
            {/* Header */}
            <header className="px-6 py-8 flex items-center justify-between border-b border-white/5">
                <h1 className="text-2xl font-normal tracking-tight text-primary font-brand">Giggl</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push('/chats/new')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                    </button>
                    <Link href="/profile" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <Settings className="w-4 h-4 text-gray-400" />
                    </Link>
                </div>
            </header>

            <div className="p-4 space-y-4">
                <div className="flex gap-2">
                    {(['dm', 'group', 'requests'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all relative",
                                activeTab === tab
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white/[0.03] text-gray-500 border border-white/5"
                            )}
                        >
                            {tab === 'dm' ? 'DMs' : tab === 'group' ? 'Groups' : 'Reqs'}
                            {tab === 'requests' && chats.filter(c => c.status === 'pending').length > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[7px] flex items-center justify-center rounded-full">
                                    {chats.filter(c => c.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white/[0.02] border border-white/5 focus:border-primary/30 rounded-xl outline-none"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
                {loading ? (
                    <div className="flex justify-center py-10 opacity-50">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="text-center py-10 opacity-30 px-4">
                        <p className="text-[10px] uppercase tracking-widest">No chats</p>
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <Link key={chat.id} href={`/chats/${chat.id}`}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className={cn(
                                    "p-3 flex items-center gap-3 rounded-2xl transition-all cursor-pointer",
                                    chat.id === chatId
                                        ? "bg-primary/10 border border-primary/20"
                                        : "hover:bg-white/[0.03] border border-transparent"
                                )}
                            >
                                <img
                                    src={chat.photo_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                    alt={chat.name}
                                    className="w-10 h-10 rounded-xl object-cover bg-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <h3 className={cn(
                                            "font-bold truncate text-sm",
                                            chat.id === chatId ? "text-primary" : "text-gray-200"
                                        )}>{chat.name}</h3>
                                        {chat.lastMessage && (
                                            <span className="text-[8px] text-gray-500 font-medium">
                                                {formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: false })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 truncate">
                                        {chat.lastMessage?.text || 'No messages'}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
