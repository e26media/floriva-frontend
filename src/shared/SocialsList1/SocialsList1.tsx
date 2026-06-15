import facebook from '@/images/socials/facebook-mono.svg'
import instagram from '@/images/socials/instagram.svg'
import pinterest from '@/images/socials/pinterest.svg'
import tiktok from '@/images/socials/tiktok.svg'
import clsx from 'clsx'
import Image from 'next/image'
import { FC } from 'react'
import { Link } from '../link'

interface SocialsList1Props {
  className?: string
}

/** Update href values when social profile URLs are ready */
const socials = [
  { name: 'Instagram', icon: instagram, href: '#' },
  { name: 'Facebook', icon: facebook, href: '#' },
  { name: 'TikTok', icon: tiktok, href: '#' },
  { name: 'Pinterest', icon: pinterest, href: '#' },
]

const SocialsList1: FC<SocialsList1Props> = ({ className }) => {
  return (
    <nav
      className={clsx('flex items-center gap-x-4', className)}
      aria-label="Social media"
    >
      {socials.map((item) => (
        <Link
          key={item.name}
          target="_blank"
          rel="noopener noreferrer"
          href={item.href}
          title={item.name}
          aria-label={item.name}
          className="relative block h-7 w-7 text-neutral-700 transition-colors hover:text-black dark:text-neutral-300 dark:hover:text-white"
        >
          <Image fill sizes="28px" src={item.icon} alt="" />
        </Link>
      ))}
    </nav>
  )
}

export default SocialsList1
