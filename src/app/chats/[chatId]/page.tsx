'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Send, Image as ImageIcon, Mic, X, Play, Pause, Smile, Sparkles, Trash2, Grid3X3, Ban } from 'lucide-react'
import Link from 'next/link'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import ChatSidebar from '@/components/ChatSidebar'
import GifStickerPanel from '@/components/GifStickerPanel'
import ProfilePreview from '@/components/ProfilePreview'
import { Phone, Video, MoreVertical, Shield } from 'lucide-react'
import { useCalls } from '@/context/CallContext'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface Message {
    id: string
    text?: string
    image_url?: string
    voice_url?: string
    gif_url?: string
    sticker_url?: string
    sender_id: string
    created_at: string
    reactions?: Record<string, string[]>
    edited_at?: string
    is_deleted?: boolean
    deleted_for?: string[]
}

// --- WAVEFORM PLAYER COMPONENT ---
function WaveformPlayer({ url }: { url: string }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)
    const [waveData] = useState(() => Array.from({ length: 30 }, () => Math.floor(Math.random() * 60) + 20))

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        const updateTime = () => setCurrentTime(audio.currentTime)
        const updateDuration = () => setDuration(audio.duration)
        const onEnd = () => setIsPlaying(false)

        const onError = (e: any) => console.error("Audio error:", e)

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('loadedmetadata', updateDuration)
        audio.addEventListener('ended', onEnd)
        audio.addEventListener('error', onError)
        return () => {
            audio.removeEventListener('timeupdate', updateTime)
            audio.removeEventListener('loadedmetadata', updateDuration)
            audio.removeEventListener('ended', onEnd)
            audio.removeEventListener('error', onError)
        }
    }, [])

    const togglePlay = () => {
        if (!audioRef.current) return
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true)
            }).catch(err => {
                console.error("Playback failed:", err)
                alert("Playback failed: Source unreachable. Please try recording a NEW message.")
            })
        }
    }

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60)
        const secs = Math.floor(time % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl min-w-[200px] border border-white/5 shadow-xl">
            <audio ref={audioRef} src={url} className="hidden" />
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90">
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <div className="flex-1">
                <div className="flex gap-[2px] items-center h-8">
                    {waveData.map((h, i) => {
                        const progress = duration > 0 ? (currentTime / duration) * 100 : 0
                        const isActive = (i / waveData.length) * 100 < progress
                        return (
                            <div
                                key={i}
                                style={{ height: `${h}%` }}
                                className={cn("w-[3px] rounded-full transition-all duration-300",
                                    isActive ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)]" : "bg-white/20"
                                )}
                            />
                        )
                    })}
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400 font-medium">{formatTime(currentTime)}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    )
}

// --- LIVE WAVEFORM VISUALIZER ---
function LiveWaveform() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const audioContext = useRef<AudioContext | null>(null)
    const analyser = useRef<AnalyserNode | null>(null)
    const rafId = useRef<number | null>(null)

    useEffect(() => {
        const setup = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            audioContext.current = new AudioContext()
            analyser.current = audioContext.current.createAnalyser()
            analyser.current.fftSize = 64

            const source = audioContext.current.createMediaStreamSource(stream)
            source.connect(analyser.current)

            if (!analyser.current) return
            const dataArray = new Uint8Array(analyser.current.frequencyBinCount)
            const ctx = canvasRef.current?.getContext('2d')
            if (!ctx) return

            const draw = () => {
                rafId.current = requestAnimationFrame(draw)
                analyser.current?.getByteFrequencyData(dataArray)

                ctx.clearRect(0, 0, 300, 60)
                const barWidth = 6
                const gap = 4
                let x = 0

                dataArray.forEach((v) => {
                    const height = (v / 255) * 40 + 5
                    ctx.fillStyle = '#7c3aed'
                    ctx.fillRect(x, 30 - height / 2, barWidth, height)
                    x += barWidth + gap
                })
            }
            draw()
            return stream
        }

        let streamPromise = setup()

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current)
            audioContext.current?.close()
            streamPromise.then(s => s?.getTracks().forEach(t => t.stop()))
        }
    }, [])

    return <canvas ref={canvasRef} width={300} height={60} className="w-full h-10" />
}

export default function ChatScreen() {
    const { chatId } = useParams()
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState('')
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [receipient, setReceipient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isRecording, setIsRecording] = useState(false)
    const [recordDuration, setRecordDuration] = useState(0)
    const [typing, setTyping] = useState(false)
    const [otherTyping, setOtherTyping] = useState(false)
    const [userStatus, setUserStatus] = useState<'pending' | 'accepted'>('accepted')
    const [groupMembers, setGroupMembers] = useState<any[]>([])
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [blockStatus, setBlockStatus] = useState<{ isBlocked: boolean, isBlocking: boolean }>({ isBlocked: false, isBlocking: false })

    const scrollRef = useRef<HTMLDivElement>(null)
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const channelRef = useRef<any>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const supabase = createClient()
    const [showPicker, setShowPicker] = useState(false)
    const [pickerTab, setPickerTab] = useState<'gif' | 'sticker'>('gif')
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [editText, setEditText] = useState('')
    const { startCall } = useCalls()
    const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setCurrentUser(user)
        }
        fetchUser()
    }, [])

    useEffect(() => {
        if (!chatId || !currentUser) return

        let isMounted = true

        const setupChat = async () => {
            const { data: chatData } = await supabase.from('chats').select('*').eq('id', chatId).single()
            if (!isMounted) return

            if (chatData?.type === 'group') {
                const { data: members } = await supabase
                    .from('members')
                    .select('role, profiles (*)')
                    .eq('chat_id', chatId)

                if (isMounted) {
                    setGroupMembers(members || [])
                    setReceipient({
                        ...chatData,
                        type: 'group',
                        joined_at: chatData.created_at,
                        members: members || []
                    })
                }
            } else {
                const { data: memberData } = await supabase
                    .from('members')
                    .select('profiles (full_name, photo_url, id, username, bio)')
                    .eq('chat_id', chatId)
                    .neq('user_id', currentUser.id)
                    .maybeSingle()

                if (isMounted && memberData?.profiles) {
                    setReceipient({
                        ...memberData.profiles,
                        type: 'user'
                    })

                    // Check Block Status
                    const targetProfile = memberData.profiles as any
                    const { data: blocks } = await supabase
                        .from('blocks')
                        .select('*')
                        .or(`and(blocker_id.eq.${currentUser.id},blocked_id.eq.${targetProfile.id}),and(blocker_id.eq.${targetProfile.id},blocked_id.eq.${currentUser.id})`)

                    if (isMounted && blocks) {
                        setBlockStatus({
                            isBlocking: blocks.some(b => b.blocker_id === currentUser.id),
                            isBlocked: blocks.some(b => b.blocker_id === targetProfile.id)
                        })
                    }
                }

                const { data: myMember } = await supabase
                    .from('members')
                    .select('status')
                    .eq('chat_id', chatId)
                    .eq('user_id', currentUser.id)
                    .single()

                if (isMounted && myMember) setUserStatus(myMember.status)
            }

            const { data: msgData } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true })

            if (isMounted) {
                setMessages(msgData || [])
                setLoading(false)
                scrollToBottom()
            }
        }

        setupChat()

        const channel = supabase.channel(`chat:${chatId}`)
            .on('postgres_changes' as any, {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${chatId}`
            }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    setMessages(prev => {
                        if (prev.find(m => m.id === payload.new.id)) return prev
                        return [...prev, payload.new as Message]
                    })
                    scrollToBottom()
                } else if (payload.eventType === 'UPDATE') {
                    setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
                } else if (payload.eventType === 'DELETE') {
                    setMessages(prev => prev.filter(m => m.id !== payload.old.id))
                }
            })
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.userId !== currentUser.id) setOtherTyping(payload.isTyping)
            })
            .subscribe()

        channelRef.current = channel

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }
    }, [chatId, currentUser?.id])

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    const handleSendMessage = async (text?: string, imageUrl?: string, voiceUrl?: string, gifUrl?: string, stickerUrl?: string) => {
        if (blockStatus.isBlocked || blockStatus.isBlocking) return
        if (!inputText.trim() && !imageUrl && !voiceUrl && !gifUrl && !stickerUrl) return
        const newMessage = {
            chat_id: chatId,
            sender_id: currentUser.id,
            text: text || (imageUrl || voiceUrl || gifUrl || stickerUrl ? null : inputText),
            image_url: imageUrl,
            voice_url: voiceUrl,
            gif_url: gifUrl,
            sticker_url: stickerUrl,
        }
        if (!imageUrl && !voiceUrl && !gifUrl && !stickerUrl) setInputText('')

        const { error } = await supabase.from('messages').insert([newMessage])
        if (error) console.error('Send error:', error)
    }

    const handleEditMessage = async (msgId: string) => {
        if (!editText.trim()) return
        const { error } = await supabase
            .from('messages')
            .update({ text: editText, edited_at: new Date().toISOString() })
            .eq('id', msgId)

        if (error) {
            console.error('Edit error:', error)
            alert('Edit failed')
        } else {
            setEditingMessageId(null)
            setEditText('')
        }
    }

    const handleDeleteForEveryone = async (msgId: string) => {
        const { error } = await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('id', msgId)

        if (error) {
            console.error('Delete error:', error)
            alert('Delete failed')
        }
    }

    const handleDeleteForMe = async (msgId: string) => {
        const msg = messages.find(m => m.id === msgId)
        if (!msg || !currentUser) return

        const deleted_for = [...(msg.deleted_for || []), currentUser.id]
        const { error } = await supabase
            .from('messages')
            .update({ deleted_for })
            .eq('id', msgId)

        if (error) {
            console.error('Delete error:', error)
            alert('Delete for me failed')
        }
    }

    const handleDeleteMessage = async (msgId: string) => {
        // Fallback for old functionality if needed, but we'll use Delete for Everyone by default for sender
        handleDeleteForEveryone(msgId)
    }

    const handleReact = async (msgId: string, emoji: string) => {
        const msg = messages.find(m => m.id === msgId)
        if (!msg || !currentUser) return

        const reactions = { ...(msg.reactions || {}) }
        const users = reactions[emoji] || []

        if (users.includes(currentUser.id)) {
            reactions[emoji] = users.filter(id => id !== currentUser.id)
            if (reactions[emoji].length === 0) delete reactions[emoji]
        } else {
            reactions[emoji] = [...users, currentUser.id]
        }

        const { error } = await supabase.from('messages').update({ reactions }).eq('id', msgId)
        if (error) {
            console.error('Reaction error:', error)
            alert('Reaction failed: Run the SQL script (ALTER TABLE messages ADD COLUMN reactions JSONB;)')
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !currentUser) return
        const filePath = `${chatId}/${Date.now()}_${file.name}`
        const { data, error } = await supabase.storage.from('chat-images').upload(filePath, file)
        if (error) return console.error('Upload error:', error)
        if (data) {
            const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath)
            handleSendMessage(undefined, publicUrl)
        }
    }

    const startRecording = async () => {
        if (isRecording) return
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            mediaRecorder.current = recorder
            audioChunks.current = []

            recorder.ondataavailable = (e) => audioChunks.current.push(e.data)
            recorder.onstop = async () => {
                const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
                if (blob.size < 1000) return // too short

                const filePath = `${chatId}/${Date.now()}.webm`
                const { data, error } = await supabase.storage.from('chat-voice').upload(filePath, blob)
                if (error) {
                    console.error('Voice upload error:', error)
                    alert('Upload failed: Please ensure you created a bucket named "chat-voice" in your Supabase Storage and set it to Public!')
                    return
                }

                const { data: { publicUrl } } = supabase.storage.from('chat-voice').getPublicUrl(filePath)
                handleSendMessage(undefined, undefined, publicUrl)
            }

            recorder.start()
            setIsRecording(true)
            setRecordDuration(0)
            timerRef.current = setInterval(() => setRecordDuration(prev => prev + 1), 1000)
            sendTyping(true)
        } catch (err) {
            console.error('Mic error:', err)
            alert('Could not access microphone')
        }
    }

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop()
            mediaRecorder.current.stream.getTracks().forEach(t => t.stop())
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
            sendTyping(false)
        }
    }

    const cancelRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop()
            mediaRecorder.current.stream.getTracks().forEach(t => t.stop())
            audioChunks.current = []
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
            sendTyping(false)
        }
    }

    const sendTyping = (isTyping: boolean) => {
        if (channelRef.current && channelRef.current.state === 'joined') {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId: currentUser.id, isTyping }
            })
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value)
        if (!typing && e.target.value.trim() !== '') {
            setTyping(true)
            sendTyping(true)
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false)
            sendTyping(false)
        }, 3000)
    }

    const formatDuration = (sec: number) => {
        const mins = Math.floor(sec / 60)
        const s = sec % 60
        return `${mins}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="h-screen w-full bg-[#0a0a0d] text-white flex overflow-hidden">
            <div className="w-[300px] lg:w-[350px] border-r border-white/5 hidden md:block h-full transition-all">
                <ChatSidebar />
            </div>

            <div className="flex-1 flex flex-col h-full relative">
                <header className="h-16 md:h-20 px-4 md:px-10 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-2xl z-20">
                    <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => setIsPreviewOpen(true)}>
                        <Link href="/chats" className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"><ChevronLeft className="w-6 h-6" /></Link>
                        <div className="relative">
                            <img src={receipient?.photo_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl object-cover bg-white/5 border border-white/10 group-hover:scale-105 transition-transform" alt="" />
                            {receipient?.type === 'user' && (
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0a0d] rounded-full" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">{receipient?.full_name || receipient?.name || 'Chat'}</h2>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                                {otherTyping ? (
                                    <span className="animate-pulse">Typing...</span>
                                ) : receipient?.type === 'group' ? (
                                    <span className="text-gray-500">{groupMembers.length} members</span>
                                ) : (
                                    'Online'
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {receipient?.type === 'user' && (
                            <>
                                <button
                                    onClick={() => startCall(receipient.id, 'voice')}
                                    className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all active:scale-90"
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => startCall(receipient.id, 'video')}
                                    className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all active:scale-90"
                                >
                                    <Video className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button onClick={() => setIsPreviewOpen(true)} className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all active:scale-90">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <ProfilePreview
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    onBlockChange={(isBlocking) => setBlockStatus(prev => ({ ...prev, isBlocking }))}
                    data={{
                        ...receipient,
                        name: receipient?.full_name || receipient?.name,
                        role: groupMembers.find(m => m.profiles.id === currentUser?.id)?.role
                    }}
                />


                <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 space-y-6 scrollbar-hide">
                    {messages
                        .filter(msg => !msg.deleted_for?.includes(currentUser?.id))
                        .map((msg) => (
                            <div key={msg.id} className={cn("group flex flex-col", msg.sender_id === currentUser?.id ? "ml-auto items-end" : "mr-auto items-start")}>
                                <div className="relative w-fit max-w-[85%] lg:max-w-[70%] group/bubble">
                                    <div className={cn("px-5 py-3.5 rounded-[1.75rem] relative transition-all duration-300",
                                        msg.sender_id === currentUser?.id ? "bg-gradient-to-br from-primary via-primary to-accent text-white shadow-lg shadow-primary/10 rounded-tr-md" : "bg-[#1e1e26] border border-white/[0.03] text-gray-100 rounded-tl-md",
                                        msg.is_deleted && "opacity-50 grayscale"
                                    )}>
                                        {msg.is_deleted ? (
                                            <p className="text-sm italic opacity-60 flex items-center gap-2">
                                                <Ban className="w-3.5 h-3.5" />
                                                This message was deleted
                                            </p>
                                        ) : (
                                            <>
                                                {editingMessageId === msg.id ? (
                                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="bg-white/10 border border-white/10 rounded-xl p-3 text-sm outline-none resize-none h-20"
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingMessageId(null)} className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                                                            <button onClick={() => handleEditMessage(msg.id)} className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/30 transition-all">Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {msg.text && (
                                                            <div className="flex flex-col gap-1">
                                                                <p className="text-sm lg:text-[15px] leading-relaxed break-words">{msg.text}</p>
                                                                {msg.edited_at && <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Edited</span>}
                                                            </div>
                                                        )}
                                                        {msg.image_url && <img src={msg.image_url} className="mt-2 rounded-2xl w-full h-auto max-h-[400px] object-cover border border-white/5" alt="" />}
                                                        {msg.voice_url && <WaveformPlayer url={msg.voice_url} />}
                                                        {msg.gif_url && <img src={msg.gif_url} className="mt-2 rounded-2xl w-full h-auto max-h-[300px] object-cover" alt="GIF" />}
                                                        {msg.sticker_url && <img src={msg.sticker_url} className="w-32 h-32 object-contain" alt="Sticker" />}
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {msg.reactions && !msg.is_deleted && Object.entries(msg.reactions).some(([_, u]) => u.length > 0) && (
                                            <div className={cn("absolute -bottom-3 flex flex-wrap gap-1 p-0.5 z-10", msg.sender_id === currentUser?.id ? "right-2" : "left-2")}>
                                                {Object.entries(msg.reactions).map(([emoji, users]) => users.length > 0 && (
                                                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className={cn("bg-[#1a1a20] border border-white/10 rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1.5 hover:bg-primary/20 transition-all shadow-xl backdrop-blur-md", users.includes(currentUser?.id) && "border-primary/50 bg-primary/10")}>
                                                        <span>{emoji}</span>{users.length > 1 && <span className="opacity-50 font-bold">{users.length}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {!msg.is_deleted && (
                                        <div className={cn("absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 pointer-events-none group-hover/bubble:pointer-events-auto z-50", msg.sender_id === currentUser?.id ? "-left-2 -translate-x-full" : "-right-2 translate-x-full")}>
                                            <div className="flex items-center gap-1.5 bg-[#1e1e26]/95 backdrop-blur-3xl border border-white/10 p-2 rounded-2xl shadow-2xl ring-1 ring-white/10">
                                                {['❤️', '🔥', '😂', '😮'].map(emoji => (
                                                    <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="p-2 hover:bg-white/10 rounded-xl text-xs transition-all hover:scale-150 duration-200 active:scale-90">{emoji}</button>
                                                ))}
                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                <div className="relative group/menu">
                                                    <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute bottom-full mb-2 right-0 bg-[#1e1e26] border border-white/10 rounded-2xl p-1.5 shadow-2xl hidden group-hover/menu:block min-w-[140px] z-50">
                                                        {msg.sender_id === currentUser?.id && msg.text && (
                                                            <button
                                                                onClick={() => { setEditingMessageId(msg.id); setEditText(msg.text || '') }}
                                                                className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 rounded-xl transition-colors"
                                                            >
                                                                Edit Message
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteForMe(msg.id)}
                                                            className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 rounded-xl transition-colors"
                                                        >
                                                            Delete for me
                                                        </button>
                                                        {msg.sender_id === currentUser?.id && (
                                                            <button
                                                                onClick={() => handleDeleteForEveryone(msg.id)}
                                                                className="flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                                                            >
                                                                Delete for Everyone
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[9px] mt-2 text-gray-500 font-bold tracking-widest px-2 opacity-40">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}

                    {otherTyping && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-1">
                            <div className="bg-[#1e1e26] border border-white/[0.03] px-5 py-4 rounded-[1.75rem] rounded-tl-md flex gap-1.5 items-center">
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-2 opacity-60">{receipient?.full_name} is typing...</span>
                        </motion.div>
                    )}
                    <div ref={scrollRef} className="h-4" />
                </div>

                <div className="px-6 lg:px-12 py-10 bg-gradient-to-t from-[#0a0a0d] to-transparent">
                    {blockStatus.isBlocking || blockStatus.isBlocked ? (
                        <div className="flex flex-col items-center gap-3 p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] backdrop-blur-xl">
                            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-2">
                                <Ban className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                {blockStatus.isBlocking ? 'You have blocked this user' : 'Chat Unavailable'}
                            </h3>
                            <p className="text-gray-500 text-sm font-medium text-center max-w-xs">
                                {blockStatus.isBlocking
                                    ? 'Unblock them from their profile to resume the giggle.'
                                    : 'You have been blocked by this user and cannot send messages.'}
                            </p>
                        </div>
                    ) : userStatus === 'pending' ? (
                        <div className="flex flex-col items-center gap-4 p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-xl">
                            <h3 className="text-xl font-bold">New Message Request</h3>
                            <div className="flex gap-3 w-full max-w-sm">
                                <button className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20">Accept</button>
                                <button className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-bold py-4 rounded-2xl">Delete</button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group max-w-5xl mx-auto w-full">
                            <AnimatePresence>
                                {isRecording && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                        className="absolute inset-x-0 -top-24 flex items-center justify-between bg-[#1e1e26]/95 backdrop-blur-3xl border border-white/10 p-4 rounded-3xl shadow-2xl z-50 ring-1 ring-white/10"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                                            <span className="font-mono text-lg font-bold tabular-nums">{formatDuration(recordDuration)}</span>
                                            <div className="flex-1 h-10 px-4">
                                                <LiveWaveform />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={cancelRecording} className="p-3 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-6 h-6" /></button>
                                            <button onClick={stopRecording} className="bg-primary p-4 rounded-2xl shadow-primary/30 shadow-lg hover:scale-105 transition-all"><Send className="w-6 h-6" /></button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-end gap-4 bg-white/[0.03] border border-white/10 p-3 rounded-[2rem] backdrop-blur-3xl shadow-2xl focus-within:border-primary/50 transition-all">
                                <label className="p-4 text-gray-400 hover:text-white cursor-pointer"><ImageIcon /><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
                                <textarea value={inputText} onChange={handleInput} rows={1} placeholder="Type a message..." className="flex-1 bg-transparent py-4 text-base outline-none resize-none max-h-40 scrollbar-hide" />
                                <div className="flex gap-2 p-1">
                                    <button onClick={() => { setPickerTab('gif'); setShowPicker(!showPicker) }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-all hover:scale-110 active:scale-95">
                                        <Grid3X3 className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => { setPickerTab('sticker'); setShowPicker(!showPicker) }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-all hover:scale-110 active:scale-95">
                                        <Smile className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => isRecording ? stopRecording() : startRecording()} className={cn("p-2.5 rounded-full transition-all hover:scale-110 active:scale-95", isRecording ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20" : "bg-white/5 hover:bg-white/10 text-gray-400")}>
                                        <Mic className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleSendMessage()} className="p-2.5 bg-primary hover:bg-accent text-white rounded-full transition-all hover:scale-110 active:scale-95 shadow-lg shadow-primary/20">
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showPicker && (
                                        <div className="absolute bottom-full right-4 mb-6 z-50">
                                            <div className="relative">
                                                {/* Connecting Arrow */}
                                                <div className="absolute -bottom-2 right-12 w-4 h-4 bg-[#1e1e26] rotate-45 border-r border-b border-white/10 z-0" />

                                                <GifStickerPanel
                                                    initialTab={pickerTab}
                                                    onSelect={(type, url) => {
                                                        if (type === 'gif') handleSendMessage(undefined, undefined, undefined, url)
                                                        else handleSendMessage(undefined, undefined, undefined, undefined, url)
                                                        setShowPicker(false)
                                                    }}
                                                    onClose={() => setShowPicker(false)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
