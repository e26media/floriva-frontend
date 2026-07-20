import type { Metadata } from 'next'
import MelbourneBouquetContent from './MelbourneBouquetContent'
import {
  CANONICAL_URL,
  OG_IMAGE,
  SEO_DESCRIPTION,
  SEO_TITLE,
  SITE_URL,
  buildJsonLd,
} from './seo'
import './melbourne-bouquet.css'

export const metadata: Metadata = {
  title: { absolute: SEO_TITLE },
  description: SEO_DESCRIPTION,
  keywords: [
    'Bouquet Delivery Melbourne',
    'Flower Bouquet Melbourne',
    'Fresh Flower Bouquets Melbourne',
    'Same Day Bouquet Delivery Melbourne',
    'Send Bouquets to Melbourne',
    'Online Bouquet Delivery Melbourne',
    'Luxury Flower Bouquets Melbourne',
    'Birthday Bouquets Melbourne',
    'Anniversary Bouquets Melbourne',
    'Rose Bouquets Melbourne',
    'Florist Melbourne',
    'Flower Delivery Melbourne',
    'Same Day Flower Delivery Melbourne',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: CANONICAL_URL,
    siteName: 'Floriva Gifts',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Bouquet Delivery Melbourne by Floriva Gifts',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [OG_IMAGE],
  },
  other: {
    'geo.region': 'AU-VIC',
    'geo.placename': 'Melbourne',
  },
  metadataBase: new URL(SITE_URL),
}

export default function BouquetDeliveryMelbournePage() {
  const jsonLd = buildJsonLd()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MelbourneBouquetContent />
    </>
  )
}
