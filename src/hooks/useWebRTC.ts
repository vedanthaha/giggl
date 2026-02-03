import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // IMPORTANT: For production calls cross-network (NAT/Firewalls), 
        // you should add a TURN server here (e.g. from Metered.ca or Twilio)
        /*
        {
            urls: 'turn:YOUR_TURN_DOMAIN:3478',
            username: 'YOUR_USERNAME',
            credential: 'YOUR_PASSWORD'
        }
        */
    ],
    iceCandidatePoolSize: 10,
}

export function useWebRTC(currentUserId: string | null) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'active' | 'ended'>('idle')
    const [activeCall, setActiveCall] = useState<any>(null)

    const pc = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const activeCallRef = useRef<any>(null) // Use ref for immediate access in callbacks
    const iceQueue = useRef<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        console.log('[useWebRTC] Auth status:', currentUserId ? `Authenticated (${currentUserId})` : 'Anonymous (Waiting for auth...)')
    }, [currentUserId])

    // Keep ref in sync with state
    useEffect(() => {
        activeCallRef.current = activeCall
    }, [activeCall])

    useEffect(() => {
        localStreamRef.current = localStream
    }, [localStream])

    const cleanup = useCallback(() => {
        console.log('[useWebRTC] Cleaning up...')
        pc.current?.close()
        pc.current = null
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        setLocalStream(null)
        setRemoteStream(null)
        setCallState('idle')
        setActiveCall(null)
        activeCallRef.current = null
        iceQueue.current = []
    }, [])

    const processIceQueue = useCallback(async () => {
        if (!pc.current || !pc.current.remoteDescription) return
        console.log(`[useWebRTC] Processing ${iceQueue.current.length} queued ICE candidates`)
        while (iceQueue.current.length > 0) {
            const cand = iceQueue.current.shift()
            try {
                await pc.current.addIceCandidate(new RTCIceCandidate(cand))
            } catch (e) {
                console.error('[useWebRTC] Error adding queued ICE:', e)
            }
        }
    }, [])

    const createPeerConnection = useCallback((callId: string) => {
        console.log('[useWebRTC] Creating PeerConnection...')
        const peerConnection = new RTCPeerConnection(ICE_SERVERS)

        peerConnection.ontrack = (event) => {
            console.log('[useWebRTC] ✅ Received remote track!', {
                kind: event.track.kind,
                trackId: event.track.id,
                streamCount: event.streams.length,
                enabled: event.track.enabled
            })

            // Use the stream from event, or create one from the track
            let remoteStream = event.streams[0]
            if (!remoteStream) {
                console.log('[useWebRTC] No stream in event, creating from track')
                remoteStream = new MediaStream([event.track])
            }

            // Force a new MediaStream object to trigger state updates in components
            setRemoteStream(new MediaStream(remoteStream.getTracks()))

            // Debug: log all senders to verify we're sending tracks
            console.log('[useWebRTC] Current senders:', peerConnection.getSenders().map(s => ({
                kind: s.track?.kind,
                enabled: s.track?.enabled,
                id: s.track?.id
            })))
        }

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                console.log('[useWebRTC] Sending ICE candidate')
                await supabase.from('ice_candidates').insert({
                    call_id: callId,
                    sender_id: currentUserId,
                    candidate: event.candidate.toJSON()
                })
            }
        }

        peerConnection.oniceconnectionstatechange = () => {
            const state = peerConnection.iceConnectionState
            console.log('[useWebRTC] 🧊 ICE connection state changed:', state)

            if (state === 'failed') {
                console.error('[useWebRTC] ❌ ICE Connection Failed. If you are on different networks, you likely need a TURN server.')
            }

            if (state === 'disconnected' || state === 'failed') {
                cleanup()
            }
        }

        pc.current = peerConnection
        return peerConnection
    }, [currentUserId, supabase, cleanup])

    const startCall = async (receiverId: string, type: 'voice' | 'video') => {
        if (!currentUserId) {
            console.error('[useWebRTC] ❌ Cannot start call: User is not authenticated. Check your Supabase session in production!')
            return
        }
        console.log(`[useWebRTC] Starting ${type} call...`)

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: type === 'video'
            })
            setLocalStream(stream)
            localStreamRef.current = stream
            setCallState('calling')

            // Insert call first to get ID
            const { data: call, error } = await supabase.from('calls').insert({
                caller_id: currentUserId,
                receiver_id: receiverId,
                type,
                state: 'calling',
                offer: null
            }).select().single()

            if (error) throw error

            // Create PC with call ID
            const peerConnection = createPeerConnection(call.id)
            console.log('[useWebRTC] 📤 CALLER adding tracks:', stream.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled })))
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))

            // Create and set offer
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)

            // Update call with offer
            await supabase.from('calls').update({
                offer: { type: offer.type, sdp: offer.sdp }
            }).eq('id', call.id)

            setActiveCall(call)
            activeCallRef.current = call
            console.log('[useWebRTC] Call started, waiting for answer...')

        } catch (err) {
            console.error('[useWebRTC] Start failed:', err)
            cleanup()
        }
    }

    const answerCall = async (call: any) => {
        if (!call?.id) {
            console.error('[useWebRTC] Cannot answer: no call id')
            return
        }
        console.log('[useWebRTC] Answering call...')

        try {
            // Fetch fresh call data to ensure we have the offer
            let freshCall = call
            let retries = 0
            while (!freshCall.offer && retries < 10) {
                console.log('[useWebRTC] Waiting for offer...', retries)
                await new Promise(r => setTimeout(r, 300))
                const { data } = await supabase.from('calls').select('*').eq('id', call.id).single()
                if (data) freshCall = data
                retries++
            }

            if (!freshCall.offer) {
                console.error('[useWebRTC] Offer still missing after retries')
                return
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: freshCall.type === 'video'
            })
            setLocalStream(stream)
            localStreamRef.current = stream

            // Create PC
            const peerConnection = createPeerConnection(freshCall.id)
            console.log('[useWebRTC] 📥 RECEIVER adding tracks:', stream.getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled })))
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))

            // Set remote description (offer)
            await peerConnection.setRemoteDescription(new RTCSessionDescription(freshCall.offer))

            // Process any queued ICE candidates
            await processIceQueue()

            // Create and set answer
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)

            // Update DB
            await supabase.from('calls').update({
                answer: { type: answer.type, sdp: answer.sdp },
                state: 'active'
            }).eq('id', freshCall.id)

            setActiveCall(freshCall)
            activeCallRef.current = freshCall
            setCallState('active')
            console.log('[useWebRTC] Call answered!')

        } catch (err) {
            console.error('[useWebRTC] Answer failed:', err)
            cleanup()
        }
    }

    const endCall = async () => {
        console.log('[useWebRTC] Ending call...')
        if (activeCallRef.current) {
            await supabase.from('calls').update({ state: 'ended' }).eq('id', activeCallRef.current.id)
        }
        cleanup()
    }

    // Signaling subscription
    useEffect(() => {
        if (!currentUserId) return

        console.log('[useWebRTC] Setting up signaling...')
        const channel = supabase.channel(`webrtc:${currentUserId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'calls',
                filter: `receiver_id=eq.${currentUserId}`
            }, async (payload) => {
                const call = payload.new as any

                if (payload.eventType === 'INSERT' && call.state === 'calling' && call.caller_id !== currentUserId) {
                    console.log('[useWebRTC] Incoming call!')
                    setActiveCall(call)
                    activeCallRef.current = call
                    setCallState('ringing')
                }

                if (payload.eventType === 'UPDATE' && call.state === 'ended') {
                    cleanup()
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'calls',
                filter: `caller_id=eq.${currentUserId}`
            }, async (payload) => {
                const call = payload.new as any

                // Only process if it's for our active call
                if (!activeCallRef.current || call.id !== activeCallRef.current.id) return

                if (call.state === 'active' && call.answer && pc.current) {
                    if (pc.current.signalingState === 'have-local-offer') {
                        console.log('[useWebRTC] Got answer, setting remote description...')
                        await pc.current.setRemoteDescription(new RTCSessionDescription(call.answer))
                        await processIceQueue()
                        setCallState('active')
                    }
                }

                if (call.state === 'ended') {
                    cleanup()
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'ice_candidates'
            }, async (payload) => {
                const candidate = payload.new as any

                // Skip our own candidates
                if (candidate.sender_id === currentUserId) return

                // Use ref for immediate value check
                const currentCall = activeCallRef.current
                if (!currentCall || candidate.call_id !== currentCall.id) return

                console.log('[useWebRTC] Received ICE candidate')

                if (pc.current && pc.current.remoteDescription) {
                    try {
                        await pc.current.addIceCandidate(new RTCIceCandidate(candidate.candidate))
                    } catch (e) {
                        console.error('[useWebRTC] ICE error:', e)
                    }
                } else {
                    console.log('[useWebRTC] Queuing ICE candidate')
                    iceQueue.current.push(candidate.candidate)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentUserId, supabase, cleanup, processIceQueue])

    return {
        localStream,
        remoteStream,
        callState,
        activeCall,
        startCall,
        answerCall,
        endCall,
        setCallState
    }
}
