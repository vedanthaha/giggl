'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Search, Plus, Link as LinkIcon, Users, MessageCircle, X } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { AnimatePresence } from 'framer-motion'

interface Group {
    id: string
    name: string
    photo_url: string
    invite_code: string
    created_at: string
    lastMessage?: {
        text: string
        created_at: string
    }
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [joining, setJoining] = useState(false)
    const [showJoinModal, setShowJoinModal] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchGroups = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setCurrentUser(user)

            const { data, error } = await supabase
                .from('members')
                .select(`
                    chat_id,
                    chats (
                        id,
                        type,
                        name,
                        photo_url,
                        invite_code,
                        created_at
                    )
                `)
                .eq('user_id', user.id)
                .eq('chats.type', 'group')

            if (error) {
                console.error('Error fetching groups:', error)
            } else {
                const formattedGroups = await Promise.all(
                    data
                        .filter((item: any) => item.chats !== null)
                        .map(async (item: any) => {
                            const chat = item.chats
                            const { data: msgData } = await supabase
                                .from('messages')
                                .select('text, created_at')
                                .eq('chat_id', chat.id)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .single()

                            return {
                                id: chat.id,
                                name: chat.name,
                                photo_url: chat.photo_url,
                                invite_code: chat.invite_code,
                                created_at: chat.created_at,
                                lastMessage: msgData
                            }
                        })
                )
                setGroups(formattedGroups as Group[])
            }
            setLoading(false)
        }

        fetchGroups()
    }, [supabase, router])

    const filteredGroups = groups.filter(g =>
        g.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleJoinGroup = async () => {
        if (!inviteCode || !currentUser) return
        setJoining(true)

        try {
            // Find chat by invite code
            const { data: chat, error: chatError } = await supabase
                .from('chats')
                .select('id, name')
                .eq('invite_code', inviteCode.toUpperCase())
                .single()

            if (chatError || !chat) {
                alert('Invalid invite code!')
                return
            }

            // Check if already a member
            const { data: member } = await supabase
                .from('members')
                .select('*')
                .eq('chat_id', chat.id)
                .eq('user_id', currentUser.id)
                .single()

            if (member) {
                alert('You are already a member of this group!')
                router.push(`/chats/${chat.id}`)
                return
            }

            // Join group
            const { error: joinError } = await supabase
                .from('members')
                .insert([{ chat_id: chat.id, user_id: currentUser.id }])

            if (joinError) throw joinError

            router.push(`/chats/${chat.id}`)
        } catch (err) {
            console.error('Error joining group:', err)
        } finally {
            setJoining(false)
            setShowJoinModal(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col w-full max-w-7xl mx-auto border-x border-white/5">
            {/* Header */}
            <header className="px-12 py-10 flex items-center justify-between bg-black/20 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/chats')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-3xl font-normal tracking-tight text-primary font-brand">Groups</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/chats/new')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Create Group
                    </button>
                </div>
            </header>

            <div className="flex-1 p-8 space-y-8">
                {/* Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => router.push('/chats/new')}
                        className="flex items-center gap-4 p-6 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-primary/50 transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Create New Group</h3>
                            <p className="text-sm text-gray-500">Start a new chat with multiple friends</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="flex items-center gap-4 p-6 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-accent/50 transition-all text-left"
                    >
                        <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                            <LinkIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Join via Link</h3>
                            <p className="text-sm text-gray-500">Have an invite code? Enter it here</p>
                        </div>
                    </button>
                </div>

                <AnimatePresence>
                    {showJoinModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowJoinModal(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl"
                            >
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <LinkIcon className="w-8 h-8 text-accent" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Enter Invite Code</h2>
                                    <p className="text-gray-500 text-sm">Paste the code shared by your friend</p>
                                </div>

                                <input
                                    type="text"
                                    placeholder="GIGGL-XXXX"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="hinge-input text-center text-2xl font-black tracking-widest uppercase py-6 !bg-white/[0.03] !border-white/5 focus:!border-accent/50"
                                    autoFocus
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowJoinModal(false)}
                                        className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleJoinGroup}
                                        disabled={joining || !inviteCode}
                                        className="flex-1 py-4 bg-accent text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20 disabled:opacity-50"
                                    >
                                        {joining ? 'Joining...' : 'Join Group'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Group List Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Your Groups</h2>
                        <div className="relative group w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search groups..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="hinge-input pl-14 py-2.5 text-sm !bg-white/[0.02] !border-white/5 focus:!border-primary/30"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredGroups.length === 0 ? (
                        <div className="text-center py-24 bg-white/[0.01] rounded-[40px] border border-dashed border-white/5">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10 text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">No groups found</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">You haven't joined any groups yet. Create one or ask for an invite link!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredGroups.map((group) => (
                                <Link key={group.id} href={`/chats/${group.id}`}>
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="hinge-card !p-5 bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all flex flex-col gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={group.photo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`}
                                                alt={group.name}
                                                className="w-14 h-14 rounded-2xl object-cover bg-white/5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-lg text-white truncate">{group.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Group</p>
                                                    <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                                        {group.invite_code || 'NO-CODE'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-sm text-gray-400 line-clamp-2">
                                                {group.lastMessage?.text || 'No messages yet...'}
                                            </p>
                                            {group.lastMessage && (
                                                <p className="text-[10px] text-gray-600 mt-2 font-medium">
                                                    Active {formatDistanceToNow(new Date(group.lastMessage.created_at), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
