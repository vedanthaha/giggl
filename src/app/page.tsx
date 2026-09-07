'use client'

import { createClient } from '@/lib/supabase/client'

import { useEffect, useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Shield, Users, Mic, ChevronRight, Lock, MessageSquare, Globe, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'
import GlowHorizonFM from '@/components/ui/glow-horizon'
import { Features } from '@/components/ui/features-8'
import FooterSection from '@/components/ui/footer'
import localFont from 'next/font/local'
import IPhoneMockup from '@/components/ui/iphone-mockup'
import MotionButton from '@/components/ui/motion-button'

const ttHoves = localFont({ src: './fonts/TTHovesPro-Medium.ttf' })
const svetze = localFont({ src: './fonts/Svetze.otf' })
const astonpoliz = localFont({ src: './fonts/Astonpoliz.otf' })

export default function LandingPage() {
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
  const fadeInRise: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
    }
  }



  const headlineContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04, delayChildren: 0.2 },
    },
  }

  const headlineChild: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", damping: 15, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 20,
      filter: "blur(8px)",
      transition: { type: "spring", damping: 15, stiffness: 100 },
    },
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
          className="flex items-center"
        >
          <img src="/Giggle%20Logo.png" alt="Giggl Logo" className="h-10 object-contain" />
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
          ) : null}
        </motion.div>
      </nav>

      {/* Hero Section */}
      <div className="relative w-full flex flex-col items-center mt-20 sm:mt-32">
        <div className="absolute inset-0 z-0 pointer-events-none h-[800px] -top-32">
          <GlowHorizonFM variant="top" />
        </div>
        <section className="relative pt-20 pb-20 px-6 w-full max-w-7xl mx-auto flex flex-col items-center z-10">
          <motion.div
            variants={fadeInRise}
            initial="hidden"
            animate="visible"
            className="text-center z-10"
          >


          <motion.h1 
            variants={headlineContainer}
            initial="hidden"
            animate="visible"
            className={`text-5xl md:text-7xl lg:text-8xl tracking-tight mb-8 leading-[1.1] text-white ${svetze.className}`}
          >
            {"Conversations elevated to an art form.".split(" ").map((word, index) => (
              <span key={index} className="inline-block mr-[0.25em]">
                {word.split("").map((letter, i) => (
                  <motion.span variants={headlineChild} key={i} className="inline-block">
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.h1>

          <p className={`text-2xl md:text-3xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed ${astonpoliz.className}`}>
            Where absolute privacy meets uncompromising elegance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-4">
            <MotionButton href="/signup" label="Enter Giggl" classes="w-56 border border-white/10 bg-[#111111]" />
            <MotionButton label="How It Works" classes="w-56 border border-white/10 bg-[#111111]" />
          </div>
        </motion.div>

        {/* iPhone Mockup Section */}
        <div className="mt-40 w-full flex flex-col lg:flex-row items-center gap-16">
          {/* Left Text */}
          <div className="flex-1 text-left space-y-8 z-10">
            <motion.h3 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`text-5xl lg:text-7xl font-bold text-white tracking-tight leading-tight ${svetze.className}`}
            >
              Privacy you can <br/> actually feel.
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className={`text-xl text-gray-400 leading-relaxed max-w-lg ${astonpoliz.className}`}
            >
              Every message is encrypted end-to-end. We don't track you, we don't sell your data, and we don't keep logs. Just you and your friends, in complete secrecy.
            </motion.p>
          </div>

          <div className="flex-1 relative perspective-[2000px] flex justify-center lg:justify-end z-20">
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotateX: [2, 0, 2],
                rotateY: [-2, 2, -2]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <IPhoneMockup 
                model="15-pro" 
                color="space-black" 
                screenBg="#0a0a0a" 
                shadow="0 50px 100px -20px rgba(0,0,0,0.8)" 
                innerShadow={true}
              >
                {/* Chat UI */}
                <div className="w-full h-full relative flex flex-col pt-12">
                  <div className="px-6 pb-4 flex items-center justify-between border-b border-white/[0.03]">
                    <img src="/Giggle%20Logo.png" alt="Giggl Logo" className="h-6 object-contain invert mix-blend-screen" />
                    <div className="w-8 h-8 rounded-full bg-white/5" />
                  </div>
                  
                  <div className="flex-1 p-5 space-y-6 flex flex-col justify-end pb-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20, scale: 0.8 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      viewport={{ once: true }}
                      className={`bg-white/5 px-4 py-3 rounded-2xl rounded-bl-none max-w-[85%] text-sm text-gray-200 ${astonpoliz.className}`}
                    >
                      Is this space actually private? 🔒
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20, scale: 0.8 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                      viewport={{ once: true }}
                      className={`bg-primary text-white px-4 py-3 rounded-2xl rounded-br-none max-w-[85%] text-sm font-bold self-end ${astonpoliz.className}`}
                    >
                      End-to-end encrypted. No logs. No trackers. Just us. ✨
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 3 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <div className={`flex-1 h-12 bg-white/5 rounded-2xl border border-white/10 px-4 flex items-center text-gray-500 text-xs italic ${astonpoliz.className}`}>
                        Type a secure message...
                      </div>
                      <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </IPhoneMockup>
            </motion.div>
            {/* Gradient Bloom behind Phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/20 blur-[120px] rounded-full -z-10" />
          </div>
        </div>
      </section>
      </div>

      {/* Features Section */}
      <Features />

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
              <h2 className={`text-5xl md:text-6xl font-normal tracking-tight leading-[0.95] ${svetze.className}`}>
                Designed for the <br />
                <span className="text-accent italic font-bold uppercase tracking-widest text-4xl">Supreme</span> <br />
                <span className="text-white">Minimalist.</span>
              </h2>
              <p className={`text-xl text-gray-400 leading-relaxed max-w-lg ${astonpoliz.className}`}>
                Giggl strips away the noise. No ads, no algorithmic feeds, no bloat. Just pure, beautiful human connection.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <Globe />, text: "Global sync with zero lag" },
                  { icon: <MessageSquare />, text: "Contextual dark mode" },
                  { icon: <Users />, text: "Custom aesthetic profiles" },
                  { icon: <Shield />, text: "Biometric app locking" }
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 text-gray-300 font-bold text-sm ${astonpoliz.className}`}>
                    <div className="text-white flex items-center justify-center">{item.icon}</div>
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
        {/* Video Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-50 grayscale"
          >
            <source src="/lonely-homer-starry-night-sky-pixel-moewalls-com.mp4" type="video/mp4" />
          </video>
          {/* Fading borders to smoothly blend with background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-transparent" />
        </div>
        
        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 flex flex-col items-center gap-12"
        >
          <h2 className={`text-6xl md:text-8xl font-black tracking-tighter text-center max-w-4xl leading-[0.9] text-gray-400 ${svetze.className}`}>
            Move your world <br />
            <span className="text-white">somewhere better.</span>
          </h2>

          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <MotionButton href="/signup" label="Enter Giggl" classes="w-64" />
            </div>
            <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">
              Available now. Private forever.
            </p>
          </div>
        </motion.div>

        {/* Background Text Shadow Removed */}
      </section>

      {/* Footer */}
      <FooterSection />

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
