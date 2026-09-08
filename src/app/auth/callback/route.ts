import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/chats'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            const user = data.user

            // Ensure profile exists for the authenticated user
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()

            if (!existingProfile) {
                const fullName =
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split('@')[0] ||
                    'Giggl User'

                let baseUsername = (
                    user.user_metadata?.preferred_username ||
                    user.user_metadata?.user_name ||
                    user.email?.split('@')[0] ||
                    'user'
                )
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, '')
                    .slice(0, 15)

                if (baseUsername.length < 3) {
                    baseUsername = 'user'
                }

                let finalUsername = baseUsername
                const { data: existingUser } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', finalUsername)
                    .maybeSingle()

                if (existingUser) {
                    finalUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`
                }

                const photoUrl =
                    user.user_metadata?.avatar_url ||
                    user.user_metadata?.picture ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${finalUsername}`

                await supabase.from('profiles').upsert([
                    {
                        id: user.id,
                        full_name: fullName,
                        username: finalUsername,
                        photo_url: photoUrl,
                    },
                ])
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Could%20not%20authenticate%20with%20Google`)
}
