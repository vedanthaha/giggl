'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, TrendingUp, Grid3X3, Sparkles, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface GifStickerPanelProps {
    initialTab?: 'gif' | 'sticker'
    onSelect: (type: 'gif' | 'sticker', url: string) => void
    onClose: () => void
}

export default function GifStickerPanel({ initialTab = 'gif', onSelect, onClose }: GifStickerPanelProps) {
    const [activeTab, setActiveTab] = useState<'gif' | 'sticker' | 'upload'>(initialTab)
    const [searchQuery, setSearchQuery] = useState('')
    const [gifs, setGifs] = useState<any[]>([])
    const [stickers, setStickers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Tenor Public Demo Key
    const TENOR_API_KEY = 'LIVETENOR'

    useEffect(() => {
        if (activeTab === 'gif') {
            fetchGifs()
        } else if (activeTab === 'sticker') {
            fetchStickers()
        }
    }, [activeTab, searchQuery])

    const fetchGifs = async () => {
        setLoading(true)
        try {
            const endpoint = searchQuery
                ? `https://tenor.googleapis.com/v2/search?q=${searchQuery}&key=${TENOR_API_KEY}&client_key=giggl_app&limit=20`
                : `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&client_key=giggl_app&limit=20`

            const res = await fetch(endpoint)
            const data = await res.json()

            if (data.results && data.results.length > 0) {
                // Map Tenor results to common format
                const formattedGifs = data.results.map((r: any) => ({
                    id: r.id,
                    url: r.media_formats.tinygif.url
                }))
                setGifs(formattedGifs)
            } else {
                setGifs([])
            }
        } catch (err) {
            console.error('GIF fetch error:', err)
            setGifs([])
        }
        setLoading(false)
    }

    const fetchStickers = async () => {
        setLoading(true)
        try {
            // Fetch stickers from Supabase
            const { data } = await supabase.from('stickers').select('*').order('created_at', { ascending: false })
            setStickers(data || [])
        } catch (err) {
            console.error('Sticker fetch error:', err)
        }
        setLoading(false)
    }

    const handleUploadSticker = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const filePath = `stickers/${user.id}/${Date.now()}_${file.name}`
        const { data, error } = await supabase.storage.from('chat-images').upload(filePath, file)

        if (error) return console.error('Sticker upload error:', error)

        const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath)

        // Add to stickers table
        const { error: dbError } = await supabase.from('stickers').insert({
            url: publicUrl,
            creator_id: user.id
        })

        if (!dbError) {
            setActiveTab('sticker')
            fetchStickers()
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-24 right-0 w-[350px] h-[450px] bg-[#1e1e26]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl flex flex-col z-[100] overflow-hidden"
        >
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('gif')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${activeTab === 'gif' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        GIFs
                    </button>
                    <button
                        onClick={() => setActiveTab('sticker')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${activeTab === 'sticker' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        Stickers
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${activeTab === 'upload' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        +
                    </button>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'gif' ? 'GIFs' : 'Stickers'}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-primary/50 transition-all text-white placeholder:text-gray-600"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
                {activeTab === 'upload' ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/[0.03] border border-dashed border-white/20 rounded-2xl flex items-center justify-center">
                            <Upload className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Create personal stickers</h4>
                            <p className="text-[10px] text-gray-400 mt-1">Upload transparent PNG or WebP files for best result.</p>
                        </div>
                        <label className="bg-primary hover:bg-accent text-white py-2 px-6 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-primary/20">
                            Choose Files
                            <input type="file" className="hidden" accept="image/*" onChange={handleUploadSticker} />
                        </label>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {loading && gifs.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-video bg-white/[0.03] rounded-xl animate-pulse" />
                        ))}

                        {activeTab === 'gif' && gifs.map((gif) => (
                            <img
                                key={gif.id}
                                src={gif.url}
                                alt=""
                                className="w-full rounded-xl cursor-pointer hover:scale-[1.02] transition-all hover:ring-2 ring-primary"
                                onClick={() => onSelect('gif', gif.url)}
                            />
                        ))}

                        {activeTab === 'sticker' && stickers.map((sticker) => (
                            <img
                                key={sticker.id}
                                src={sticker.url}
                                alt=""
                                className="w-full aspect-square object-contain cursor-pointer hover:scale-[1.02] transition-all hover:ring-2 ring-primary"
                                onClick={() => onSelect('sticker', sticker.url)}
                            />
                        ))}

                        {activeTab === 'sticker' && stickers.length === 0 && !loading && (
                            <div className="col-span-2 text-center py-10 opacity-30">
                                <Sparkles className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-[10px] uppercase tracking-widest font-bold">No stickers yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
