'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Search, User, Plus, Check, Users, Camera, Loader2, X as XIcon, Send as SendIcon } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import localFont from 'next/font/local'
import GlobalSidebar from '@/components/GlobalSidebar'

const svetze = localFont({ src: '../fonts/Svetze.otf' })
const ttHoves = localFont({ src: '../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../fonts/Astonpoliz.otf' })

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface Profile {
    id: string
    full_name: string
    username: string
    photo_url: string
}

interface RequestItem {
    chat_id: string
    other_user: Profile
    is_incoming: boolean
}

export default function FindPage() {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<Profile[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
    const [isGroupMode, setIsGroupMode] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [groupPhoto, setGroupPhoto] = useState<File | null>(null)
    const [groupPhotoUrl, setGroupPhotoUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    
    // Tabs state
    const [activeTab, setActiveTab] = useState<'find' | 'incoming' | 'sent'>('find')
    const [incomingRequests, setIncomingRequests] = useState<RequestItem[]>([])
    const [sentRequests, setSentRequests] = useState<RequestItem[]>([])
    const [fetchingRequests, setFetchingRequests] = useState(false)

    // Request Modal
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
    const [targetUser, setTargetUser] = useState<Profile | null>(null)
    const [initialMessage, setInitialMessage] = useState('')

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
    }, [])

    const fetchRequests = async () => {
        if (!currentUser) return
        setFetchingRequests(true)
        try {
            // Fetch all DM chats I am part of
            const { data: myMembers } = await supabase
                .from('members')
                .select('chat_id, status, chats!inner(type)')
                .eq('user_id', currentUser.id)
                .eq('chats.type', 'dm')

            if (!myMembers) return

            const incoming: RequestItem[] = []
            const sent: RequestItem[] = []

            for (const member of myMembers) {
                // Get the other member in the chat
                const { data: otherMember } = await supabase
                    .from('members')
                    .select('status, profiles (id, full_name, username, photo_url)')
                    .eq('chat_id', member.chat_id)
                    .neq('user_id', currentUser.id)
                    .single()

                if (otherMember && otherMember.profiles) {
                    const otherProfile = otherMember.profiles as unknown as Profile
                    
                    if (member.status === 'pending') {
                        // I am pending, so it's an incoming request from them
                        incoming.push({ chat_id: member.chat_id, other_user: otherProfile, is_incoming: true })
                    } else if (member.status === 'accepted' && otherMember.status === 'pending') {
                        // I accepted (sent it), they are pending, so it's a sent request
                        sent.push({ chat_id: member.chat_id, other_user: otherProfile, is_incoming: false })
                    }
                }
            }

            setIncomingRequests(incoming)
            setSentRequests(sent)
        } catch (err) {
            console.error('Error fetching requests:', err)
        } finally {
            setFetchingRequests(false)
        }
    }

    useEffect(() => {
        if (currentUser && (activeTab === 'incoming' || activeTab === 'sent')) {
            fetchRequests()
        }
    }, [currentUser, activeTab])

    useEffect(() => {
        const searchUsers = async () => {
            if (!search.trim() || activeTab !== 'find') {
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
    }, [search, currentUser?.id, activeTab])

    const startDM = async (otherUser: Profile) => {
        setLoading(true)
        try {
            const { data: existingChat } = await supabase.rpc('get_dm_chat', { other_user_id: otherUser.id })

            if (existingChat && existingChat.length > 0) {
                router.push(`/chats/${existingChat[0].id}`)
                return
            }
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
            // Verify no existing DM
            const { data: existingChats } = await supabase
                .from('members')
                .select('chat_id, chats!inner(id, type)')
                .eq('user_id', currentUser.id)
                .eq('chats.type', 'dm')

            if (existingChats && existingChats.length > 0) {
                for (const chat of existingChats) {
                    const { data: otherMember } = await supabase
                        .from('members')
                        .select('user_id')
                        .eq('chat_id', chat.chat_id)
                        .eq('user_id', targetUser.id)
                        .single()

                    if (otherMember) {
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

            const { data: chat, error: chatError } = await supabase.from('chats').insert([{ type: 'dm' }]).select().single()
            if (chatError) throw chatError

            const { error: memberError } = await supabase.from('members').insert([
                { chat_id: chat.id, user_id: currentUser.id, status: 'accepted' },
                { chat_id: chat.id, user_id: targetUser.id, status: 'pending' }
            ])
            if (memberError) throw memberError

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

    const handleAcceptRequest = async (chatId: string) => {
        try {
            await supabase.from('members').update({ status: 'accepted' }).eq('chat_id', chatId).eq('user_id', currentUser.id)
            setIncomingRequests(prev => prev.filter(r => r.chat_id !== chatId))
        } catch (err) {
            console.error('Accept error', err)
        }
    }

    const handleRejectCancelRequest = async (chatId: string, isIncoming: boolean) => {
        try {
            // Delete the chat entirely since it was only a pending request
            await supabase.from('chats').delete().eq('id', chatId)
            if (isIncoming) {
                setIncomingRequests(prev => prev.filter(r => r.chat_id !== chatId))
            } else {
                setSentRequests(prev => prev.filter(r => r.chat_id !== chatId))
            }
        } catch (err) {
            console.error('Delete chat error', err)
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
                const { error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, groupPhoto)
                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath)
                finalPhotoUrl = publicUrl
            }
            const inviteCode = `${groupName.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
            const { data: chat, error: chatError } = await supabase.from('chats').insert([{
                type: 'group', name: groupName, photo_url: finalPhotoUrl, invite_code: inviteCode
            }]).select().single()
            if (chatError) throw chatError

            const members = [
                { chat_id: chat.id, user_id: currentUser.id, role: 'admin', status: 'accepted' },
                ...selectedUsers.map(u => ({ chat_id: chat.id, user_id: u.id, role: 'member', status: 'accepted' }))
            ]
            const { error: memberError } = await supabase.from('members').insert(members)
            if (memberError) throw memberError
            router.push(`/chats/${chat.id}`)
        } catch (err) {
            console.error('Error creating group:', err)
        } finally {
            setLoading(false)
        }
    }

    const toggleUserSelection = (user: Profile) => {
        if (selectedUsers.some(u => u.id === user.id)) setSelectedUsers(prev => prev.filter(u => u.id !== user.id))
        else setSelectedUsers(prev => [...prev, user])
    }

    return (
        <div className="h-[100dvh] w-full bg-[#0a0a0d] text-white flex overflow-hidden selection:bg-primary/30">
            <GlobalSidebar />

            <div className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-12 pt-12 pb-24">
                    <div className="mb-12">
                        <h1 className={`text-5xl font-normal tracking-tight text-white mb-2 ${svetze.className}`}>Find</h1>
                        <p className={`text-gray-500 text-sm uppercase tracking-widest font-bold ${astonpoliz.className}`}>Connect with people and create groups</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                        {/* LEFT MAIN COLUMN - 2/3 Width */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Segmented Tabs */}
                            <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl w-fit">
                                {(['find', 'incoming', 'sent'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            `px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all relative ${astonpoliz.className}`,
                                            activeTab === tab
                                                ? "bg-white/[0.08] text-white shadow-lg"
                                                : "text-gray-500 hover:text-white hover:bg-white/[0.02]"
                                        )}
                                    >
                                        {tab === 'find' ? 'Find People' : tab}
                                        {tab === 'incoming' && incomingRequests.length > 0 && (
                                            <span className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-primary rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'find' && (
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by username or name..."
                                            className={`w-full bg-white/[0.02] border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 text-xl outline-none focus:border-primary/30 focus:bg-white/[0.04] transition-all placeholder:text-gray-600 ${ttHoves.className}`}
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        {results.length === 0 && !search.trim() ? (
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-transparent border border-dashed border-white/5 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center">
                                                <div className="w-20 h-20 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mb-6">
                                                    <Search className="w-8 h-8 text-gray-600" />
                                                </div>
                                                <h3 className={`text-xl font-bold text-gray-300 ${astonpoliz.className}`}>Search Users</h3>
                                                <p className={`text-gray-500 mt-2 max-w-xs mx-auto ${ttHoves.className}`}>Find anyone on Giggl by their name or username.</p>
                                            </motion.div>
                                        ) : results.length === 0 ? (
                                            <div className="text-center py-20 border border-white/5 rounded-[3rem]">
                                                <p className={`text-gray-500 text-lg italic ${ttHoves.className}`}>No results found for "{search}"</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <AnimatePresence mode="popLayout">
                                                    {results.map((user) => (
                                                        <motion.div key={user.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                            className={cn("p-4 rounded-[2rem] flex items-center justify-between gap-4 transition-all border", selectedUsers.some(u => u.id === user.id) ? "bg-primary/10 border-primary/20" : "bg-white/[0.02] border-white/5")}
                                                        >
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <img src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-14 h-14 rounded-2xl bg-white/5 object-cover" alt="" />
                                                                <div className="min-w-0">
                                                                    <h4 className={`font-bold text-[15px] text-white truncate ${ttHoves.className}`}>{user.full_name}</h4>
                                                                    <p className={`text-xs text-gray-500 truncate ${ttHoves.className}`}>@{user.username}</p>
                                                                </div>
                                                            </div>
                                                            {isGroupMode ? (
                                                                <button onClick={() => toggleUserSelection(user)} className={cn("p-3 rounded-xl transition-colors", selectedUsers.some(u => u.id === user.id) ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10")}>
                                                                    {selectedUsers.some(u => u.id === user.id) ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                                </button>
                                                            ) : (
                                                                <button onClick={() => startDM(user)} className="px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Add</button>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'incoming' && (
                                <div className="space-y-4">
                                    {fetchingRequests ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
                                    ) : incomingRequests.length === 0 ? (
                                        <div className="text-center py-24 border border-white/5 rounded-[3rem]">
                                            <p className={`text-gray-500 text-lg ${ttHoves.className}`}>No incoming requests.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {incomingRequests.map((req) => (
                                                <div key={req.chat_id} className="p-4 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <img src={req.other_user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.other_user.username}`} className="w-14 h-14 rounded-2xl bg-white/5 object-cover" alt="" />
                                                        <div className="min-w-0">
                                                            <h4 className={`font-bold text-[15px] text-white truncate ${ttHoves.className}`}>{req.other_user.full_name}</h4>
                                                            <p className={`text-xs text-gray-500 truncate ${ttHoves.className}`}>@{req.other_user.username}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button onClick={() => handleAcceptRequest(req.chat_id)} className="px-4 py-2 bg-primary text-white hover:brightness-110 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Accept</button>
                                                        <button onClick={() => handleRejectCancelRequest(req.chat_id, true)} className="px-4 py-2 bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Reject</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'sent' && (
                                <div className="space-y-4">
                                    {fetchingRequests ? (
                                        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
                                    ) : sentRequests.length === 0 ? (
                                        <div className="text-center py-24 border border-white/5 rounded-[3rem]">
                                            <p className={`text-gray-500 text-lg ${ttHoves.className}`}>No pending sent requests.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {sentRequests.map((req) => (
                                                <div key={req.chat_id} className="p-4 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <img src={req.other_user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.other_user.username}`} className="w-14 h-14 rounded-2xl bg-white/5 object-cover" alt="" />
                                                        <div className="min-w-0">
                                                            <h4 className={`font-bold text-[15px] text-white truncate ${ttHoves.className}`}>{req.other_user.full_name}</h4>
                                                            <p className={`text-xs text-gray-500 truncate ${ttHoves.className}`}>@{req.other_user.username}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRejectCancelRequest(req.chat_id, false)} className="px-4 py-2 bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Cancel</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDEBAR - 1/3 Width */}
                        <div className="space-y-6 lg:sticky lg:top-12">
                            {/* Group Creation Card */}
                            <div className="bg-[#121217] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                                <div>
                                    <h3 className={`text-xl font-bold text-white flex items-center gap-2 mb-1 ${svetze.className}`}>
                                        Create Group
                                    </h3>
                                    <p className={`text-gray-500 text-sm ${ttHoves.className}`}>Start a private group chat.</p>
                                </div>

                                {isGroupMode ? (
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-4 bg-black/30 p-4 rounded-3xl border border-white/5">
                                            <label className="w-12 h-12 shrink-0 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 cursor-pointer overflow-hidden hover:bg-white/10 transition-colors">
                                                {groupPhotoUrl ? <img src={groupPhotoUrl} className="w-full h-full object-cover" alt="" /> : <Camera className="w-5 h-5" />}
                                                <input type="file" className="hidden" accept="image/*" onChange={handleGroupPhoto} />
                                            </label>
                                            <input type="text" placeholder="Group Name" className={`flex-1 min-w-0 bg-transparent outline-none text-white font-medium ${ttHoves.className}`} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                                        </div>
                                        
                                        <div className="space-y-2 pt-2">
                                            <button onClick={createGroup} disabled={loading || !groupName || selectedUsers.length === 0} className={`w-full bg-primary hover:brightness-110 text-white rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-primary/20 disabled:opacity-30 transition-all ${astonpoliz.className}`}>
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Launch Group'}
                                            </button>
                                            <button onClick={() => setIsGroupMode(false)} className={`w-full py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors ${astonpoliz.className}`}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsGroupMode(true)} className={`w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl font-bold text-xs uppercase tracking-widest text-white transition-colors flex items-center justify-center gap-2 ${astonpoliz.className}`}>
                                        <Plus className="w-4 h-4" /> Initialize
                                    </button>
                                )}
                            </div>

                            {/* Selection Summary */}
                            {selectedUsers.length > 0 && (
                                <div className="bg-[#121217] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest text-gray-500 ${astonpoliz.className}`}>Selected ({selectedUsers.length})</h3>
                                        <button onClick={() => setSelectedUsers([])} className={`text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest ${astonpoliz.className}`}>Clear</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUsers.map(user => (
                                            <div key={user.id} className="relative group">
                                                <img src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
                                                <button onClick={() => toggleUserSelection(user)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Modal */}
            <AnimatePresence>
                {isRequestModalOpen && targetUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRequestModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative w-full max-w-lg bg-[#121217] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden">
                            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                <img src={targetUser.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`} className="w-20 h-20 rounded-3xl border border-white/10 mx-auto object-cover" alt="" />
                                <div>
                                    <h3 className={`text-xl font-bold text-white ${svetze.className}`}>Add {targetUser.full_name}?</h3>
                                    <p className={`text-gray-500 text-sm mt-1 ${ttHoves.className}`}>Send a request to chat with @{targetUser.username}</p>
                                </div>
                                <div className="w-full space-y-4">
                                    <textarea value={initialMessage} onChange={(e) => setInitialMessage(e.target.value)} placeholder="Say hi..." className={`w-full h-24 p-5 bg-white/[0.03] border border-white/10 focus:border-primary/50 outline-none resize-none rounded-2xl text-sm text-white ${ttHoves.className}`} autoFocus />
                                    <div className="flex gap-3">
                                        <button onClick={() => setIsRequestModalOpen(false)} className={`flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-300 transition-colors ${astonpoliz.className}`}>Cancel</button>
                                        <button onClick={sendChatRequest} disabled={loading || !initialMessage.trim()} className={`flex-1 py-3.5 bg-primary hover:brightness-110 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 flex justify-center items-center ${astonpoliz.className}`}>
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
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
