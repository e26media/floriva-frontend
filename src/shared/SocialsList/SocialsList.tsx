import facebook from '@/images/socials/facebook.svg'
import telegram from '@/images/socials/telegram.svg'
import twitter from '@/images/socials/twitter.svg'
import youtube from '@/images/socials/youtube.svg'
import clsx from 'clsx'
import Image from 'next/image'
import { FC } from 'react'
import { Link } from '../link'

interface SocialsListProps {
  className?: string
  itemClass?: string
}

const socialsDemo = [
  { name: 'Facebook', icon: facebook, href: '#' },
  { name: 'Twitter', icon: twitter, href: '#' },
  { name: 'Youtube', icon: youtube, href: '#' },
  { name: 'Telegram', icon: telegram, href: '#' },
]

const SocialsList: FC<SocialsListProps> = ({ className = '', itemClass = 'w-6 h-6' }) => {
  return (
    <nav className={`flex items-center gap-x-4 gap-y-2 text-2xl text-neutral-600 dark:text-neutral-300 ${className}`}>
      {socialsDemo.map((item, i) => (
        <Link
          key={i}
          className={clsx(itemClass, 'relative block')}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          title={item.name}
        >
          <Image fill sizes="40px" src={item.icon} alt="" />
        </Link>
      ))}
    </nav>
  )
}

export default SocialsList
