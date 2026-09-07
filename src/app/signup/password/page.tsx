'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import localFont from 'next/font/local'

const ttHoves = localFont({ src: '../../fonts/TTHovesPro-Medium.ttf' })
const astonpoliz = localFont({ src: '../../fonts/Astonpoliz.otf' })

export default function PasswordSetupPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { error: authError } = await supabase.auth.updateUser({
                password: password,
            })

            if (authError) throw authError

            router.push('/profile/setup')
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
                <div className="w-full max-w-md p-8 sm:p-12 mx-auto my-auto">
                    <div className="mb-10 text-center lg:text-left">
                        <img src="/Giggle%20Logo.png" alt="Giggl Logo" className="h-16 object-contain mb-8 lg:hidden mx-auto" />
                        <h1 className={`text-4xl font-bold text-white mb-3 tracking-tight ${ttHoves.className}`}>
                            Secure your space
                        </h1>
                        <p className={`text-gray-400 ${astonpoliz.className}`}>
                            Set a strong password for your account.
                        </p>
                    </div>

                    <form onSubmit={handleSetPassword} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ${ttHoves.className}`}>
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className={`w-full px-5 py-4 pr-12 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className={`block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ${ttHoves.className}`}>
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className={`w-full px-5 py-4 pr-12 bg-white/[0.03] border border-white/5 rounded-2xl focus:border-white/20 outline-none transition-all text-white placeholder:text-gray-600 ${ttHoves.className}`}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
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
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !password || password !== confirmPassword}
                                className={`w-full bg-white text-black py-4 px-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 ${ttHoves.className}`}
                            >
                                {loading ? 'Setting Password...' : 'Protect Account'}
                            </button>
                        </div>
                    </form>

                    <p className={`text-center text-xs text-gray-500 font-bold uppercase tracking-widest mt-8 ${ttHoves.className}`}>
                        Verification successful. One last step.
                    </p>
                </div>
            </div>
        </div>
    )
}
