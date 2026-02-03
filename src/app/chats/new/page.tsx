'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Search, User, Plus, Check, Users, Camera, Loader2, X as XIcon, Send as SendIcon } from 'lucide-react'
import Link from 'next/link'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface Profile {
    id: string
    full_name: string
    username: string
    photo_url: string
}

export default function NewChatPage() {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<Profile[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
    const [isGroupMode, setIsGroupMode] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupPhoto, setGroupPhoto] = useState<File | null>(null)
    const [groupPhotoUrl, setGroupPhotoUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
    const [targetUser, setTargetUser] = useState<Profile | null>(null)
    const [initialMessage, setInitialMessage] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
    }, [])

    useEffect(() => {
        const searchUsers = async () => {
            if (!search.trim()) {
                setResults([])
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', currentUser?.id)
                .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
                .limit(10)

            setResults(data || [])
        }

        const timer = setTimeout(searchUsers, 300)
        return () => clearTimeout(timer)
    }, [search, currentUser?.id])

    const startDM = async (otherUser: Profile) => {
        setLoading(true)
        try {
            // Check if DM already exists
            const { data: existingChat } = await supabase
                .rpc('get_dm_chat', { other_user_id: otherUser.id })

            if (existingChat && existingChat.length > 0) {
                router.push(`/chats/${existingChat[0].id}`)
                return
            }

            // If new DM, show request modal
            setTargetUser(otherUser)
            setIsRequestModalOpen(true)
        } catch (err) {
            console.error('Error checking DM:', err)
        } finally {
            setLoading(false)
        }
    }

    const sendChatRequest = async () => {
        if (!targetUser || !initialMessage.trim()) return
        setLoading(true)

        try {
            // FIRST: Check if any DM already exists between these two users (in either direction)
            const { data: existingChats } = await supabase
                .from('members')
                .select('chat_id, chats!inner(id, type)')
                .eq('user_id', currentUser.id)
                .eq('chats.type', 'dm')

            // Check if any of these chats include the target user
            if (existingChats && existingChats.length > 0) {
                for (const chat of existingChats) {
                    const { data: otherMember } = await supabase
                        .from('members')
                        .select('user_id')
                        .eq('chat_id', chat.chat_id)
                        .eq('user_id', targetUser.id)
                        .single()

                    if (otherMember) {
                        // DM already exists! Just add the message and navigate
                        console.log('[startDM] Found existing DM, using that instead')
                        await supabase.from('messages').insert([{
                            chat_id: chat.chat_id,
                            sender_id: currentUser.id,
                            text: initialMessage
                        }])
                        router.push(`/chats/${chat.chat_id}`)
                        return
                    }
                }
            }

            // No existing DM found, create new chat
            const { data: chat, error: chatError } = await supabase
                .from('chats')
                .insert([{ type: 'dm' }])
                .select()
                .single()

            if (chatError) throw chatError

            // Add members with status
            const { error: memberError } = await supabase
                .from('members')
                .insert([
                    {
                        chat_id: chat.id,
                        user_id: currentUser.id,
                        status: 'accepted'
                    },
                    {
                        chat_id: chat.id,
                        user_id: targetUser.id,
                        status: 'pending' // Recipient must accept
                    }
                ])

            if (memberError) throw memberError

            // Send first message
            await supabase.from('messages').insert([{
                chat_id: chat.id,
                sender_id: currentUser.id,
                text: initialMessage
            }])

            router.push(`/chats/${chat.id}`)
        } catch (err) {
            console.error('Error starting DM:', err)
        } finally {
            setLoading(false)
            setIsRequestModalOpen(false)
        }
    }

    const handleGroupPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setGroupPhoto(file)
        setGroupPhotoUrl(URL.createObjectURL(file))
    }

    const createGroup = async () => {
        if (!groupName || selectedUsers.length === 0) return
        setLoading(true)

        try {
            let finalPhotoUrl = ''
            if (groupPhoto) {
                const filePath = `groups/${Date.now()}_${groupPhoto.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-images')
                    .upload(filePath, groupPhoto)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('chat-images')
                    .getPublicUrl(filePath)

                finalPhotoUrl = publicUrl
            }

            const inviteCode = `${groupName.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

            const { data: chat, error: chatError } = await supabase
                .from('chats')
                .insert([{
                    type: 'group',
                    name: groupName,
                    photo_url: finalPhotoUrl,
                    invite_code: inviteCode
                }])
                .select()
                .single()

            if (chatError) throw chatError

            // Add all members
            const members = [
                {
                    chat_id: chat.id,
                    user_id: currentUser.id,
                    role: 'admin',
                    status: 'accepted'
                },
                ...selectedUsers.map(u => ({
                    chat_id: chat.id,
                    user_id: u.id,
                    role: 'member',
                    status: 'accepted' // For now Auto-accept, can be pending later
                }))
            ]

            const { error: memberError } = await supabase
                .from('members')
                .insert(members)

            if (memberError) throw memberError

            router.push(`/chats/${chat.id}`)
        } catch (err) {
            console.error('Error creating group:', err)
            alert('Failed to create group. Did you run the SQL migration?')
        } finally {
            setLoading(false)
        }
    }

    const toggleUserSelection = (user: Profile) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id))
        } else {
            setSelectedUsers(prev => [...prev, user])
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white selection:bg-primary/30">
            {/* Header / Nav */}
            <div className="max-w-[1400px] mx-auto px-8 pt-10 pb-4">
                <div className="flex items-center gap-6 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all active:scale-90 border border-white/5"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-normal tracking-tight text-white font-brand">New Chat</h1>
                        <p className="text-gray-500 text-sm mt-1">Start a private giggle or create a room</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                    {/* LEFT MAIN COLUMN - 2/3 Width */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Discover People Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                                    Discover People
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                </h2>
                                {search && results.length > 0 && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                                        {results.length} results
                                    </span>
                                )}
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by username or name..."
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 text-xl outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Results Grid / List */}
                        <div className="space-y-4">
                            {results.length === 0 && !search.trim() ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] h-[400px] flex flex-col items-center justify-center text-center p-10 group"
                                >
                                    <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <Users className="w-10 h-10 text-gray-600 group-hover:text-primary transition-colors" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-300">Find your friends</h3>
                                    <p className="text-gray-500 mt-2 max-w-xs mx-auto">Search for anyone on Giggl by their name or @username to start chatting.</p>
                                </motion.div>
                            ) : results.length === 0 ? (
                                <div className="text-center py-20 bg-white/[0.01] rounded-[3rem] border border-white/5">
                                    <p className="text-gray-500 text-lg italic">No results found for "{search}"</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                                    <AnimatePresence mode="popLayout">
                                        {results.map((user) => (
                                            <motion.button
                                                key={user.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                onClick={() => isGroupMode ? toggleUserSelection(user) : startDM(user)}
                                                className={cn(
                                                    "text-left p-4 rounded-[2rem] flex items-center gap-5 transition-all group border",
                                                    selectedUsers.some(u => u.id === user.id)
                                                        ? "bg-primary/10 border-primary/20"
                                                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                                                )}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                                        className="w-16 h-16 rounded-2xl bg-white/5 object-cover"
                                                        alt={user.full_name}
                                                    />
                                                    {selectedUsers.some(u => u.id === user.id) && (
                                                        <div className="absolute -top-2 -right-2 bg-primary p-1.5 rounded-xl shadow-lg border-2 border-[#0a0a0a]">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-lg text-white truncate group-hover:text-primary transition-colors">{user.full_name}</h4>
                                                    <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                                                </div>
                                                {!isGroupMode && (
                                                    <Plus className="w-6 h-6 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR - 1/3 Width */}
                    <div className="space-y-8 sticky top-10">
                        {/* Group Creation Card */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group shadow-2xl">
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all duration-700" />

                            <div className="relative z-10 space-y-2">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    Create a Group
                                    <Users className="w-5 h-5 text-primary" />
                                </h3>
                                <p className="text-gray-500 leading-relaxed">Giggle with multiple people at once in a private room.</p>
                            </div>

                            {isGroupMode ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative z-10 space-y-6"
                                >
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block ml-2">Configuration</label>
                                        <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <label className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-gray-500 hover:text-primary transition-all cursor-pointer group/cam overflow-hidden relative">
                                                    {groupPhotoUrl ? (
                                                        <img src={groupPhotoUrl} className="w-full h-full object-cover" alt="Preview" />
                                                    ) : (
                                                        <Camera className="w-6 h-6 group-hover/cam:scale-110 transition-transform" />
                                                    )}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleGroupPhoto} />
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Set Group Name"
                                                    className="flex-1 bg-transparent text-xl font-bold outline-none placeholder:text-gray-700 text-white"
                                                    value={groupName}
                                                    onChange={(e) => setGroupName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <button
                                            onClick={createGroup}
                                            disabled={loading || !groupName || selectedUsers.length === 0}
                                            className="w-full bg-gradient-to-tr from-primary to-accent hover:brightness-110 text-white rounded-[1.5rem] py-5 text-xl font-bold shadow-2xl shadow-primary/30 disabled:opacity-20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Launch Group <Check className="w-6 h-6" /></>}
                                        </button>
                                        <button
                                            onClick={() => setIsGroupMode(false)}
                                            className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition-colors"
                                        >
                                            Return to Private
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => setIsGroupMode(true)}
                                    className="relative z-10 w-full py-5 px-6 border border-white/10 hover:border-primary/50 hover:bg-primary/[0.03] rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Plus className="w-5 h-5 text-primary" />
                                    Initialize Group Mode
                                </button>
                            )}
                        </div>

                        {/* Selection Summary */}
                        <AnimatePresence>
                            {selectedUsers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-6"
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                                            Recruits ({selectedUsers.length})
                                        </h3>
                                        <button
                                            onClick={() => setSelectedUsers([])}
                                            className="text-[10px] font-bold text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-widest"
                                        >
                                            Clear
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {selectedUsers.map(user => (
                                            <motion.div
                                                layout
                                                key={user.id}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="group relative"
                                            >
                                                <img
                                                    src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                                    className="w-12 h-12 rounded-2xl border-2 border-primary/20 p-0.5 object-cover bg-black"
                                                    title={user.full_name}
                                                />
                                                <button
                                                    onClick={() => toggleUserSelection(user)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Background Grain / Effects */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-accent/5 blur-[100px] rounded-full" />
            </div>

            {/* Initial Message Modal */}
            <AnimatePresence>
                {isRequestModalOpen && targetUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRequestModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-xl bg-[#121212] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <img src={targetUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`} className="w-24 h-24 rounded-[40px] border-4 border-white/5 mx-auto" alt={targetUser.full_name} />
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Message {targetUser.full_name}?</h3>
                                        <p className="text-gray-500 mt-1">Send a request to start giggling with @{targetUser.username}</p>
                                    </div>
                                </div>

                                <div className="w-full space-y-4">
                                    <div className="hinge-card !p-1 bg-white/[0.03] border-white/5 focus-within:border-primary/30 transition-all !rounded-3xl">
                                        <textarea
                                            value={initialMessage}
                                            onChange={(e) => setInitialMessage(e.target.value)}
                                            placeholder="Say something nice..."
                                            className="w-full h-32 p-6 bg-transparent outline-none resize-none text-lg text-white placeholder:text-gray-700 leading-relaxed"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4">
                                        <button
                                            onClick={sendChatRequest}
                                            disabled={loading || !initialMessage.trim()}
                                            className="w-full bg-primary hover:brightness-110 text-white rounded-2xl py-4 font-bold shadow-xl shadow-primary/20 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Request <SendIcon className="w-5 h-5" /></>}
                                        </button>
                                        <button
                                            onClick={() => setIsRequestModalOpen(false)}
                                            className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors"
                                        >
                                            Nevermind
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function X({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    )
}
