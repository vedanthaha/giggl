'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Check, ChevronRight, Search, Sparkles } from 'lucide-react'

const PREBUILT_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Dustin',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
]

export default function ProfileSetupPage() {
    const [bio, setBio] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [step, setStep] = useState<'profile' | 'friends'>('profile')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)
        }
        getUser()
    }, [supabase, router])

    const handleSearch = async (val: string) => {
        setSearchQuery(val)
        if (val.length < 2) {
            setSearchResults([])
            return
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${val}%`)
            .neq('id', userId)
            .limit(5)

        setSearchResults(data || [])
    }

    const startChat = async (otherId: string) => {
        if (!userId) return
        setLoading(true)
        try {
            // Check if DM exists
            const { data: existingChat } = await supabase.rpc('get_dm_chat', {
                other_user_id: otherId
            })

            if (existingChat) {
                router.push(`/chats/${existingChat}`)
                return
            }

            // Create new DM
            const { data: newChat, error: chatError } = await supabase
                .from('chats')
                .insert([{ type: 'dm' }])
                .select()
                .single()

            if (chatError) throw chatError

            // Add members
            await supabase.from('members').insert([
                { chat_id: newChat.id, user_id: userId },
                { chat_id: newChat.id, user_id: otherId }
            ])

            router.push(`/chats/${newChat.id}`)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteSetup = async () => {
        if (!userId) return
        setLoading(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    bio,
                    photo_url: selectedAvatar,
                })
                .eq('id', userId)

            if (error) throw error
            setStep('friends')
        } catch (error) {
            console.error('Error updating profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !userId) return

        setLoading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `${userId}/avatar.${fileExt}`

            // Local preview immediately
            setSelectedAvatar(URL.createObjectURL(file))

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
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen px-6 py-12 pb-24 max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
            >
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
                        {step === 'profile' ? "Welcome to Giggl!" : "Find your vibe"}
                        {step === 'profile' ? <Sparkles className="w-8 h-8 text-primary" /> : <Search className="w-8 h-8 text-primary" />}
                    </h1>
                    <p className="text-secondary mt-2 text-lg">
                        {step === 'profile'
                            ? "First, let's make your profile look great."
                            : "Search for people you know to start chatting."}
                    </p>
                </div>

                {step === 'profile' ? (
                    <div className="space-y-10 text-foreground">
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Camera className="w-5 h-5 text-primary" />
                                Choose a profile photo
                            </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {PREBUILT_AVATARS.map((url) => (
                                    <button
                                        key={url}
                                        onClick={() => setSelectedAvatar(url)}
                                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedAvatar === url ? 'border-primary ring-4 ring-primary/10 scale-95' : 'border-transparent'
                                            }`}
                                    >
                                        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                                        {selectedAvatar === url && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <Check className="text-white w-8 h-8" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                                <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-white/[0.02] transition-all group overflow-hidden relative">
                                    {selectedAvatar && !PREBUILT_AVATARS.includes(selectedAvatar) ? (
                                        <>
                                            <img src={selectedAvatar} alt="Upload" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Camera className="text-white w-6 h-6" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="text-gray-500 group-hover:text-primary transition-colors w-6 h-6" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-primary/70">Add Photo</span>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-bold">Your Bio</h2>
                            <div className="hinge-card !p-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell the world something about yourself..."
                                    className="w-full h-32 p-4 bg-transparent outline-none resize-none text-lg"
                                />
                            </div>
                        </section>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCompleteSetup}
                            disabled={loading || !selectedAvatar}
                            className="w-full hinge-button flex items-center justify-center gap-2 py-4 text-lg shadow-xl shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Next: Find Friends'}
                            <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </div>
                ) : (
                    <div className="space-y-6 text-foreground">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                className="hinge-input pl-14 h-16 text-lg !bg-white/[0.03] !border-white/5 focus:!border-primary/30"
                                placeholder="Search usernames..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            {searchResults.map((user) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="hinge-card flex items-center justify-between p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-12 h-12 rounded-full" />
                                        <div>
                                            <p className="font-bold">{user.full_name}</p>
                                            <p className="text-sm text-secondary">@{user.username}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => startChat(user.id)}
                                        className="hinge-button !py-2 !px-4 text-sm"
                                    >
                                        Message
                                    </button>
                                </motion.div>
                            ))}
                            {searchQuery.length > 2 && searchResults.length === 0 && (
                                <p className="text-center text-secondary py-8">No users found with that name.</p>
                            )}
                        </div>

                        <button
                            onClick={() => router.push('/chats')}
                            className="w-full text-secondary font-bold py-4 hover:text-primary transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
