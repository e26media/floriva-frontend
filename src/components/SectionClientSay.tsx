'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import type { EmblaOptionsType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ReviewItem {
  id: number
  clientName: string
  gender: 'male' | 'female'
  /** randomuser.me portrait index (1-99) — real licensed photos of people */
  portraitId: number
  content: string
  rating?: number
}

export interface SectionClientSayProps {
  className?: string
  emblaOptions?: EmblaOptionsType
  heading?: string
  subHeading?: string
  data?: ReviewItem[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Photos served from randomuser.me — free, licensed placeholder portraits of real people.
// URL pattern: https://randomuser.me/api/portraits/[women|men]/{id}.jpg
// Thumbnail:   https://randomuser.me/api/portraits/thumb/[women|men]/{id}.jpg
export const DEMO_DATA: ReviewItem[] = [
  {
    id: 1,
    clientName: 'Sarah',
    gender: 'female',
    portraitId: 44,
    content:
      'I surprised my husband with the Midnight Elegance hamper for our anniversary. The combination of fresh lilies and premium chocolates was perfect. Floriva really nailed the presentation!',
    rating: 5,
  },
  {
    id: 2,
    clientName: 'David',
    gender: 'male',
    portraitId: 32,
    content:
      "Ordered a bouquet for my wife's birthday. I was worried about the delivery time, but they arrived exactly when promised and the roses were incredibly fresh. Seeing her face light up was worth every penny.",
    rating: 5,
  },
  {
    id: 3,
    clientName: 'Priya',
    gender: 'female',
    portraitId: 65,
    content:
      "The Love & Grace gift set is a lifesaver. I sent it to my husband's office for our promotion celebration. The flowers stayed fresh for over a week! Best florist in the city.",
    rating: 5,
  },
  {
    id: 4,
    clientName: 'James',
    gender: 'male',
    portraitId: 51,
    content:
      "Usually, flower delivery is a gamble, but Floriva is consistent. I got the luxury hamper for my wife — the packaging was so sophisticated she didn't even want to open it! Highly recommend for special occasions.",
    rating: 5,
  },
  {
    id: 5,
    clientName: 'Anita',
    gender: 'female',
    portraitId: 79,
    content:
      "Found the perfect anniversary gift here. The personalized note and the freshness of the carnations made my husband feel really special. It's my new go-to for all things floral.",
    rating: 5,
  },
  {
    id: 6,
    clientName: 'Mark',
    gender: 'male',
    portraitId: 18,
    content:
      'The variety at Floriva is unmatched. I bought a custom gift hamper with fresh flowers and snacks. Everything was high-quality, and the flowers smelled amazing the moment I opened the box.',
    rating: 5,
  },
  {
    id: 7,
    clientName: 'Elena',
    gender: 'female',
    portraitId: 22,
    content:
      "I've tried many e-commerce flower shops, but Floriva's bouquet arrangements look exactly like the pictures online. Very impressed with the vibrant colors and the stem quality.",
    rating: 5,
  },
  {
    id: 8,
    clientName: 'Rahul',
    gender: 'male',
    portraitId: 73,
    content:
      "The fragrance of the fresh lilies I ordered filled the entire living room! It's clear they use premium, farm-fresh flowers. The website was also very easy to navigate.",
    rating: 5,
  },
  {
    id: 9,
    clientName: 'Sophie',
    gender: 'female',
    portraitId: 11,
    content:
      'Excellent customer service! I needed to change my delivery address at the last minute for a gift hamper, and the team was so helpful. The flowers arrived in pristine condition.',
    rating: 5,
  },
  {
    id: 10,
    clientName: 'Michael',
    gender: 'male',
    portraitId: 60,
    content:
      'Floriva makes gifting easy. From luxury bouquets to well-curated hampers, they have something for every budget. The delivery tracking was spot on, and the quality is 10/10.',
    rating: 5,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function portraitUrl(gender: 'male' | 'female', id: number, thumb = false): string {
  const folder = gender === 'female' ? 'women' : 'men'
  const prefix = thumb ? 'thumb/' : ''
  return `https://randomuser.me/api/portraits/${prefix}${folder}/${id}.jpg`
}

// 6 absolute positions forming a ring around the center card
const ORBIT_STYLES: React.CSSProperties[] = [
  { top: '-60px',   left: '50%',  transform: 'translateX(-50%)' }, // top
  { top: '10px',    right: '-76px'                              }, // right-top
  { bottom: '10px', right: '-76px'                              }, // right-bottom
  { bottom: '-60px',left: '50%',  transform: 'translateX(-50%)' }, // bottom
  { bottom: '10px', left: '-76px'                               }, // left-bottom
  { top: '10px',    left: '-76px'                               }, // left-top
]

// ─── Orbit Avatar ─────────────────────────────────────────────────────────────
const OrbitAvatar: FC<{ reviewer: ReviewItem; style: React.CSSProperties }> = ({
  reviewer,
  style,
}) => (
  <div
    className="absolute z-10 group transition-all duration-700 ease-in-out"
    style={style}
  >
    <div className="size-[50px] rounded-full overflow-hidden ring-2 ring-white dark:ring-neutral-800 shadow-md opacity-55 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 cursor-pointer">
      <img
        src={portraitUrl(reviewer.gender, reviewer.portraitId, true)}
        alt={reviewer.clientName}
        width={50}
        height={50}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
    {/* Name tooltip */}
    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900/80 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      {reviewer.clientName}
    </span>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const SectionClientSay: FC<SectionClientSayProps> = ({
  className,
  emblaOptions = { slidesToScroll: 1, loop: true },
  heading = 'What Our Customers Say 🌸',
  subHeading = 'Real stories from people who gifted with Floriva',
  data = DEMO_DATA,
}) => {
  const autoplayPlugin = useRef(Autoplay({ playOnInit: true, delay: 3800 }))
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions, [autoplayPlugin.current])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps]     = useState<number[]>([])
  const [avatarKey, setAvatarKey]         = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setAvatarKey((k) => k + 1)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setTimeout(() => {
      setScrollSnaps(emblaApi.scrollSnapList())
      onSelect()
    }, 0)
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const current = data[selectedIndex]

  // 6 orbit avatars = every reviewer except the currently active one
  const orbitReviewers = data.filter((_, i) => i !== selectedIndex).slice(0, 6)

  return (
    <div className={clsx('relative  ', className)}>

      {/* ── Section header ─────────────────────────────────── */}
      <div className="text-center ">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400 mb-3">
          {subHeading}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100">
          {heading}
        </h2>
      </div>

      {/* ── Avatar ring + carousel ──────────────────────────── */}
      <div className="relative mx-auto max-w-lg">

        {/* ── Orbit ring (desktop only) ── */}
        {/* <div className="hidden md:block">
          {orbitReviewers.map((reviewer, idx) => (
            <OrbitAvatar
              key={reviewer.id}
              reviewer={reviewer}
              style={ORBIT_STYLES[idx] ?? {}}
            />
          ))}
        </div> */}

        {/* ── Central active avatar ── */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            {/* Pulsing decorative ring */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full ring-[6px] ring-rose-200 dark:ring-rose-900 scale-[1.18] opacity-60"
              style={{ animation: 'pulseSlow 3s ease-in-out infinite' }}
            />
            <div className="relative z-10 size-[100px] rounded-full overflow-hidden ring-4 ring-white dark:ring-neutral-900 shadow-2xl">
              <img
                key={avatarKey}
                src={portraitUrl(current?.gender ?? 'female', current?.portraitId ?? 1)}
                alt={current?.clientName}
                width={100}
                height={100}
                className="w-full h-full object-cover"
                style={{ animation: 'avatarIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
              />
            </div>
          </div>
        </div>

        {/* ── Carousel ── */}
        <div className="relative px-1">
          {/* Decorative quotation marks */}
          <span
            aria-hidden
            className="absolute -top-8 -left-3 text-7xl leading-none font-serif select-none pointer-events-none text-rose-200 dark:text-rose-900"
          >
            &quot;
          </span>
          <span
            aria-hidden
            className="absolute -bottom-10 -right-3 text-7xl leading-none font-serif select-none pointer-events-none text-rose-200 dark:text-rose-900 rotate-180"
          >
            &quot;
          </span>

          <div className="overflow-hidden" ref={emblaRef}>
            <ul className="flex">
              {data.map((item) => (
                <li
                  key={item.id}
                  className="basis-full shrink-0 grow-0 flex flex-col items-center text-center px-6 md:px-10"
                  style={{ minWidth: '100%' }}
                >
                  <p className="text-base md:text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-300 min-h-[80px]">
                    {item.content}
                  </p>

                  <span className="mt-7 text-sm font-semibold text-neutral-800 dark:text-neutral-100 tracking-wide">
                    — {item.clientName}
                  </span>

                  <div className="mt-2 flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: item.rating ?? 5 }).map((_, i) => (
                      <StarIcon key={i} className="h-4 w-4" />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Prev / Dots / Next ── */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous review"
            className="flex items-center justify-center size-9 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-all"
          >
            <ChevronLeftIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </button>

          <div className="flex items-center gap-1.5">
            {scrollSnaps.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Review ${index + 1}`}
                className={clsx(
                  'rounded-full transition-all duration-300 focus:outline-none',
                  index === selectedIndex
                    ? 'bg-rose-400 w-5 h-2'
                    : 'size-2 bg-neutral-300 dark:bg-neutral-600 hover:bg-rose-200 dark:hover:bg-rose-700',
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next review"
            className="flex items-center justify-center size-9 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-neutral-800 transition-all"
          >
            <ChevronRightIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* ── Mobile avatar strip ── */}
        {/* <div className="mt-8 flex md:hidden items-center justify-center gap-2 overflow-x-auto pb-1 px-2">
          {data.map((reviewer, idx) => (
            <button
              type="button"
              key={reviewer.id}
              onClick={() => emblaApi?.scrollTo(idx)}
              aria-label={`Go to ${reviewer.clientName}`}
              className="shrink-0 focus:outline-none"
            >
              <div
                className={clsx(
                  'size-10 rounded-full overflow-hidden transition-all duration-300',
                  idx === selectedIndex
                    ? 'ring-2 ring-rose-400 ring-offset-2 scale-110'
                    : 'opacity-50 hover:opacity-80',
                )}
              >
                <img
                  src={portraitUrl(reviewer.gender, reviewer.portraitId, true)}
                  alt={reviewer.clientName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </button>
          ))}
        </div> */}
      </div>

      {/* ── Keyframe animations ── */}
      <style jsx global>{`
        @keyframes avatarIn {
          from { opacity: 0; transform: scale(0.82); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.45; transform: scale(1.18); }
          50%       { opacity: 0.75; transform: scale(1.26); }
        }
      `}</style>
    </div>
  )
}

export default SectionClientSay