export const SITE_URL = 'https://florivagifts.com'
export const PAGE_PATH = '/australia/melbourne/bouquet-delivery'
export const CANONICAL_URL = `${SITE_URL}${PAGE_PATH}`

export const SEO_TITLE = 'Bouquet Delivery Melbourne | Same Day Flowers | Floriva'
export const SEO_DESCRIPTION =
  'Order premium handcrafted bouquet delivery across Melbourne with same-day options. Fresh flowers for birthdays, anniversaries & more from Floriva Gifts.'

export const OG_IMAGE = `${SITE_URL}/images/promo-australia.png`

/** Australia shop collection IDs */
export const LINKS = {
  australiaHome: '/country/australia',
  allProducts: '/country/australia/allproduct',
  bouquets: '/country/australia/category/6a018b153e000642ccb4d031',
  arrangements: '/country/australia/category/6a018a2b3e000642ccb4cfeb',
  birthday: '/country/australia/category/6a018ade3e000642ccb4d016',
  anniversary: '/country/australia/category/6a018ade3e000642ccb4d017',
  romance: '/country/australia/category/6a018ade3e000642ccb4d018',
  congratulations: '/country/australia/category/6a018ade3e000642ccb4d019',
  roses: '/country/australia/category/6a018a383e000642ccb4cffb',
  redRoses: '/country/australia/category/6a018b3e3e000642ccb4d050',
  luxuryRoses: '/country/australia/category/6a018b3e3e000642ccb4d052',
  mixedFlowers: '/country/australia/category/6a018b873e000642ccb4d079',
  occasionFlowers: '/country/australia/category/6a018a253e000642ccb4cfe8',
  customBouquets: '/country/australia/category/6a018ba43e000642ccb4d0a7',
  bestSellers: '/country/australia/category/6a018c223e000642ccb4d1db',
  giftHampers: '/country/australia/allproduct',
  cakeDelivery: '/country/australia/allproduct',
  contact: '/contact',
} as const

export const CATEGORIES = [
  {
    name: 'Birthday Bouquets',
    href: LINKS.birthday,
    description: 'Bright, celebratory arrangements made for Melbourne birthday surprises.',
    image:
      'https://images.unsplash.com/photo-1561181286-d3fee7f453a1?auto=format&fit=crop&w=800&q=80',
    alt: 'Colourful birthday flower bouquet ready for Melbourne delivery',
  },
  {
    name: 'Anniversary Bouquets',
    href: LINKS.anniversary,
    description: 'Elegant blooms for milestone moments across Melbourne suburbs.',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    alt: 'Romantic anniversary bouquet with soft pink roses',
  },
  {
    name: 'Romantic Bouquets',
    href: LINKS.romance,
    description: 'Thoughtful romantic florals for date nights and heartfelt gestures.',
    image:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
    alt: 'Romantic red and blush flower bouquet for Melbourne gifting',
  },
  {
    name: 'Rose Bouquets',
    href: LINKS.roses,
    description: 'Classic rose collections in red, pink, and luxury finishes.',
    image:
      'https://images.unsplash.com/photo-1455659817273-f9680774153e?auto=format&fit=crop&w=800&q=80',
    alt: 'Premium red rose bouquet for flower delivery in Melbourne',
  },
  {
    name: 'Native Australian Flowers',
    href: LINKS.mixedFlowers,
    description: 'Textural native-inspired mixes with local character and colour.',
    image:
      'https://images.unsplash.com/photo-1468327768560-75b630c8f959?auto=format&fit=crop&w=800&q=80',
    alt: 'Native Australian flower arrangement with warm earthy tones',
  },
  {
    name: 'Luxury Bouquets',
    href: LINKS.luxuryRoses,
    description: 'Statement designs for premium gifting and special celebrations.',
    image:
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=800&q=80',
    alt: 'Luxury handcrafted flower bouquet with premium wrapping',
  },
  {
    name: 'Sympathy Bouquets',
    href: LINKS.occasionFlowers,
    description: 'Gentle, respectful arrangements when words alone are not enough.',
    image:
      'https://images.unsplash.com/photo-1496060169243-453fde45943b?auto=format&fit=crop&w=800&q=80',
    alt: 'Soft white sympathy flowers suitable for Melbourne delivery',
  },
  {
    name: 'Thank You Flowers',
    href: LINKS.bouquets,
    description: 'Grateful blooms that say thank you with genuine warmth.',
    image:
      'https://images.unsplash.com/photo-1487070181119-0464eb5dde2f?auto=format&fit=crop&w=800&q=80',
    alt: 'Cheerful thank you flower bouquet in pastel tones',
  },
  {
    name: 'Congratulations Flowers',
    href: LINKS.congratulations,
    description: 'Uplifting florals for promotions, wins, and proud moments.',
    image:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
    alt: 'Bright congratulations bouquet with mixed seasonal flowers',
  },
  {
    name: 'New Baby Flowers',
    href: LINKS.occasionFlowers,
    description: 'Soft pastel bouquets to welcome Melbourne’s newest arrivals.',
    image:
      'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80',
    alt: 'Soft pastel new baby flower bouquet for hospital delivery',
  },
  {
    name: 'Graduation Flowers',
    href: LINKS.congratulations,
    description: 'Celebrate hard work with bright, photo-ready graduation blooms.',
    image:
      'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80',
    alt: 'Vibrant graduation flower bouquet for Melbourne students',
  },
  {
    name: 'Just Because Flowers',
    href: LINKS.bouquets,
    description: 'Spontaneous bouquets for ordinary days that deserve something beautiful.',
    image:
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=640&q=80',
    alt: 'Casual just-because flower bouquet for same-day Melbourne delivery',
  },
] as const

export const FAQS = [
  {
    question: 'How fast is bouquet delivery in Melbourne?',
    answer:
      'Eligible orders placed before the daily cutoff can arrive the same day across many Melbourne suburbs. Standard scheduled delivery is also available if you want blooms to arrive on a specific morning or afternoon.',
  },
  {
    question: 'Can I order same-day bouquets?',
    answer:
      'Yes. Same-day bouquet delivery Melbourne orders are available on eligible postcodes when you complete checkout before the cutoff shown at the time of purchase. Popular same-day picks sell quickly on Fridays and weekends, so ordering earlier helps.',
  },
  {
    question: 'Do you deliver on weekends?',
    answer:
      'Weekend delivery is available across much of greater Melbourne, including Saturday and selected Sunday slots depending on florist capacity and suburb. Choose your preferred date during checkout to confirm availability.',
  },
  {
    question: 'Can I include chocolates or add-ons?',
    answer:
      'Many orders can be paired with complementary gifts from our Australia shop, including seasonal extras and gift options. Browse our full collection for add-ons that travel well with fresh flower bouquets.',
  },
  {
    question: 'Do you deliver to hospitals in Melbourne?',
    answer:
      'Yes, we deliver to many Melbourne hospitals and medical centres. Please include the ward or room details in the delivery notes, and check any local hospital flower policies before ordering.',
  },
  {
    question: 'Can I schedule bouquet delivery for a future date?',
    answer:
      'Absolutely. Select your preferred delivery date at checkout for birthdays, anniversaries, graduations, and other planned occasions. You can send bouquets to Melbourne addresses days or weeks in advance.',
  },
  {
    question: 'What happens if nobody is home?',
    answer:
      'Our couriers follow safe delivery guidelines. Depending on the address and your notes, they may leave the bouquet with a neighbour, concierge, or in a sheltered location, then update you so the gift still arrives fresh.',
  },
  {
    question: 'How are bouquets packaged for delivery?',
    answer:
      'Each arrangement is hand-finished, hydrated, and wrapped to protect stems and blooms in transit. Luxury presentation packaging keeps Floriva bouquets looking gift-ready from our florists to the doorstep.',
  },
  {
    question: 'Which Melbourne suburbs do you deliver to?',
    answer:
      'We cover Melbourne CBD, Southbank, Docklands, Richmond, Carlton, St Kilda, Brunswick, Footscray, South Yarra, Toorak, Hawthorn, Kew, Fitzroy, North Melbourne, West Melbourne, East Melbourne, Point Cook, Werribee, Glen Waverley, Doncaster, Sunshine, and surrounding suburbs.',
  },
  {
    question: 'Are your flowers fresh?',
    answer:
      'Yes. Floriva Gifts sources fresh flowers daily and designs bouquets close to dispatch so petals stay vibrant. We stand by a freshness-focused standard so recipients across Melbourne receive quality blooms.',
  },
  {
    question: 'Can I add a personal gift message?',
    answer:
      'Every bouquet can include a personalised gift message at checkout. It is a simple way to make birthday, anniversary, sympathy, or thank-you flowers feel more thoughtful.',
  },
  {
    question: 'Is online ordering secure?',
    answer:
      'Orders are placed through a secure checkout on florivagifts.com. You can shop bouquet delivery Melbourne collections online with confidence and track your order details after purchase.',
  },
  {
    question: 'Do you offer rose bouquets and luxury designs?',
    answer:
      'Yes. Explore classic rose bouquets, luxury rose collections, romantic arrangements, and custom bouquet options designed by professional florists for Melbourne gifting.',
  },
  {
    question: 'What is the same-day order cutoff?',
    answer:
      'The same-day cutoff can vary by season, demand, and delivery zone. The checkout page shows the latest cutoff for your Melbourne suburb so you know whether same-day bouquet delivery is still available.',
  },
] as const

export function buildJsonLd() {
  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Floriva Gifts',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [
      'https://www.instagram.com/florivagifts',
      'https://www.tiktok.com/@florivagifts',
    ],
  }

  const localBusiness = {
    '@type': 'Florist',
    '@id': `${SITE_URL}/#florist-melbourne`,
    name: 'Floriva Gifts Melbourne',
    image: OG_IMAGE,
    url: CANONICAL_URL,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Melbourne',
      addressRegion: 'VIC',
      addressCountry: 'AU',
    },
    areaServed: [
      { '@type': 'City', name: 'Melbourne' },
      { '@type': 'AdministrativeArea', name: 'Victoria' },
    ],
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
  }

  const product = {
    '@type': 'Product',
    name: 'Handcrafted Flower Bouquets — Melbourne Delivery',
    description: SEO_DESCRIPTION,
    image: OG_IMAGE,
    brand: { '@type': 'Brand', name: 'Floriva Gifts' },
    category: 'Flower Bouquets',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      url: LINKS.bouquets.startsWith('http') ? LINKS.bouquets : `${SITE_URL}${LINKS.bouquets}`,
      offerCount: CATEGORIES.length,
    },
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Australia',
        item: `${SITE_URL}${LINKS.australiaHome}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Melbourne',
        item: CANONICAL_URL,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Bouquet Delivery',
        item: CANONICAL_URL,
      },
    ],
  }

  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  const webPage = {
    '@type': 'WebPage',
    '@id': `${CANONICAL_URL}#webpage`,
    url: CANONICAL_URL,
    name: SEO_TITLE,
    description: SEO_DESCRIPTION,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#florist-melbourne` },
    inLanguage: 'en-AU',
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Floriva Gifts',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      localBusiness,
      product,
      breadcrumb,
      faqPage,
      webPage,
    ],
  }
}
