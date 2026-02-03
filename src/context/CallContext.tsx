'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWebRTC } from '@/hooks/useWebRTC'
import { createClient } from '@/lib/supabase/client'
import CallOverlay from '@/components/CallOverlay'

interface CallContextType {
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    callState: 'idle' | 'calling' | 'ringing' | 'active' | 'ended'
    activeCall: any
    callerProfile: any
    startCall: (receiverId: string, type: 'voice' | 'video') => Promise<void>
    answerCall: (call: any) => Promise<void>
    endCall: () => Promise<void>
}

const CallContext = createContext<CallContextType | null>(null)

export function CallProvider({ children }: { children: React.ReactNode }) {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [callerProfile, setCallerProfile] = useState<any>(null)
    const supabase = createClient()

    const rtc = useWebRTC(currentUserId)

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id || null)
        }
        fetchUser()
    }, [supabase])

    // Automatically fetch profile for incoming/outgoing party
    useEffect(() => {
        if (!rtc.activeCall) {
            setCallerProfile(null)
            return
        }

        const targetId = rtc.activeCall.caller_id === currentUserId
            ? rtc.activeCall.receiver_id
            : rtc.activeCall.caller_id

        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, photo_url, id, username')
                .eq('id', targetId)
                .single()
            setCallerProfile(data)
        }
        fetchProfile()
    }, [rtc.activeCall, currentUserId, supabase])

    return (
        <CallContext.Provider value={{ ...rtc, callerProfile }}>
            {children}
            <CallOverlay
                isOpen={rtc.callState !== 'idle'}
                state={rtc.callState}
                type={rtc.activeCall?.type || 'voice'}
                caller={callerProfile}
                localStream={rtc.localStream}
                remoteStream={rtc.remoteStream}
                onAccept={() => rtc.answerCall(rtc.activeCall)}
                onReject={rtc.endCall}
                onEnd={rtc.endCall}
            />
        </CallContext.Provider>
    )
}

export function useCalls() {
    const context = useContext(CallContext)
    if (!context) throw new Error('useCalls must be used within CallProvider')
    return context
}
