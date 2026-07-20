'use client'

import Link from 'next/link'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
const WHATSAPP_TEXT = encodeURIComponent(
  'Hi Floriva Gifts! I would like to order bouquet delivery in Melbourne.'
)

export default function FloatingWhatsApp() {
  const href = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, '')}?text=${WHATSAPP_TEXT}`
    : `https://www.instagram.com/florivagifts`

  const label = WHATSAPP_NUMBER ? 'Chat on WhatsApp' : 'Message Floriva on Instagram'

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mlb-whatsapp"
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" width="28" height="28">
        <path
          fill="currentColor"
          d="M16.004 3C9.38 3 4 8.37 4 14.98c0 2.1.55 4.07 1.52 5.79L4 29l8.45-1.51A12 12 0 0 0 16.004 27C22.63 27 28 21.63 28 14.98 28 8.37 22.63 3 16.004 3zm6.93 17.08c-.29.82-1.7 1.55-2.37 1.65-.61.09-1.38.13-2.23-.14-.51-.16-1.17-.38-2.02-.75-3.55-1.54-5.86-5.13-6.04-5.37-.18-.24-1.45-1.93-1.45-3.68s.92-2.61 1.25-2.97c.33-.36.72-.45.96-.45h.69c.22 0 .52-.08.81.62.29.71.99 2.45 1.08 2.63.09.18.15.39.03.63-.12.24-.18.39-.36.6-.18.21-.38.47-.54.63-.18.18-.37.37-.16.73.21.36.94 1.55 2.02 2.51 1.39 1.24 2.56 1.62 2.92 1.8.36.18.57.15.78-.09.21-.24.89-1.04 1.13-1.4.24-.36.48-.3.81-.18.33.12 2.1.99 2.46 1.17.36.18.6.27.69.42.09.15.09.87-.2 1.69z"
        />
      </svg>
    </Link>
  )
}
