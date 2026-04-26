'use client'
import { useState } from 'react'

interface Offer {
  id: string
  title: string
  platform: 'shopee' | 'mercadolivre' | 'aliexpress'
  current_price: number
  original_price: number
  discount_percent: number
  image_url: string
  affiliate_url: string
  rating: number
  sold_count: number
  category: string
  score?: number
  badge?: 'fire' | 'urgent' | 'new'
}

interface Props { offer: Offer; userId?: string }

const BADGE_CONFIG = {
  fire:    { label: '🔥 Oferta do dia', className: 'bg-amber-100 text-amber-800' },
  urgent:  { label: '⚡ Urgente',       className: 'bg-purple-100 text-purple-800' },
  new:     { label: '✦ Novo',           className: 'bg-green-100 text-green-700' },
}

const PLATFORM_COLORS = {
  shopee:       'text-orange-500',
  mercadolivre: 'text-yellow-600',
  aliexpress:   'text-red-500',
}

export default function OfferCard({ offer, userId }: Props) {
  const [liked, setLiked] = useState(false)
  const [buying, setBuying] = useState(false)

  const badge = offer.badge ? BADGE_CONFIG[offer.badge] : null

  async function handleBuy() {
    setBuying(true)
    const params = new URLSearchParams({ id: offer.id })
    if (userId) params.set('uid', userId)
    window.open(`/api/click?${params}`, '_blank')
    setTimeout(() => setBuying(false), 1500)
  }

  async function handleLike() {
    setLiked(prev => !prev)
    await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({ offerId: offer.id, type: liked ? 'unlike' : 'like' }),
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="relative h-48 bg-gray-50 flex items-center justify-center">
        <img src={offer.image_url} alt={offer.title} className="h-full w-full object-cover" />
        {badge && (
          <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        )}
        <span className="absolute top-2 right-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
          -{offer.discount_percent}%
        </span>
      </div>
      <div className="p-3">
        <p className={`text-xs font-medium mb-1 capitalize ${PLATFORM_COLORS[offer.platform]}`}>
          {offer.platform}
        </p>
        <h3 className="text-sm font-medium text-gray-900 leading-snug mb-2 line-clamp-2">
          {offer.title}
        </h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-gray-900">
            R${offer.current_price.toFixed(2)}
          </span>
          <span className="text-xs text-gray-400 line-through">
            R${offer.original_price.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <span>★ {offer.rating.toFixed(1)}</span>
          <span>{offer.sold_count.toLocaleString()} vendidos</span>
          {offer.score && (
            <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">
              Score {offer.score}
            </span>
          )}
        </div>
        <button
          onClick={handleBuy}
          disabled={buying}
          className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {buying ? 'Abrindo...' : 'Comprar agora'}
        </button>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleLike}
            className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${liked ? 'bg-red-50 text-red-500 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-100'}`}
          >
            {liked ? '♥ Curtido' : '♡ Curtir'}
          </button>
          <button className="flex-1 py-2 rounded-xl text-xs bg-gray-50 text-gray-500 border border-gray-100">
            ↗ Compartilhar
          </button>
        </div>
      </div>
    </div>
  )
}