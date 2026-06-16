'use client'

import facebook from '@/images/socials/facebook-mono.svg'
import instagram from '@/images/socials/instagram.svg'
import pinterest from '@/images/socials/pinterest.svg'
import tiktok from '@/images/socials/tiktok.svg'
import { fetchSiteContent, type SocialLink } from '@/lib/siteContent'
import clsx from 'clsx'
import Image from 'next/image'
import { FC, useEffect, useMemo, useState } from 'react'
import { Link } from '../link'

interface SocialsList1Props {
  className?: string
}

const ICONS: Record<SocialLink['platform'], typeof instagram> = {
  instagram,
  facebook,
  tiktok,
  pinterest,
}

const FALLBACK_SOCIALS: SocialLink[] = [
  { _id: 'fb', platform: 'facebook', label: 'Facebook', url: '#', isActive: true },
  { _id: 'ig', platform: 'instagram', label: 'Instagram', url: '#', isActive: true },
  { _id: 'tt', platform: 'tiktok', label: 'TikTok', url: '#', isActive: true },
  { _id: 'pi', platform: 'pinterest', label: 'Pinterest', url: '#', isActive: true },
]

const SocialsList1: FC<SocialsList1Props> = ({ className }) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])

  useEffect(() => {
    fetchSiteContent().then(({ socialLinks: links }) => {
      if (links.length > 0) setSocialLinks(links)
    })
  }, [])

  const items = useMemo(() => {
    if (socialLinks.length === 0) return FALLBACK_SOCIALS
    return socialLinks.filter((link) => link.url && link.url !== '#')
  }, [socialLinks])

  const displayItems = items.length > 0 ? items : FALLBACK_SOCIALS

  return (
    <nav
      className={clsx('flex items-center gap-x-4', className)}
      aria-label="Social media"
    >
      {displayItems.map((item) => {
        const icon = ICONS[item.platform]
        if (!icon) return null

        return (
          <Link
            key={item.platform}
            target="_blank"
            rel="noopener noreferrer"
            href={item.url || '#'}
            title={item.label}
            aria-label={item.label}
            className="relative block h-7 w-7 transition-opacity hover:opacity-75"
          >
            <Image fill sizes="28px" src={icon} alt="" />
          </Link>
        )
      })}
    </nav>
  )
}

export default SocialsList1
