'use client'

import backgroundLineSvg from '@/images/Moon.svg'
import heroImage1 from '@/images/floriva/aboutbanneer.png'
import heroImage2 from '@/images/floriva/banner/2.png'
import heroImage3 from '@/images/floriva/banner/5.png'
import ButtonPrimary from '@/shared/Button/ButtonPrimary'
import { Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import clsx from 'clsx'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { FC, useEffect, useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { useInterval } from 'react-use'

// ─── Helper: build the correct /allproduct href ───────────────────────────────
// Rules:
//   /                          → /allproduct
//   /country/australia         → /country/australia/allproduct
//   /country/australia/        → /country/australia/allproduct
//   /country/australia/xyz     → /country/australia/allproduct  (stays in same country)
function buildAllProductHref(pathname: string): string {
  // Match /country/<slug> at the start of the path
  const countryMatch = pathname.match(/^(\/country\/[^/]+)/)
  if (countryMatch) {
    return `${countryMatch[1]}/allproduct`
  }
  return '/allproduct'
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const slides = [
  {
    id: 1,
    imageUrl: heroImage1.src,
    heading: 'Exclusive collection <br /> for everyone',
    subHeading: 'In this season, find the best 🔥',
    btnText: 'Explore shop now',
  },
  {
    id: 2,
    imageUrl: heroImage2.src,
    heading: 'Exclusive collection <br /> for everyone',
    subHeading: 'In this season, find the best 🔥',
    btnText: 'Explore shop now',
  },
  {
    id: 3,
    imageUrl: heroImage3.src,
    heading: 'Exclusive collection <br /> for everyone',
    subHeading: 'In this season, find the best 🔥',
    btnText: 'Explore shop now',
  },
]

interface Props {
  className?: string
}

let TIME_OUT: NodeJS.Timeout | null = null

const SectionHero2: FC<Props> = ({ className = '' }) => {
  const pathname = usePathname()

  // Compute the correct allproduct href based on the current route
  const allProductHref = buildAllProductHref(pathname ?? '/')

  // ─── Slider state ────────────────────────────────────────────────────────
  const [isSlided, setIsSlided] = useState(false)
  const [indexActive, setIndexActive] = useState(0)
  const [isRunning, toggleIsRunning] = useState(true)

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
    setIndexActive((state) => (state >= slides.length - 1 ? 0 : state + 1))
  }

  const handleClickNext = () => {
    setIndexActive((state) => (state >= slides.length - 1 ? 0 : state + 1))
    handleAfterClick()
  }

  const handleClickPrev = () => {
    setIndexActive((state) => (state === 0 ? slides.length - 1 : state - 1))
    handleAfterClick()
  }

  const handleAfterClick = () => {
    toggleIsRunning(false)
    if (TIME_OUT) clearTimeout(TIME_OUT)
    TIME_OUT = setTimeout(() => toggleIsRunning(true), 1000)
  }

  useInterval(
    () => handleAutoNext(),
    isRunning ? 5000 : 999999
  )

  // ─── Render a single slide ────────────────────────────────────────────────
  const renderItem = (index: number) => {
    const isActive = indexActive === index
    const item = slides[index]

    return (
      <div
        key={index}
        className={clsx(
          'fade--animation relative flex flex-col gap-10 overflow-hidden py-14 pl-container sm:py-20 lg:flex-row lg:items-center',
          isActive ? 'flex' : 'hidden'
        )}
      >
        {/* Background */}
        <div className="absolute inset-0 -z-10 bg-[#E3FFE6]">
          <Image
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="absolute h-full w-full object-contain"
            src={backgroundLineSvg}
            alt="hero background"
          />
        </div>

        {/* Dot indicators */}
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

        {/* Text content */}
        <div className="relative flex max-w-5xl flex-1/2 flex-col items-start fade--animation__left">
          <span className="block text-base font-medium text-neutral-700 fade--animation__subheading md:text-xl">
            {item.subHeading}
          </span>
          <h2
            className="mt-5 text-4xl font-semibold text-neutral-900 fade--animation__heading sm:mt-6 md:text-5xl xl:text-6xl xl:leading-[1.2] 2xl:text-7xl"
            dangerouslySetInnerHTML={{ __html: item.heading }}
          />

          {/* ✅ Button uses the dynamic country-aware href */}
          <ButtonPrimary
            className="mt-10 fade--animation__button sm:mt-20"
            href={allProductHref}
          >
            <span className="me-2">{item.btnText}</span>
            <HugeiconsIcon icon={Search01Icon} size={20} />
          </ButtonPrimary>
        </div>

        {/* Hero image */}
        <div className="relative -z-10 flex-1/2 lg:pr-10">
          <Image
            sizes="(max-width: 768px) 100vw, 60vw"
            className="h-auto w-full max-w-[40rem] object-contain fade--animation__image select-none"
            src={item.imageUrl}
            alt={item.heading}
            width={790}
            height={790}
            priority
          />
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={clsx('relative z-[1]', className)} {...handlers}>
      {slides.map((_, index) => renderItem(index))}

      {/* Next arrow */}
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

      {/* Prev arrow */}
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
    </div>
  )
}

export default SectionHero2