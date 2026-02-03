import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video, Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface CallOverlayProps {
    isOpen: boolean
    state: 'idle' | 'calling' | 'ringing' | 'active' | 'ended'
    type: 'voice' | 'video'
    caller?: {
        full_name: string
        photo_url: string
    }
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    onAccept: () => void
    onReject: () => void
    onEnd: () => void
}

export default function CallOverlay({
    isOpen, state, type, caller, localStream, remoteStream, onAccept, onReject, onEnd
}: CallOverlayProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const remoteAudioRef = useRef<HTMLAudioElement>(null)
    const ringtone = useRef<HTMLAudioElement | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoEnabled, setIsVideoEnabled] = useState(type === 'video')
    const [callDuration, setCallDuration] = useState(0)

    // Unlock audio on first user interaction
    useEffect(() => {
        if (typeof window === 'undefined') return

        ringtone.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3')
        ringtone.current.loop = true

        const unlock = () => {
            ringtone.current?.play().then(() => ringtone.current?.pause()).catch(() => { })
            // Also unlock the remote audio element
            if (remoteAudioRef.current) {
                remoteAudioRef.current.play().catch(() => { })
                remoteAudioRef.current.pause()
            }
            document.removeEventListener('click', unlock)
            document.removeEventListener('touchstart', unlock)
        }
        document.addEventListener('click', unlock)
        document.addEventListener('touchstart', unlock)

        return () => {
            document.removeEventListener('click', unlock)
            document.removeEventListener('touchstart', unlock)
        }
    }, [])

    // Handle local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream, state])

    // Handle remote video stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream && type === 'video') {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream, type, state])

    // Handle remote AUDIO stream - CRITICAL for voice calls!
    useEffect(() => {
        console.log('[CallOverlay] Remote stream changed:', remoteStream ? 'exists' : 'null')
        if (remoteAudioRef.current && remoteStream) {
            console.log('[CallOverlay] Attaching remote audio stream, tracks:', remoteStream.getAudioTracks().length)
            remoteAudioRef.current.srcObject = remoteStream
            remoteAudioRef.current.muted = false
            remoteAudioRef.current.volume = 1.0
            remoteAudioRef.current.play()
                .then(() => console.log('[CallOverlay] ✅ Audio playing!'))
                .catch(e => console.error('[CallOverlay] ❌ Audio play failed:', e))
        }
    }, [remoteStream])

    // Ringtone logic - ONLY play when ringing, stop immediately otherwise
    useEffect(() => {
        if (state === 'ringing' && isOpen && ringtone.current) {
            console.log('[CallOverlay] Playing ringtone')
            ringtone.current.play().catch(e => console.error('Ringtone play failed:', e))
        } else {
            // Stop ringtone for any other state
            if (ringtone.current) {
                console.log('[CallOverlay] Stopping ringtone')
                ringtone.current.pause()
                ringtone.current.currentTime = 0
            }
        }

        // Cleanup on unmount or state change
        return () => {
            if (ringtone.current) {
                ringtone.current.pause()
                ringtone.current.currentTime = 0
            }
        }
    }, [state, isOpen])

    // Call duration timer
    useEffect(() => {
        if (state === 'active') {
            setCallDuration(0)
            const interval = setInterval(() => setCallDuration(s => s + 1), 1000)
            return () => clearInterval(interval)
        }
    }, [state])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled
            })
            setIsMuted(!isMuted)
        }
    }

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled
            })
            setIsVideoEnabled(!isVideoEnabled)
        }
    }

    return (
        <>
            {/* ALWAYS render audio element - don't conditionally mount */}
            <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                style={{ display: 'none' }}
            />

            <AnimatePresence>
                {isOpen && state !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 overflow-hidden"
                    >
                        {/* Background Video (Remote) - for video calls only */}
                        {state === 'active' && type === 'video' && remoteStream && (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                            />
                        )}

                        {/* Floating Local Video - for video calls only */}
                        {state === 'active' && type === 'video' && localStream && (
                            <motion.div
                                drag
                                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                                className="absolute top-10 right-10 w-48 h-64 bg-black/40 rounded-3xl border border-white/20 overflow-hidden shadow-2xl z-50"
                            >
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                        )}

                        <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-md w-full">
                            {/* Avatar with pulsing effect */}
                            <div className="relative">
                                <AnimatePresence>
                                    {state === 'ringing' && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 0 }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-primary/30 rounded-full"
                                        />
                                    )}
                                </AnimatePresence>
                                <img
                                    src={caller?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${caller?.full_name}`}
                                    className="w-32 h-32 rounded-[3rem] border-4 border-white/10 shadow-2xl relative z-10"
                                    alt=""
                                />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-4xl font-bold tracking-tight text-white">{caller?.full_name}</h2>
                                <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
                                    {state === 'ringing' ? 'Incoming ' : state === 'calling' ? 'Calling ' : 'Active '}{type === 'voice' ? 'Voice ' : 'Video '}Call
                                </p>
                                {/* Call Timer */}
                                {state === 'active' && (
                                    <p className="text-white/60 font-mono text-lg tracking-wider mt-2">
                                        {formatDuration(callDuration)}
                                    </p>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-6 mt-12">
                                {state === 'ringing' ? (
                                    <>
                                        <button
                                            onClick={onReject}
                                            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <PhoneOff className="w-8 h-8" />
                                        </button>
                                        <button
                                            onClick={onAccept}
                                            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <Phone className="w-8 h-8" />
                                        </button>
                                    </>
                                ) : state === 'active' || state === 'calling' ? (
                                    <>
                                        <button
                                            onClick={toggleMute}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all backdrop-blur-md ${isMuted ? 'bg-red-500/50' : 'bg-white/10 hover:bg-white/20'}`}
                                        >
                                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                                        </button>
                                        <button
                                            onClick={onEnd}
                                            className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <PhoneOff className="w-8 h-8" />
                                        </button>
                                        <button
                                            onClick={toggleVideo}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all backdrop-blur-md ${!isVideoEnabled ? 'bg-red-500/50' : 'bg-white/10 hover:bg-white/20'}`}
                                        >
                                            {isVideoEnabled ? <Video className="w-6 h-6" /> : <Video className="w-6 h-6 text-red-400" />}
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {/* Glassmorphic Background Elements */}
                        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
