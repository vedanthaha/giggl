'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, AtSign, Calendar, Shield, Users, Info, Ban, Flag, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface ProfilePreviewProps {
    isOpen: boolean
    onClose: () => void
    onBlockChange?: (isBlocking: boolean) => void
    data: {
        id?: string
        type: 'user' | 'group'
        name: string
        username?: string
        photo_url?: string
        bio?: string
        joined_at?: string
        members?: any[]
        role?: string
    }
}

export default function ProfilePreview({ isOpen, onClose, onBlockChange, data }: ProfilePreviewProps) {
    const [isBlocked, setIsBlocked] = useState(false)
    const [loading, setLoading] = useState(false)
    const [reportSent, setReportSent] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen && data.type === 'user' && data.id) {
            checkBlockStatus()
        }
    }, [isOpen, data.id])

    const checkBlockStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !data.id) return

        const { data: blockData } = await supabase
            .from('blocks')
            .select('*')
            .eq('blocker_id', user.id)
            .eq('blocked_id', data.id)
            .maybeSingle()

        setIsBlocked(!!blockData)
    }

    const handleBlock = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !data.id) return

        if (isBlocked) {
            await supabase
                .from('blocks')
                .delete()
                .eq('blocker_id', user.id)
                .eq('blocked_id', data.id)
            setIsBlocked(false)
            onBlockChange?.(false)
        } else {
            await supabase
                .from('blocks')
                .insert({ blocker_id: user.id, blocked_id: data.id })
            setIsBlocked(true)
            onBlockChange?.(true)
        }
        setLoading(false)
    }

    const handleReport = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !data.id) return

        await supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                reported_id: data.id,
                reason: 'Reported from profile'
            })

        setReportSent(true)
        setTimeout(() => setReportSent(false), 3000)
        setLoading(false)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 w-full max-w-sm h-full bg-[#0a0a0d] border-l border-white/5 z-[101] overflow-y-auto"
                    >
                        {/* Header Image */}
                        <div className="relative h-80 w-full">
                            <img
                                src={data.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username || data.name}`}
                                className="w-full h-full object-cover"
                                alt=""
                            />
                            {/* Gradient Overlay for visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-transparent to-black/20" />

                            <button
                                onClick={onClose}
                                className="absolute top-6 left-6 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all border border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Floating Name/Username over image bottom */}
                            <div className="absolute bottom-6 left-8 right-8">
                                <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">{data.name}</h2>
                                {data.username && (
                                    <p className="text-primary font-bold flex items-center gap-1.5 antialiased drop-shadow-md mt-1">
                                        <AtSign className="w-4 h-4" />
                                        {data.username}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-8 space-y-8">
                            {/* Bio Section */}
                            {data.bio && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <Info className="w-3 h-3" />
                                        About
                                    </div>
                                    <p className="text-gray-300 leading-relaxed text-[15px] font-medium">
                                        {data.bio}
                                    </p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                {data.joined_at && (
                                    <div className="flex items-center gap-4 text-gray-400 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                        <div className="p-2.5 bg-white/5 rounded-xl">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Joined</p>
                                            <p className="text-sm font-bold text-white mt-0.5">{format(new Date(data.joined_at), 'MMMM yyyy')}</p>
                                        </div>
                                    </div>
                                )}

                                {data.type === 'group' && data.members && (
                                    <div className="flex items-center gap-4 text-gray-400 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                        <div className="p-2.5 bg-white/5 rounded-xl">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Members</p>
                                            <p className="text-sm font-bold text-white mt-0.5">{data.members.length} participants</p>
                                        </div>
                                    </div>
                                )}

                                {data.role && (
                                    <div className="flex items-center gap-4 text-gray-400 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                        <div className="p-2.5 bg-white/5 rounded-xl">
                                            <Shield className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Your Role</p>
                                            <p className="text-sm font-bold text-primary mt-0.5 uppercase tracking-wider">{data.role}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Group Members List */}
                            {data.type === 'group' && data.members && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Participants</h3>
                                    <div className="space-y-3">
                                        {data.members.map((member: any) => (
                                            <div key={member.profiles.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.02] rounded-2xl transition-all group border border-transparent hover:border-white/5">
                                                <img
                                                    src={member.profiles.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profiles.username}`}
                                                    className="w-10 h-10 rounded-xl object-cover border border-white/10"
                                                    alt=""
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{member.profiles.full_name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold tracking-tight">@{member.profiles.username}</p>
                                                </div>
                                                {member.role === 'admin' && (
                                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                                        <Shield className="w-3.5 h-3.5 text-primary fill-primary/20" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Safety Actions */}
                            {data.type === 'user' && (
                                <div className="pt-4 space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 px-1">Safety & Privacy</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={handleBlock}
                                            disabled={loading}
                                            className={cn(
                                                "flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold transition-all border",
                                                isBlocked
                                                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                                    : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                                            )}
                                        >
                                            <Ban className="w-5 h-5" />
                                            {isBlocked ? 'Unblock User' : 'Block User'}
                                        </button>

                                        <button
                                            onClick={handleReport}
                                            disabled={loading || reportSent}
                                            className={cn(
                                                "flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold transition-all border",
                                                reportSent
                                                    ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {reportSent ? <CheckCircle2 className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
                                            {reportSent ? 'Report Submitted' : 'Report User'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 text-center px-4 leading-relaxed font-medium">
                                        Blocking a user will prevent them from messaging you. They won't be notified.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
