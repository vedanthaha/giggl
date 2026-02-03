'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Lock, UserCheck, Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function SignupPage() {
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [showOtp, setShowOtp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUsername = async () => {
            if (username.length < 3) {
                setUsernameStatus('idle')
                return
            }

            setUsernameStatus('checking')
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username.toLowerCase())
                .maybeSingle()

            if (data) {
                setUsernameStatus('taken')
            } else {
                setUsernameStatus('available')
            }
        }

        const timer = setTimeout(checkUsername, 500)
        return () => clearTimeout(timer)
    }, [username, supabase])

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (usernameStatus === 'taken') {
            setError('Please choose a different username')
            return
        }
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: true,
                }
            })
            if (error) throw error
            setShowOtp(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Try 'signup' first, then 'email'
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            })

            let session = verifyData?.session
            if (verifyError) {
                const { data: retryData, error: retryError } = await supabase.auth.verifyOtp({
                    email,
                    token: otp,
                    type: 'email'
                })
                if (retryError) throw retryError
                session = retryData?.session
            }

            if (session?.user) {
                // Create profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert([
                        {
                            id: session.user.id,
                            full_name: fullName,
                            username: username.toLowerCase(),
                        },
                    ])

                if (profileError) throw profileError
                router.push('/signup/password')
            } else {
                throw new Error('Verification failed. Please check the code.')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Background Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-accent/10 blur-[100px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm space-y-8 relative z-10"
            >
                <div className="text-center">
                    <motion.h1
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="text-7xl font-normal tracking-tight text-white font-brand"
                    >
                        Giggl
                    </motion.h1>
                    <p className="mt-3 text-gray-400 font-bold tracking-widest uppercase text-[10px]">
                        {showOtp ? 'Check your email' : 'Start meaningful conversations.'}
                    </p>
                </div>

                {!showOtp ? (
                    <form onSubmit={handleSendOtp} className="glass-card p-10 rounded-[40px] border border-white/[0.05] space-y-5 bg-white/[0.01]">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest ml-1 text-gray-500">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors z-20" />
                                <input
                                    type="text"
                                    required
                                    className="hinge-input !pl-14 !bg-white/[0.03] !border-white/5 !rounded-2xl !py-4 focus:!border-primary/50 transition-all text-white relative z-10"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest ml-1 text-gray-500">Username</label>
                            <div className="relative group">
                                <UserCheck className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors z-20" />
                                <input
                                    type="text"
                                    required
                                    className={cn(
                                        "hinge-input !pl-14 !bg-white/[0.03] !border-white/5 !rounded-2xl !py-4 focus:!border-primary/50 transition-all text-white relative z-10",
                                        usernameStatus === 'taken' && "!border-red-500/50",
                                        usernameStatus === 'available' && "!border-green-500/50"
                                    )}
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20">
                                    {usernameStatus === 'checking' && (
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    )}
                                    {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                                    {usernameStatus === 'taken' && <X className="w-5 h-5 text-red-500" />}
                                </div>
                            </div>
                            {usernameStatus === 'taken' && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">Username already taken</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest ml-1 text-gray-500">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors z-20" />
                                <input
                                    type="email"
                                    required
                                    className="hinge-input !pl-14 !bg-white/[0.03] !border-white/5 !rounded-2xl !py-4 focus:!border-primary/50 transition-all text-white relative z-10"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-[11px] text-center font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="relative group pt-2">
                            <div className="button-glow-orb opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <button
                                type="submit"
                                disabled={loading || usernameStatus === 'checking' || usernameStatus === 'taken'}
                                className="glass-glow-button w-full !rounded-2xl !py-4 font-black uppercase tracking-widest text-sm disabled:opacity-50"
                            >
                                {loading ? 'Sending Code...' : 'Continue'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="glass-card p-10 rounded-[40px] border border-white/[0.05] space-y-8 bg-white/[0.01]">
                        <div className="text-center space-y-2">
                            <p className="text-xs text-gray-400 font-medium">
                                We sent a verification code to <br />
                                <span className="font-bold text-white tracking-tight">{email}</span>
                            </p>
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors z-20" />
                            <input
                                type="text"
                                required
                                maxLength={6}
                                className="hinge-input !px-14 text-center tracking-[0.5em] font-black text-3xl !bg-white/[0.03] !border-white/5 !rounded-3xl !py-8 focus:!border-primary/50 text-white relative z-10"
                                placeholder="••••••"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-[11px] text-center font-bold bg-red-400/10 p-3 rounded-xl border border-red-400/20"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="button-glow-orb opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="glass-glow-button w-full !rounded-2xl !py-4 font-black uppercase tracking-widest text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowOtp(false)}
                                className="w-full text-gray-500 text-[10px] font-black tracking-widest uppercase hover:text-primary transition-colors"
                            >
                                Change Details
                            </button>
                        </div>
                    </form>
                )}

                {!showOtp && (
                    <p className="text-center text-xs text-gray-500 font-medium">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-black hover:text-accent transition-colors">
                            Log in
                        </Link>
                    </p>
                )}
            </motion.div>

            <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.01);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                }
            `}</style>
        </div>
    )
}
