'use client'

import promoImg from '@/images/floriva/banner/4.png'
import {
  fetchSiteContent,
  getSiteImageByKey,
  resolveImageHref,
  resolveMediaUrl,
} from '@/lib/siteContent'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

export interface SectionPromo2Props {
  className?: string
}

function buildAllProductHref(pathname: string): string {
  const countryMatch = pathname.match(/^(\/country\/[^/]+)/)
  if (countryMatch) {
    return `${countryMatch[1]}/allproduct`
  }
  return '/allproduct'
}

const SectionPromo2: FC<SectionPromo2Props> = ({ className }) => {
  const pathname = usePathname()
  const allProductHref = buildAllProductHref(pathname ?? '/')
  const [promoSrc, setPromoSrc] = useState<string | typeof promoImg>(promoImg)
  const [promoHref, setPromoHref] = useState(allProductHref)
  const [promoAlt, setPromoAlt] = useState('Premium flower delivery across Australia')
  const [promoTitle, setPromoTitle] = useState<string | undefined>()

  useEffect(() => {
    setPromoHref(allProductHref)
  }, [allProductHref])

  useEffect(() => {
    fetchSiteContent().then(({ siteImages }) => {
      const promo = getSiteImageByKey(siteImages, 'promo_2')
      if (promo?.imageUrl) {
        setPromoSrc(resolveMediaUrl(promo.imageUrl))
        setPromoHref(resolveImageHref(promo.linkUrl, allProductHref))
        if (promo.imageAlt?.trim()) setPromoAlt(promo.imageAlt.trim())
        if (promo.imageTitle?.trim()) setPromoTitle(promo.imageTitle.trim())
      }
    })
  }, [allProductHref])

  const promoIsRemote = typeof promoSrc === 'string'

  return (
    <div className={clsx(className, 'flex justify-center')}>
      <Link
        href={promoHref}
        className="inline-block overflow-hidden rounded-2xl"
        aria-label={promoAlt}
        title={promoTitle}
      >
        {promoIsRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={promoSrc}
            alt={promoAlt}
            title={promoTitle}
            className="block h-auto w-auto max-w-full"
            style={{ maxWidth: '1024px' }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Image
            alt={promoAlt}
            title={promoTitle}
            src={promoSrc}
            width={1024}
            height={1024}
            unoptimized
            className="block h-auto w-auto max-w-full"
            style={{ maxWidth: '1024px' }}
          />
        )}
      </Link>
    </div>
  )
}

export default SectionPromo2
