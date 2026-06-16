'use client'

import facebook from '@/images/socials/facebook-mono.svg'
import instagram from '@/images/socials/instagram.svg'
import pinterest from '@/images/socials/pinterest.svg'
import tiktok from '@/images/socials/tiktok.svg'
import { fetchSiteContent, type SocialLink } from '@/lib/siteContent'
import clsx from 'clsx'
import Image from 'next/image'
import { FC, useEffect, useMemo, useState } from 'react'

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
  {
    _id: 'ig',
    platform: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/florivagifts?igsh=a2JwYWY5MjhpdG13',
    isActive: true,
  },
  {
    _id: 'fb',
    platform: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/share/1HJd5iiihR/',
    isActive: true,
  },
  {
    _id: 'tt',
    platform: 'tiktok',
    label: 'TikTok',
    url: 'https://www.tiktok.com/@florivagifts?_r=1&_t=ZS-97EI1dLRelw',
    isActive: true,
  },
  {
    _id: 'pi',
    platform: 'pinterest',
    label: 'Pinterest',
    url: 'https://pin.it/2tvbfQDx7',
    isActive: true,
  },
]

function activeSocialLinks(links: SocialLink[]): SocialLink[] {
  return links.filter(
    (link) => link.isActive !== false && link.url && link.url !== '#'
  )
}

const SocialsList1: FC<SocialsList1Props> = ({ className }) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(FALLBACK_SOCIALS)

  useEffect(() => {
    fetchSiteContent().then(({ socialLinks: links }) => {
      const active = activeSocialLinks(links)
      if (active.length > 0) setSocialLinks(active)
    })
  }, [])

  const displayItems = useMemo(() => {
    const active = activeSocialLinks(socialLinks)
    return active.length > 0 ? active : FALLBACK_SOCIALS
  }, [socialLinks])

  return (
    <nav
      className={clsx('flex items-center gap-x-4', className)}
      aria-label="Social media"
    >
      {displayItems.map((item) => {
        const icon = ICONS[item.platform]
        if (!icon) return null

        return (
          <a
            key={item.platform}
            target="_blank"
            rel="noopener noreferrer"
            href={item.url}
            title={item.label}
            aria-label={item.label}
            className="relative block h-7 w-7 transition-opacity hover:opacity-75"
          >
            <Image fill sizes="28px" src={icon} alt="" />
          </a>
        )
      })}
    </nav>
  )
}

export default SocialsList1
