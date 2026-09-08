'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface GoogleSignInButtonProps {
    text?: string
    className?: string
    onError?: (error: string) => void
}

export default function GoogleSignInButton({
    text = 'Continue with Google',
    className = '',
    onError,
}: GoogleSignInButtonProps) {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                throw error
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to connect with Google'
            if (onError) {
                onError(message)
            }
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 py-4 px-5 bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.99] border border-white/10 hover:border-white/20 rounded-2xl text-white font-bold text-sm tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin flex-shrink-0" />
            ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                </svg>
            )}
            <span>{loading ? 'Connecting...' : text}</span>
        </button>
    )
}
