'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, UserCheck, Mail, Lock, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import localFont from 'next/font/local'
import GoogleSignInButton from '@/components/GoogleSignInButton'

const ttHoves = localFont({ src: '../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../fonts/Astonpoliz.otf' })

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
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const err = params.get('error')
            if (err) setError(err)
        }
    }, [])

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
        <div className="h-screen w-screen bg-[#0a0a0a] flex">
            {/* Left Panel - Image Section */}
            <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-black border-r border-white/5">
                {/* Back Button */}
                <div className="absolute top-6 left-6 z-20">
                    <Link
                        href="/"
                        className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-black/60 transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                </div>

                <div className="absolute inset-0 z-0">
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover grayscale opacity-50"
                    >
                        <source src="/lonely-homer-starry-night-sky-pixel-moewalls-com.mp4" type="video/mp4" />
                    </video>
                    {/* Gradient overlay to make text pop */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12 z-10">
                    <img src="/Giggle%20Logo.png" alt="Giggl Logo" className="h-16 object-contain mb-8 invert mix-blend-screen opacity-90" />
                    <h2 className={`text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight ${ttHoves.className}`}>Move your world <br/> somewhere better.</h2>
                    <p className={`text-gray-300 text-lg lg:text-xl ${astonpoliz.className}`}>Start meaningful conversations in complete privacy.</p>
                </div>
            </div>

            {/* Right Panel - Form Section */}
            <div className="flex-1 flex flex-col justify-center bg-[#0a0a0a] relative overflow-y-auto">
                {/* Mobile back button */}
                <div className="absolute top-6 left-6 z-10 lg:hidden">
                    <Link
                        href="/"
                        className="w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                </div>
                
                <div className="w-full max-w-md p-8 sm:p-12 mx-auto my-auto">
                    <div className="mb-8">
                        <img src="/Giggle%20Logo.png" alt="Giggl Logo" className="h-16 object-contain mb-8 lg:hidden" />
                        <h1 className={`text-4xl font-bold text-white mb-3 tracking-tight ${ttHoves.className}`}>
                            Create Account
                        </h1>
                        {!showOtp && (
                            <p className={`text-gray-400 ${astonpoliz.className}`}>
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="text-white hover:text-gray-300 font-bold transition-colors underline decoration-white/20 underline-offset-4"
                                >
                                    Log in
                                </Link>
                            </p>
                        )}
                        {showOtp && (
                            <p className="text-gray-400 text-sm">
                                We sent a verification code to <span className="font-bold text-white">{email}</span>
                            </p>
                        )}
                    </div>

                    {/* Form */}
                    {!showOtp ? (
                        <>
                            {/* Google OAuth Button */}
                            <GoogleSignInButton
                                text="Continue with Google"
                                className={ttHoves.className}
                                onError={(msg) => setError(msg)}
                            />

                            {/* Divider */}
                            <div className="relative my-6 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className={`relative bg-[#0a0a0a] px-4 text-xs uppercase tracking-widest text-gray-500 font-bold ${ttHoves.className}`}>
                                    or
                                </div>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ${ttHoves.className}`}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className={`w-full px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`}
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ${ttHoves.className}`}>
                                    Username
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        className={cn(
                                            `w-full px-5 py-4 pr-12 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`,
                                            usernameStatus === 'taken' && "!border-red-500/50",
                                            usernameStatus === 'available' && "!border-green-500/50"
                                        )}
                                        placeholder="johndoe"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20">
                                        {usernameStatus === 'checking' && (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        )}
                                        {usernameStatus === 'available' && <Check className="w-5 h-5 text-green-500" />}
                                        {usernameStatus === 'taken' && <X className="w-5 h-5 text-red-500" />}
                                    </div>
                                </div>
                                {usernameStatus === 'taken' && (
                                    <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">Username already taken</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ${ttHoves.className}`}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className={`w-full px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`}
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-red-400 text-xs text-center font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20"
                                >
                                    {error}
                                </motion.p>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || usernameStatus === 'checking' || usernameStatus === 'taken'}
                                className={`w-full bg-white text-black py-4 px-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 mt-6 ${ttHoves.className}`}
                            >
                                {loading ? 'Sending Code...' : 'Continue'}
                            </button>
                        </form>
                        </>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-center ${ttHoves.className}`}>
                                    6-Digit Verification Code
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className={`w-full px-5 py-6 text-center tracking-[0.5em] font-black text-3xl bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`}
                                    placeholder="••••••"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-red-400 text-xs text-center font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <div className="space-y-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className={`w-full bg-white text-black py-4 px-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 ${ttHoves.className}`}
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowOtp(false)}
                                    className={`w-full text-gray-500 text-xs font-bold tracking-widest uppercase hover:text-white transition-colors ${ttHoves.className}`}
                                >
                                    Change Email
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
