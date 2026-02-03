'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function PresenceHandler() {
    const supabase = createClient()

    useEffect(() => {
        let user: { id: string } | null = null

        const setupPresence = async () => {
            const { data, error } = await supabase.auth.getUser()
            user = data?.user
            if (error || !user) return

            const channel = supabase.channel('online-users', {
                config: {
                    presence: {
                        key: user.id,
                    },
                },
            })

            channel
                .on('presence', { event: 'sync' }, () => {
                    // Can track all online users here if needed
                })
                .on('presence', { event: 'join' }, ({ newPresences: _newPresences }) => {
                    // Update profile status in DB to online
                    updateStatus(true)
                })
                .on('presence', { event: 'leave' }, ({ leftPresences: _leftPresences }) => {
                    // Update profile status in DB to offline
                    updateStatus(false)
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            online_at: new Date().toISOString(),
                        })
                    }
                })

            return channel
        }

        const updateStatus = async (isOnline: boolean) => {
            if (!user) return
            await supabase
                .from('profiles')
                .update({
                    is_online: isOnline,
                    last_seen: new Date().toISOString()
                })
                .eq('id', user.id)
        }

        const channelPromise = setupPresence()

        // Handle tab close/navigation
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                updateStatus(false)
            } else {
                updateStatus(true)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            channelPromise.then(channel => {
                if (channel) supabase.removeChannel(channel)
            })
            updateStatus(false)
        }
    }, [supabase])

    return null
}
