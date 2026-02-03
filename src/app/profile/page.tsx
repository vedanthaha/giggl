'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Camera, Check, LogOut, Loader2, Sparkles, User } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const PREBUILT_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=George',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
]

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                setProfile(data)
                setFullName(data.full_name || '')
                setUsername(data.username || '')
                setBio(data.bio || '')
                setSelectedAvatar(data.photo_url || '')
            }
            setLoading(false)
        }
        fetchProfile()
    }, [supabase, router])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !userId) return

        // Local preview
        const localUrl = URL.createObjectURL(file)
        setSelectedAvatar(localUrl)
        setSaving(true)

        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setSelectedAvatar(publicUrl)
        } catch (error) {
            console.error('Error uploading file:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateProfile = async () => {
        if (!userId) return
        setSaving(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    username: username,
                    bio: bio,
                    photo_url: selectedAvatar
                })
                .eq('id', userId)

            if (error) throw error
            router.push('/chats')
        } catch (error) {
            console.error('Error updating profile:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col w-full max-w-6xl mx-auto border-x border-white/5 relative overflow-hidden">
            {/* Header */}
            <header className="px-10 py-10 flex items-center justify-between bg-black/20 backdrop-blur-xl border-b border-white/5 z-10">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-4xl font-normal tracking-tight text-primary font-brand">Profile Settings</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                    <LogOut className="w-3 h-3" />
                    Logout
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column - Avatar */}
                    <aside className="lg:col-span-4 space-y-8">
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Identity
                                <Sparkles className="w-4 h-4 text-primary" />
                            </h2>

                            <div className="relative group mx-auto lg:mx-0 w-48 h-48 md:w-64 md:h-64">
                                <div className="w-full h-full rounded-[40px] border-2 border-white/5 p-4 bg-white/[0.02] relative overflow-hidden group">
                                    <img
                                        src={selectedAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                        className="w-full h-full object-cover rounded-[30px]"
                                        alt="Current Profile"
                                    />
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-white gap-2">
                                        <Camera className="w-8 h-8" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Change Photo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                                {saving && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-[40px] flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-3 gap-3 pt-4">
                                {PREBUILT_AVATARS.map((url) => (
                                    <button
                                        key={url}
                                        onClick={() => setSelectedAvatar(url)}
                                        className={cn(
                                            "aspect-square rounded-xl overflow-hidden border-2 transition-all active:scale-90",
                                            selectedAvatar === url ? "border-primary p-0.5 scale-105" : "border-transparent opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                                        )}
                                    >
                                        <img src={url} alt="Avatar" className="w-full h-full object-cover rounded-lg" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    </aside>

                    {/* Right Column - Info */}
                    <main className="lg:col-span-8 space-y-10">
                        <section className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="hinge-input pl-16 h-20 text-xl !bg-white/[0.03] !border-white/5 focus:!border-primary/30 !rounded-3xl"
                                        placeholder="Your Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">@</div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        className="hinge-input pl-14 h-20 text-xl !bg-white/[0.03] !border-white/5 focus:!border-primary/30 !rounded-3xl"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Bio</label>
                                <div className="hinge-card !p-1 bg-white/[0.03] border-white/5 focus-within:border-primary/30 transition-all !rounded-[2.5rem]">
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell your vibe..."
                                        className="w-full h-48 p-7 bg-transparent outline-none resize-none text-xl text-white placeholder:text-gray-600 leading-relaxed"
                                    />
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-10 bg-black/20 backdrop-blur-xl border-t border-white/5 flex justify-end">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateProfile}
                    disabled={saving || !fullName}
                    className="w-full md:w-auto md:min-w-[240px] hinge-button flex items-center justify-center gap-3 py-5 px-10 text-xl shadow-xl shadow-primary/20 disabled:opacity-50 !rounded-2xl"
                >
                    {saving ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                        <>
                            Save Changes
                            <Check className="w-6 h-6" />
                        </>
                    )}
                </motion.button>
            </div>

            {/* Background Effects */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
    )
}
