'use client'
import { useEffect, useRef, useState } from 'react'
import OfferCard from '@/components/feed/OfferCard'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = ['Tudo', 'Eletrônicos', 'Moda', 'Casa', 'Esporte', 'Beleza']
const PAGE_SIZE = 10

export default function FeedPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [category, setCategory] = useState('Tudo')
  const loaderRef = useRef<HTMLDivElement>(null)

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)

    let query = supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (category !== 'Tudo') {
      query = query.eq('category', category.toLowerCase())
    }

    const { data } = await query
    if (!data || data.length < PAGE_SIZE) setHasMore(false)
    setOffers(prev => [...prev, ...(data ?? [])])
    setPage(prev => prev + 1)
    setLoading(false)
  }

  useEffect(() => {
    setOffers([])
    setPage(0)
    setHasMore(true)
  }, [category])

  useEffect(() => { loadMore() }, [category])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [loading, hasMore, page])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="font-bold text-lg tracking-tight">TopOfertas AI</h1>
          <div className="w-8 h-8 rounded-full bg-gray-200" />
        </div>
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors
                ${category === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
        {offers.map(offer => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
        <div ref={loaderRef} className="py-4 text-center text-sm text-gray-400">
          {loading ? 'Carregando mais ofertas...' : hasMore ? '' : 'Você viu tudo por hoje!'}
        </div>
      </main>
    </div>
  )
}