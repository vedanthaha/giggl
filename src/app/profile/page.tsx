'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronLeft, Camera, Check, LogOut, Loader2, Smartphone, Shield, Monitor, Key, Moon, Sun, MonitorPlay, AlertTriangle, User, Mail, Lock } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import GlobalSidebar from '@/components/GlobalSidebar'
import localFont from 'next/font/local'

const ttHoves = localFont({ src: '../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../fonts/Astonpoliz.otf' })
const svetze = localFont({ src: '../fonts/Svetze.otf' })

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

// Custom minimal switch component
function Switch({ checked, onChange, disabled = false }: { checked: boolean, onChange: () => void, disabled?: boolean }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onChange}
            className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                checked ? "bg-primary" : "bg-white/10"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none absolute left-0.5 inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    checked ? "translate-x-4" : "translate-x-0"
                )}
            />
        </button>
    )
}

function SectionHeading({ title, description }: { title: string, description: string }) {
    return (
        <div className="mb-8">
            <h2 className={`text-2xl font-bold text-white tracking-tight ${svetze.className}`}>{title}</h2>
            <p className={`text-sm text-gray-500 mt-1 ${ttHoves.className}`}>{description}</p>
        </div>
    )
}

function Row({ label, description, children, border = true }: { label: string, description?: string, children: React.ReactNode, border?: boolean }) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between py-5 gap-4", border && "border-b border-white/5")}>
            <div className="flex-1 pr-8">
                <p className={`text-[15px] font-bold text-white ${ttHoves.className}`}>{label}</p>
                {description && <p className={`text-xs text-gray-500 mt-1 ${ttHoves.className}`}>{description}</p>}
            </div>
            <div className="flex-shrink-0 flex items-center justify-end">
                {children}
            </div>
        </div>
    )
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState('')
    
    // Auth user info
    const [email, setEmail] = useState('')
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    
    // Preferences (mock state for UI)
    const [theme, setTheme] = useState<'system'|'dark'|'light'>('dark')
    const [notifMessages, setNotifMessages] = useState(true)
    const [notifCalls, setNotifCalls] = useState(true)
    const [notifMentions, setNotifMentions] = useState(true)
    const [notifFriends, setNotifFriends] = useState(false)
    const [privacyVisibility, setPrivacyVisibility] = useState<'public'|'friends'>('public')
    const [privacyReadReceipts, setPrivacyReadReceipts] = useState(true)
    
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
            setEmail(user.email || '')

            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

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

        const localUrl = URL.createObjectURL(file)
        setSelectedAvatar(localUrl)
        setSaving(true)

        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
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
            const { error } = await supabase.from('profiles').update({
                full_name: fullName,
                username: username,
                bio: bio,
                photo_url: selectedAvatar
            }).eq('id', userId)

            if (error) throw error
            // Show brief success state, wait, then continue
            setTimeout(() => setSaving(false), 500)
        } catch (error) {
            console.error('Error updating profile:', error)
            setSaving(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="h-[100dvh] w-full bg-[#0a0a0a] flex overflow-hidden">
                <GlobalSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="h-[100dvh] w-full bg-[#0a0a0a] flex overflow-hidden selection:bg-primary/30">
            <GlobalSidebar />
            
            <div className="flex-1 overflow-y-auto relative scrollbar-hide">
                <div className="max-w-[900px] mx-auto px-6 lg:px-16 pt-16 pb-40">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <button onClick={() => router.back()} className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <h1 className={`text-4xl md:text-5xl font-normal tracking-tight text-white ${svetze.className}`}>Settings</h1>
                            </div>
                            <p className={`text-gray-500 text-sm uppercase tracking-widest font-bold ${astonpoliz.className}`}>Manage your account, preferences, and identity</p>
                        </div>
                    </div>

                    <div className="space-y-24">
                        {/* Section 1: Profile */}
                        <section>
                            <SectionHeading title="Profile" description="Customize how others see you on Giggl." />
                            
                            <div className="flex flex-col md:flex-row gap-12 pt-4">
                                <div className="space-y-6 shrink-0 w-full md:w-64 lg:w-72">
                                    <div className="relative group w-32 h-32 md:w-40 md:h-40">
                                        <div className="w-full h-full rounded-[2rem] border border-white/10 bg-white/5 relative overflow-hidden group">
                                            <img
                                                src={selectedAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                className="w-full h-full object-cover"
                                                alt="Profile"
                                            />
                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-white gap-2">
                                                <Camera className="w-6 h-6" />
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${astonpoliz.className}`}>Change</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        {PREBUILT_AVATARS.map((url) => (
                                            <button
                                                key={url}
                                                onClick={() => setSelectedAvatar(url)}
                                                className={cn(
                                                    "aspect-square rounded-xl overflow-hidden transition-all",
                                                    selectedAvatar === url ? "ring-2 ring-primary ring-offset-2 ring-offset-[#0a0a0a]" : "opacity-50 hover:opacity-100"
                                                )}
                                            >
                                                <img src={url} alt="Avatar" className="w-full h-full object-cover rounded-xl bg-white/5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6 min-w-0">
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 ${astonpoliz.className}`}>Display Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className={`w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/50 transition-colors ${ttHoves.className}`}
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 ${astonpoliz.className}`}>Username</label>
                                        <div className="relative">
                                            <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold ${ttHoves.className}`}>@</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                                className={`w-full bg-white/[0.02] border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-white text-[15px] outline-none focus:border-primary/50 transition-colors ${ttHoves.className}`}
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <label className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 ${astonpoliz.className}`}>Bio</label>
                                            <span className={`text-[10px] text-gray-600 ${ttHoves.className}`}>{bio.length}/150</span>
                                        </div>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value.slice(0, 150))}
                                            placeholder="Tell your vibe..."
                                            className={`w-full bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-4 text-white text-[15px] outline-none focus:border-primary/50 transition-colors resize-none h-32 ${ttHoves.className}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Section 2: Account */}
                        <section>
                            <SectionHeading title="Account" description="Manage your contact and authentication information." />
                            <div className="mt-6">
                                <Row label="Email Address" description={email || 'Not provided'}>
                                    <button className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl ${astonpoliz.className}`}>Change</button>
                                </Row>
                                <Row label="Phone Number" description="Not connected">
                                    <button className={`text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl ${astonpoliz.className}`}>Add</button>
                                </Row>
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Section 3: Preferences */}
                        <section>
                            <SectionHeading title="Preferences" description="Customize your application experience." />
                            <div className="mt-6">
                                <Row label="Theme" description="Choose how Giggl looks to you.">
                                    <div className="flex bg-white/5 rounded-xl p-1">
                                        <button onClick={() => setTheme('light')} className={cn("p-2 rounded-lg transition-colors", theme === 'light' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}><Sun className="w-4 h-4" /></button>
                                        <button onClick={() => setTheme('dark')} className={cn("p-2 rounded-lg transition-colors", theme === 'dark' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}><Moon className="w-4 h-4" /></button>
                                        <button onClick={() => setTheme('system')} className={cn("p-2 rounded-lg transition-colors", theme === 'system' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}><Monitor className="w-4 h-4" /></button>
                                    </div>
                                </Row>
                                <Row label="Accent Color" description="Your personal touch.">
                                    <div className="flex gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary ring-2 ring-primary ring-offset-2 ring-offset-[#0a0a0a]" />
                                        <div className="w-6 h-6 rounded-full bg-blue-500 opacity-30 cursor-not-allowed" />
                                        <div className="w-6 h-6 rounded-full bg-green-500 opacity-30 cursor-not-allowed" />
                                    </div>
                                </Row>
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Section 4: Notifications */}
                        <section>
                            <SectionHeading title="Notifications" description="Control what alerts you receive and when." />
                            <div className="mt-6">
                                <Row label="Direct Messages" description="Receive push notifications for new DMs.">
                                    <Switch checked={notifMessages} onChange={() => setNotifMessages(!notifMessages)} />
                                </Row>
                                <Row label="Incoming Calls" description="Be alerted when someone rings you.">
                                    <Switch checked={notifCalls} onChange={() => setNotifCalls(!notifCalls)} />
                                </Row>
                                <Row label="Mentions" description="Get notified when someone @mentions you in a group.">
                                    <Switch checked={notifMentions} onChange={() => setNotifMentions(!notifMentions)} />
                                </Row>
                                <Row label="Friend Activity" description="Know when a friend comes online.">
                                    <Switch checked={notifFriends} onChange={() => setNotifFriends(!notifFriends)} />
                                </Row>
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Section 5: Privacy */}
                        <section>
                            <SectionHeading title="Privacy" description="Control who can see and interact with you." />
                            <div className="mt-6">
                                <Row label="Profile Visibility" description="Who can find you via search.">
                                    <select 
                                        value={privacyVisibility}
                                        onChange={(e) => setPrivacyVisibility(e.target.value as any)}
                                        className={`bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-primary/50 ${ttHoves.className}`}
                                    >
                                        <option value="public">Everyone</option>
                                        <option value="friends">Friends Only</option>
                                    </select>
                                </Row>
                                <Row label="Read Receipts" description="Let others know when you've read their messages.">
                                    <Switch checked={privacyReadReceipts} onChange={() => setPrivacyReadReceipts(!privacyReadReceipts)} />
                                </Row>
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Section 6: Security (Placeholders for non-existent backend features) */}
                        <section>
                            <SectionHeading title="Security" description="Keep your account safe and secure." />
                            <div className="mt-6">
                                <Row label="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                                    <button disabled className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl cursor-not-allowed ${astonpoliz.className}`}>Enable (Coming Soon)</button>
                                </Row>
                                <Row label="Active Sessions" description="Devices currently logged into your account.">
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl">
                                        <MonitorPlay className="w-4 h-4 text-green-400" />
                                        <span className={`text-[13px] text-gray-300 ${ttHoves.className}`}>Windows - Chrome (Current)</span>
                                    </div>
                                </Row>
                                <Row label="End-to-End Encryption" description="Verify your device keys.">
                                    <button disabled className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl cursor-not-allowed ${astonpoliz.className}`}>View Keys</button>
                                </Row>
                            </div>
                        </section>

                        <hr className="border-white/5" />

                        {/* Section 7: Danger Zone */}
                        <section>
                            <SectionHeading title="Danger Zone" description="Irreversible and destructive actions." />
                            <div className="mt-6 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-red-500/20 bg-red-500/5 rounded-2xl gap-4">
                                    <div>
                                        <p className={`text-[15px] font-bold text-red-400 ${ttHoves.className}`}>Log Out</p>
                                        <p className={`text-xs text-red-400/60 mt-1 ${ttHoves.className}`}>Sign out of Giggl on this device.</p>
                                    </div>
                                    <button onClick={handleLogout} className={`flex-shrink-0 flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-3 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest ${astonpoliz.className}`}>
                                        <LogOut className="w-4 h-4" />
                                        Log Out
                                    </button>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-red-500/20 bg-red-500/5 rounded-2xl gap-4">
                                    <div>
                                        <p className={`text-[15px] font-bold text-red-400 ${ttHoves.className}`}>Delete Account</p>
                                        <p className={`text-xs text-red-400/60 mt-1 ${ttHoves.className}`}>Permanently delete your account and all data.</p>
                                    </div>
                                    <button disabled className={`flex-shrink-0 bg-red-500 text-white opacity-50 cursor-not-allowed px-6 py-3 rounded-xl transition-colors text-[10px] font-bold uppercase tracking-widest ${astonpoliz.className}`}>
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </section>
                        
                    </div>
                </div>
            </div>

            {/* Persistent Save Action */}
            <div className="fixed bottom-0 left-0 lg:left-[240px] right-0 p-6 flex justify-end pointer-events-none z-50">
                <button
                    onClick={handleUpdateProfile}
                    disabled={saving || !fullName || !username}
                    className={cn(
                        `pointer-events-auto flex items-center gap-3 px-8 py-4 rounded-2xl text-[12px] font-bold uppercase tracking-widest shadow-2xl transition-all shadow-primary/20 hover:-translate-y-1 active:translate-y-0 ${astonpoliz.className}`,
                        saving ? "bg-primary/50 text-white cursor-not-allowed" : "bg-primary hover:brightness-110 text-white",
                        (!fullName || !username) && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>
            
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
            </div>
        </div>
    )
}
