'use client'

import backgroundLineSvg from '@/images/Moon.svg'
import heroImage2 from '@/images/floriva/banner/2.png'
import { fetchSiteContent, resolveMediaUrl, resolveSlideHref, stripHtml, type HeroSlide } from '@/lib/siteContent'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC, useEffect, useMemo, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { useInterval } from 'react-use'

/** Served from /public — no Next.js image optimization or recompression */
const HERO_BANNER_SRC = '/images/hero-banner.png'
const HERO_BANNER_WIDTH = 1024
const HERO_BANNER_HEIGHT = 384

function buildAllProductHref(pathname: string): string {
  const countryMatch = pathname.match(/^(\/country\/[^/]+)/)
  if (countryMatch) {
    return `${countryMatch[1]}/allproduct`
  }
  return '/allproduct'
}

type SlideView = {
  id: string
  imageUrl: string
  heading: string
  subHeading: string
  btnText: string
  btnLink?: string
  imageAlt?: string
  imageTitle?: string
  imageDescription?: string
  fullBanner?: boolean
}

const DEFAULT_SLIDES: SlideView[] = [
  {
    id: 'default-hero',
    imageUrl: HERO_BANNER_SRC,
    heading: 'Exclusive Collection for everyone',
    subHeading: 'In this season find the best',
    imageDescription: 'Handcrafted arrangements made with fresh blooms and love, perfect for every occasion and every moment.',
    btnText: 'Explore Now',
    fullBanner: true,
  },
]

function mapApiSlides(apiSlides: HeroSlide[]): SlideView[] {
  return apiSlides.map((slide) => ({
    id: slide._id,
    imageUrl: resolveMediaUrl(slide.imageUrl),
    heading: slide.heading,
    subHeading: slide.subHeading,
    btnText: slide.btnText,
    btnLink: slide.btnLink,
    imageAlt: slide.imageAlt,
    imageTitle: slide.imageTitle,
    imageDescription: slide.imageDescription,
    fullBanner: slide.fullBanner !== false,
  }))
}

interface Props {
  className?: string
}

let TIME_OUT: NodeJS.Timeout | null = null

const SectionHero2: FC<Props> = ({ className = '' }) => {
  const pathname = usePathname()
  const allProductHref = buildAllProductHref(pathname ?? '/')

  const [slides, setSlides] = useState<SlideView[]>(DEFAULT_SLIDES)

  useEffect(() => {
    fetchSiteContent().then(({ heroSlides }) => {
      const mapped = mapApiSlides(heroSlides)
      if (mapped.length > 0) setSlides(mapped)
    })
  }, [])

  const [isSlided, setIsSlided] = useState(false)
  const [indexActive, setIndexActive] = useState(0)
  const [isRunning, toggleIsRunning] = useState(true)

  const slideCount = slides.length

  useEffect(() => {
    if (indexActive >= slideCount) setIndexActive(0)
  }, [slideCount, indexActive])

  const handlers = useSwipeable({
    onSwipedLeft: () => handleClickNext(),
    onSwipedRight: () => handleClickPrev(),
    trackMouse: true,
  })

  useEffect(() => {
    if (isSlided || !indexActive) return
    setTimeout(() => {
      setIsSlided(true)
    }, 0)
  }, [indexActive, isSlided])

  const handleAutoNext = () => {
    setIndexActive((state) => (state >= slideCount - 1 ? 0 : state + 1))
  }

  const handleClickNext = () => {
    setIndexActive((state) => (state >= slideCount - 1 ? 0 : state + 1))
    handleAfterClick()
  }

  const handleClickPrev = () => {
    setIndexActive((state) => (state === 0 ? slideCount - 1 : state - 1))
    handleAfterClick()
  }

  const handleAfterClick = () => {
    toggleIsRunning(false)
    if (TIME_OUT) clearTimeout(TIME_OUT)
    TIME_OUT = setTimeout(() => toggleIsRunning(true), 1000)
  }

  useInterval(() => handleAutoNext(), isRunning && slideCount > 1 ? 5000 : 999999)

  const isRemoteImage = useMemo(
    () => (url: string) => url.startsWith('http://') || url.startsWith('https://'),
    []
  )

  const renderFullBanner = (item: SlideView, isActive: boolean) => {
    const href = resolveSlideHref(item.btnLink, allProductHref)
    const alt = item.imageAlt?.trim() || stripHtml(item.heading) || item.btnText

    return (
    <div
      key={item.id}
      className={clsx(
        'fade--animation relative -mt-px w-full overflow-hidden bg-[#FAF0E8] leading-none',
        isActive ? 'block' : 'hidden'
      )}
    >
      <div className="relative min-h-[520px] overflow-hidden bg-[#fff2f6] px-5 pb-8 pt-8 sm:min-h-[580px] sm:px-8 md:hidden">
        <img
          src={item.imageUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[72%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,246,248,0.99)_0%,rgba(255,246,248,0.94)_43%,rgba(255,246,248,0.48)_68%,rgba(255,246,248,0.06)_100%)]" />
        <div className="relative z-10 flex min-h-[470px] max-w-[300px] flex-col justify-center sm:max-w-[340px]">
          <div className="mb-3 flex items-center gap-3 text-[#7C4CA3]">
            <span className="h-px w-12 bg-current opacity-35" />
            <span className="h-2.5 w-2.5 rounded-full border border-current" />
            <span className="h-px w-12 bg-current opacity-35" />
          </div>
          {item.subHeading && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#7c348b] sm:text-sm">
              {stripHtml(item.subHeading)}
            </p>
          )}
          <h1
            className="max-w-[280px] text-[2.7rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#7b2b86] sm:max-w-[330px] sm:text-[3.35rem]"
            dangerouslySetInnerHTML={{ __html: item.heading }}
          />
          {item.imageDescription && (
            <p className="mt-5 max-w-[250px] text-sm leading-6 text-[#7b3f83] sm:max-w-[290px] sm:text-base">
              {stripHtml(item.imageDescription)}
            </p>
          )}
          <ButtonPrimary className="mt-6 w-fit shadow-lg shadow-[#7C4CA3]/20" href={href}>
            <span className="me-2">{item.btnText}</span>
            <HugeiconsIcon icon={Search01Icon} size={18} />
          </ButtonPrimary>
        </div>
      </div>

      <Link href={href} className="hidden w-full md:block" aria-label={item.btnText} title={item.imageTitle || undefined}>
        <div className="relative w-full overflow-hidden md:overflow-visible">
          <img
            src={item.imageUrl}
            alt={alt}
            title={item.imageTitle || undefined}
            width={HERO_BANNER_WIDTH}
            height={HERO_BANNER_HEIGHT}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="block w-full object-cover object-center md:mx-auto md:h-auto md:max-h-none md:max-w-[1920px] md:object-contain"
          />
        </div>
      </Link>
    </div>
  )
  }

  const renderSplitSlide = (item: SlideView, index: number, isActive: boolean) => {
    const href = resolveSlideHref(item.btnLink, allProductHref)
    const alt = item.imageAlt?.trim() || stripHtml(item.heading) || item.btnText

    return (
    <div
      key={item.id}
      className={clsx(
        'fade--animation relative flex flex-col gap-10 overflow-hidden py-14 pl-container sm:py-20 lg:flex-row lg:items-center',
        isActive ? 'flex' : 'hidden'
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[#E3FFE6]">
        <Image
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="absolute h-full w-full object-contain"
          src={backgroundLineSvg}
          alt="hero background"
        />
      </div>

      {slideCount > 1 && (
        <div className="absolute start-1/2 bottom-4 flex -translate-x-1/2 justify-center rtl:translate-x-1/2">
          {slides.map((_, dotIndex) => {
            const isDotActive = indexActive === dotIndex
            return (
              <div
                key={dotIndex}
                onClick={() => {
                  setIndexActive(dotIndex)
                  handleAfterClick()
                }}
                className="relative cursor-pointer px-1 py-1.5"
              >
                <div className="relative h-1 w-20 rounded-md bg-white shadow-xs">
                  {isDotActive && (
                    <div className="absolute inset-0 rounded-md bg-neutral-900 fade--animation__dot" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="relative flex max-w-5xl flex-1/2 flex-col items-start fade--animation__left">
        <span className="block text-base font-medium text-neutral-700 fade--animation__subheading md:text-xl">
          {item.subHeading}
        </span>
        <h2
          className="mt-5 text-4xl font-semibold text-neutral-900 fade--animation__heading sm:mt-6 md:text-5xl xl:text-6xl xl:leading-[1.2] 2xl:text-7xl"
          dangerouslySetInnerHTML={{ __html: item.heading }}
        />

        <ButtonPrimary className="mt-10 fade--animation__button sm:mt-20" href={href}>
          <span className="me-2">{item.btnText}</span>
          <HugeiconsIcon icon={Search01Icon} size={20} />
        </ButtonPrimary>
      </div>

      <div className="relative -z-10 flex-1/2 lg:pr-10">
        <Image
          sizes="(max-width: 768px) 100vw, 60vw"
          className="h-auto w-full max-w-160 object-contain fade--animation__image select-none"
          src={item.imageUrl || heroImage2.src}
          alt={alt}
          title={item.imageTitle || undefined}
          width={790}
          height={790}
          priority
          unoptimized={isRemoteImage(item.imageUrl)}
        />
      </div>
    </div>
  )
  }

  const renderItem = (index: number) => {
    const isActive = indexActive === index
    const item = slides[index]
    if (!item) return null

    if (item.fullBanner) {
      return renderFullBanner(item, isActive)
    }

    return renderSplitSlide(item, index, isActive)
  }

  const hasFullBannerOnly = slides.length === 1 && slides[0]?.fullBanner

  return (
    <div className={clsx('relative z-1', className)} {...(hasFullBannerOnly ? {} : handlers)}>
      {slides.map((_, index) => renderItem(index))}

      {!hasFullBannerOnly && slideCount > 1 && (
        <>
          <button
            type="button"
            className="absolute inset-y-px end-0 z-10 hidden items-center justify-center px-10 text-neutral-700 lg:flex"
            onClick={handleClickNext}
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={0.6}
              stroke="currentColor"
              className="h-12 w-12"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            type="button"
            className="absolute inset-y-px start-0 z-10 hidden items-center justify-center px-10 text-neutral-700 lg:flex"
            onClick={handleClickPrev}
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={0.6}
              stroke="currentColor"
              className="h-12 w-12"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

export default SectionHero2
