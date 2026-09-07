'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import localFont from 'next/font/local'

const ttHoves = localFont({ src: '../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../fonts/Astonpoliz.otf' })

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError

            router.push('/chats')
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
            <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] relative">
                {/* Mobile back button */}
                <div className="absolute top-6 left-6 z-10 lg:hidden">
                    <Link
                        href="/"
                        className="w-10 h-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                </div>
                <div className="w-full max-w-md p-8 sm:p-12">
                    <div className="mb-12">
                        <img src="/Giggle%20Logo.png" alt="Giggl Logo" className="h-16 object-contain mb-8 lg:hidden" />
                        <h1 className={`text-4xl font-bold text-white mb-3 tracking-tight ${ttHoves.className}`}>
                            Sign In
                        </h1>
                        <p className={`text-gray-400 ${astonpoliz.className}`}>
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/signup"
                                className="text-white hover:text-gray-300 font-bold transition-colors underline decoration-white/20 underline-offset-4"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ${ttHoves.className}`}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className={`w-full px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ${ttHoves.className}`}>
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full px-5 py-4 pr-12 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me + Forgot Password */}
                        <div className={`flex items-center justify-between pt-2 ${ttHoves.className}`}>
                            <label className="flex items-center space-x-3 text-sm text-gray-400 cursor-pointer">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer w-5 h-5 bg-white/[0.03] border border-white/10 rounded cursor-pointer appearance-none checked:bg-white transition-colors"
                                    />
                                    <svg className="absolute w-3 h-3 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 text-black" viewBox="0 0 14 14" fill="none">
                                        <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                                <span>Remember me</span>
                            </label>
                            <button
                                type="button"
                                className="text-sm text-white hover:text-gray-300 font-medium transition-colors"
                            >
                                Forgot password?
                            </button>
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
                            disabled={loading}
                            className={`w-full bg-white text-black py-4 px-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4 ${ttHoves.className}`}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
