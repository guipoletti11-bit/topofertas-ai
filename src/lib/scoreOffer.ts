 
// ============================================================
// TopOfertas AI — Sistema de Score de Ofertas
// Arquivo: src/lib/scoreOffer.ts
// ============================================================

export interface Offer {
  id: string
  title: string
  platform: 'shopee' | 'mercadolivre' | 'aliexpress'
  currentPrice: number
  originalPrice: number
  discountPercent: number
  historicalMin: number
  historicalMax: number
  historicalAvg: number
  daysAtOriginalPrice: number
  rating: number
  reviewCount: number
  soldLast30Days: number
  daysInCatalog: number
}

export interface OfferScore {
  score: number
  finalScore: number
  isFakePromo: boolean
  tier: 'top' | 'good' | 'moderate' | 'low'
  label: string
  publishable: boolean
  components: {
    sDisc: number
    sHist: number
    sRate: number
    sReviews: number
    sSales: number
    sMat: number
  }
  flags: string[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function detectFakePromo(offer: Offer): { isFake: boolean; reasons: string[] } {
  const reasons: string[] = []

  if (offer.discountPercent > 50 && offer.historicalAvg > 0 && offer.currentPrice > offer.historicalAvg * 0.9) {
    reasons.push('Desconto alto mas preço acima da média histórica')
  }

  if (offer.daysInCatalog < 15 && offer.discountPercent > 40) {
    reasons.push('Produto novo com desconto suspeito — sem histórico')
  }

  if (offer.currentPrice <= offer.historicalMin && offer.discountPercent > 30 && offer.daysAtOriginalPrice < 7) {
    reasons.push('Preço original praticado por menos de 7 dias')
  }

  if (offer.rating === 5.0 && offer.reviewCount < 20) {
    reasons.push('Rating 5.0 com menos de 20 avaliações — suspeito')
  }

  if (offer.discountPercent > 90) {
    reasons.push('Desconto acima de 90% — verificar')
  }

  return { isFake: reasons.length > 0, reasons }
}

export function scoreOffer(offer: Offer): OfferScore {
  const flags: string[] = []

  let sDisc = 0
  if (offer.discountPercent >= 10) {
    sDisc = clamp((offer.discountPercent / 70) * 100, 0, 100)
  }

  let sHist = 0
  if (offer.historicalMin > 0 && offer.currentPrice <= offer.historicalMin) {
    sHist = 100
    flags.push('Menor preço histórico')
  } else if (offer.historicalMax > 0) {
    sHist = clamp(((offer.historicalMax - offer.currentPrice) / offer.historicalMax) * 100, 0, 100)
  }

  let sRate = 0
  if (offer.rating >= 4.5)      sRate = 100
  else if (offer.rating >= 4.0) sRate = 75
  else if (offer.rating >= 3.5) sRate = 45
  else if (offer.rating >= 3.0) sRate = 20
  else                          sRate = 0

  if (offer.rating >= 4.5 && offer.reviewCount >= 500) {
    flags.push('Alta reputação verificada')
  }

  const sReviews = clamp((offer.reviewCount / 2000) * 100, 0, 100)

  if (offer.reviewCount < 50) {
    flags.push('Poucas avaliações')
  }

  const sSales = clamp((offer.soldLast30Days / 5