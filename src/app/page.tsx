'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, Mic, ChevronRight, Lock, MessageSquare, Globe, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setIsLoggedIn(true)
    }
    checkUser()
  }, [supabase])

  // Animation Variants
  const fadeInRise = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as any }
    }
  }

  const driftBackground = {
    animate: {
      backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }
    }
  }

  const softGlow = {
    animate: {
      boxShadow: [
        "0 0 0px rgba(var(--primary-rgb), 0)",
        "0 0 20px rgba(var(--primary-rgb), 0.3)",
        "0 0 0px rgba(var(--primary-rgb), 0)"
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as any
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="fixed inset-0 pointer-events-none"
      >
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full" />
      </motion.div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex items-center justify-between backdrop-blur-xl border-b border-white/[0.03]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-3xl font-normal tracking-tight font-brand">Giggl</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          {isLoggedIn ? (
            <Link href="/chats" className="text-sm font-bold bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-full border border-white/10 transition-all">
              Open App
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-bold bg-primary px-6 py-2.5 rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-all">
                Get Started
              </Link>
            </>
          )}
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center">
        <motion.div
          variants={fadeInRise}
          initial="hidden"
          animate="visible"
          className="text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-[11px] font-black tracking-[0.2em] uppercase bg-white/[0.03] border border-white/10 rounded-full text-gray-300"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            Next-Gen Private Messaging
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Conversations deserve <br />
            <span className="italic">their own</span> <span className="text-primary italic">universe.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Giggl isn&apos;t just a chat app. It&apos;s a high-fidelity sanctuary for your private world. Encryption by default, intimacy by design.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <motion.div variants={softGlow} animate="animate" className="relative group">
              <div className="button-glow-orb opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <Link href="/signup" className="glass-glow-button !py-5 !px-12 text-xl rounded-full flex items-center gap-3 font-black tracking-tight group-hover:border-white/20">
                Enter Giggl
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <button className="glass-glow-button px-12 py-5 rounded-full bg-white/[0.01] hover:bg-white/[0.03] transition-all font-black uppercase text-sm tracking-widest border-white/5">
              How It Works
            </button>
          </div>
        </motion.div>

        {/* iPhone Mockup Section */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-32 relative perspective-[2000px]"
        >
          {/* iPhone 15 Pro Mockup */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotateX: [2, 0, 2],
              rotateY: [-2, 2, -2]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-20 w-[320px] h-[650px] md:w-[380px] md:h-[780px] bg-[#000] rounded-[55px] border-[12px] border-[#1a1a1a] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/20 overflow-hidden"
          >
            {/* Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-4">
              <div className="w-2 h-2 rounded-full bg-blue-500/20" />
              <div className="w-1 h-1 rounded-full bg-white/10" />
            </div>

            {/* Screen Content (The App) */}
            <div className="w-full h-full bg-[#121212] relative flex flex-col">
              {/* App Header */}
              <div className="pt-14 px-6 pb-4 flex items-center justify-between border-b border-white/[0.03]">
                <span className="font-normal text-2xl tracking-tight font-brand">Giggl</span>
                <div className="w-8 h-8 rounded-full bg-white/5" />
              </div>

              {/* App Messages */}
              <div className="flex-1 p-6 space-y-6 flex flex-col justify-end">
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 2, duration: 0.5 }}
                  className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-none max-w-[85%] text-sm"
                >
                  Is this space actually private? 🔒
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 3, duration: 0.5 }}
                  className="bg-primary px-4 py-3 rounded-2xl rounded-br-none max-w-[85%] text-sm font-bold self-end"
                >
                  End-to-end encrypted. No logs. No trackers. Just us. ✨
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4 }}
                  className="flex items-center gap-2 mt-4"
                >
                  <div className="flex-1 h-12 bg-white/5 rounded-2xl border border-white/10 px-4 flex items-center text-gray-500 text-xs italic">
                    Type a secure message...
                  </div>
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full" />
            </div>
          </motion.div>

          {/* Gradient Bloom behind Phone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/20 blur-[120px] rounded-full -z-10" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-40 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Lock className="w-8 h-8 text-primary" />,
              title: "Stealth Protocol",
              desc: "Zero metadata retention. Your conversations leave no digital footprint."
            },
            {
              icon: <Users className="w-8 h-8 text-accent" />,
              title: "Infinite Circles",
              desc: "Create hidden enclaves for your tightest groups. Invitation only, always."
            },
            {
              icon: <Mic className="w-8 h-8 text-primary" />,
              title: "Raw Fidelity",
              desc: "Lossless audio and high-bitrate media sharing, completely secured."
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              whileHover={{ y: -10 }}
              className="glass-card p-12 rounded-[40px] border border-white/[0.05] bg-white/[0.01] flex flex-col group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-8 p-5 rounded-2xl bg-white/[0.05] w-fit group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-3xl font-black mb-4 tracking-tighter">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* App Preview / Aesthetic Section */}
      <section className="py-40 relative bg-white/[0.01] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-8"
            >
              <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.95]">
                Designed for the <br />
                <span className="text-accent italic uppercase tracking-widest text-4xl">Supreme</span> <br />
                <span className="text-white">Minimalist.</span>
              </h2>
              <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                Giggl strips away the noise. No ads, no algorithmic feeds, no bloat. Just pure, beautiful human connection.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <Globe />, text: "Global sync with zero lag" },
                  { icon: <MessageSquare />, text: "Contextual dark mode" },
                  { icon: <Users />, text: "Custom aesthetic profiles" },
                  { icon: <Shield />, text: "Biometric app locking" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300 font-bold text-sm">
                    <div className="text-primary h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">{item.icon}</div>
                    {item.text}
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="flex-1 relative">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                <div className="h-[500px] w-full max-w-[400px] bg-gradient-to-br from-[#1a1a1a] to-black rounded-[48px] border border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)] p-8 flex flex-col">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent" />
                    <div className="space-y-2">
                      <div className="w-32 h-3 bg-white/10 rounded-full" />
                      <div className="w-20 h-2 bg-white/5 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="w-full h-12 bg-white/5 rounded-2xl" />
                    <div className="w-full h-12 bg-white/5 rounded-2xl" />
                    <div className="w-2/3 h-12 bg-primary/20 rounded-2xl border border-primary/30" />
                  </div>
                  <div className="mt-auto h-16 w-full bg-white/[0.03] rounded-3xl border border-white/5 flex items-center justify-around px-8">
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                    <div className="w-8 h-8 rounded-full bg-white/5" />
                    <div className="w-8 h-8 rounded-full bg-white/5" />
                  </div>
                </div>
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/10 blur-[100px] rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-60 px-6 text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 space-y-12"
        >
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
            Move your world <br />
            <span className="text-primary underline decoration-white/10 underline-offset-[20px]">somewhere better.</span>
          </h2>

          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="button-glow-orb opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <Link href="/signup" className="glass-glow-button !py-6 !px-20 text-2xl rounded-full shadow-2xl shadow-primary/10 transform hover:scale-105 active:scale-95 transition-all flex items-center gap-3 font-black tracking-tighter">
                Enter Giggl
                <Sparkles className="w-6 h-6 text-primary" />
              </Link>
            </div>
            <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">
              Available now. Private forever.
            </p>
          </div>
        </motion.div>

        {/* Background Text Shadow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30vw] font-black text-white/[0.01] pointer-events-none whitespace-nowrap select-none">
          PRIVACY PRIVACY PRIVACY
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/[0.03] bg-black/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-2xl font-normal tracking-tight uppercase font-brand">Giggl</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Redefining digital intimacy since 2026.</p>
          </div>

          <div className="flex gap-12">
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Security</h4>
              <ul className="text-sm text-gray-500 space-y-2 font-medium">
                <li className="hover:text-primary transition-colors cursor-pointer">Protocol</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Audits</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Zero Knowledge</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Legal</h4>
              <ul className="text-sm text-gray-500 space-y-2 font-medium">
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Transparency</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-20 text-center text-[10px] font-bold tracking-[0.3em] uppercase text-gray-600">
          &copy; Giggl Private Communications Systems
        </div>
      </footer>

      <style jsx>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                }
                :root {
                    --primary-rgb: 236, 72, 153; /* Adjust to match your primary color hex */
                }
            `}</style>
    </div>
  )
}
