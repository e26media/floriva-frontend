'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LINKS } from './seo'

export default function StickyCtaBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 520)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`mlb-sticky-cta${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <div className="mlb-sticky-inner">
        <p className="mlb-sticky-copy">
          <strong>Same-day bouquet delivery</strong>
          <span> across Melbourne on eligible orders</span>
        </p>
        <div className="mlb-sticky-actions">
          <Link href={LINKS.bouquets} className="mlb-btn mlb-btn-primary mlb-btn-sm">
            Shop Now
          </Link>
          <Link href={LINKS.bestSellers} className="mlb-btn mlb-btn-ghost mlb-btn-sm">
            Best Sellers
          </Link>
        </div>
      </div>
    </div>
  )
}
