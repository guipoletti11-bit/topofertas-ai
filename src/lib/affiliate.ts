const AFFILIATE_CONFIG = {
  shopee: {
    param: 'sub_id',
    affiliateId: process.env.SHOPEE_AFFILIATE_ID ?? 'topofertas_001',
    commissionRate: 0.04,
    cookieDays: 7,
  },
  mercadolivre: {
    param: 'partner_id',
    affiliateId: process.env.ML_AFFILIATE_ID ?? 'TOPOF001',
    commissionRate: 0.08,
    cookieDays: 30,
  },
  aliexpress: {
    param: 'aff_fcid',
    affiliateId: process.env.ALIEXPRESS_AFFILIATE_ID ?? 'topofertas',
    commissionRate: 0.06,
    cookieDays: 3,
  },
} as const

type Platform = keyof typeof AFFILIATE_CONFIG

export function buildAffiliateUrl(
  originalUrl: string,
  platform: Platform,
  source = 'feed'
): string {
  try {
    const url = new URL(originalUrl)
    const cfg = AFFILIATE_CONFIG[platform]
    url.searchParams.set(cfg.param, cfg.affiliateId)
    url.searchParams.set('utm_source', 'topofertas')
    url.searchParams.set('utm_medium', source)
    url.searchParams.set('utm_campaign', platform)
    return url.toString()
  } catch {
    const sep = originalUrl.includes('?') ? '&' : '?'
    const cfg = AFFILIATE_CONFIG[platform]
    return `${originalUrl}${sep}${cfg.param}=${cfg.affiliateId}&utm_source=topofertas`
  }
}

export function ensureAffiliateUrl(offer: {
  affiliate_url: string
  platform: string
}): string {
  const platform = offer.platform as Platform
  if (!AFFILIATE_CONFIG[platform]) return offer.affiliate_url
  const cfg = AFFILIATE_CONFIG[platform]
  const hasAffiliate = offer.affiliate_url.includes(cfg.affiliateId)
  if (hasAffiliate) return offer.affiliate_url
  return buildAffiliateUrl(offer.affiliate_url, platform)
}

export function estimateRevenue(price: number, platform: Platform): number {
  const rate = AFFILIATE_CONFIG[platform]?.commissionRate ?? 0.04
  return Math.round(price * rate * 100) / 100
}