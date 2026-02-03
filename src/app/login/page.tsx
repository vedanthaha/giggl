'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
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
                    <p className="mt-3 text-gray-400 font-bold tracking-widest uppercase text-[10px]">Welcome back!</p>
                </div>

                <form onSubmit={handleLogin} className="glass-card p-10 rounded-[40px] border border-white/[0.05] space-y-6 bg-white/[0.01]">
                    <div className="space-y-4">
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

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest ml-1 text-gray-500">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors z-20" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="hinge-input !pl-14 !pr-14 !bg-white/[0.03] !border-white/5 !rounded-2xl !py-4 focus:!border-primary/50 transition-all text-white relative z-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-20"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
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
                            disabled={loading}
                            className="glass-glow-button w-full !rounded-2xl !py-4 font-black uppercase tracking-widest text-sm disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs text-gray-500 font-medium">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-primary font-black hover:text-accent transition-colors">
                        Sign up
                    </Link>
                </p>
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
