'use client'

import Logo from '@/components/Logo'
import { getCollections } from '@/data/data'
import { getNavigation } from '@/data/navigation'
import clsx from 'clsx'
import { FC, useEffect, useRef, useState } from 'react'
import AvatarDropdown from './AvatarDropdown'
import CartBtn from './CartBtn'
import HamburgerBtnMenu from './HamburgerBtnMenu'
import Navigation from './Navigation/Navigation'
import SearchBtnPopover from './SearchBtnPopover'
import CategoryNav from './Navigation/CategoryNav'
import LocationSelector from './Locationselector'

export interface Props {
  hasBorder?: boolean
}

interface StickyHeaderProps {
  hasBorder: boolean
  navigationMenu: Awaited<ReturnType<typeof getNavigation>>
  featuredCollection: Awaited<ReturnType<typeof getCollections>>[number]
}

const StickyHeader: FC<StickyHeaderProps> = ({
  hasBorder,
  navigationMenu,
  featuredCollection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show/hide on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        // Scrolling DOWN → hide
        setIsVisible(false)
      } else {
        // Scrolling UP → show
        setIsVisible(true)
      }

      // Add shadow/backdrop when not at top
      setIsScrolled(currentScrollY > 10)

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={clsx(
        // ── Sticky positioning ──────────────────────────────────────────────
        'fixed top-0 left-0 right-0 z-50 w-full',

        // ── Slide-up / slide-down transition ────────────────────────────────
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : '-translate-y-full',

        // ── Background blur effect when scrolled ────────────────────────────
        isScrolled
          ? 'bg-white/80 backdrop-blur-md dark:bg-neutral-900/80'
          : 'bg-white dark:bg-neutral-900',

        // ── Shadow when scrolled ─────────────────────────────────────────────
        isScrolled && 'shadow-sm',
      )}
    >
      <div
        className={clsx(
          'relative border-neutral-200 dark:border-neutral-700',
          hasBorder && !isScrolled && 'border-b',
          !hasBorder && 'has-[.header-popover-full-panel]:border-b',
          isScrolled && 'border-b',
        )}
      >
        <div className="container flex h-20 justify-between">

          {/* ── Mobile hamburger ── */}
          <div className="flex flex-1 items-center lg:hidden">
            <HamburgerBtnMenu />
          </div>

          {/* ── Logo ── */}
          <div className="flex items-center lg:flex-1 sm:ml-[20px]">
            <Logo />
          </div>
         

          {/* ── Location Selector — LEFT side, desktop only (after logo) ── */}
          <div className="hidden lg:flex items-center ml-4">
            <LocationSelector />
          </div>

          {/* ── Desktop navigation ── */}
          <div className="mx-4 hidden flex-2 justify-center lg:flex">
            {/* <Navigation
              menu={navigationMenu}
              featuredCollection={featuredCollection}
            /> */}
          </div>

          {/* ── Actions — right side ── */}
          <div className="flex flex-1 items-center justify-end gap-x-2.5 sm:gap-x-5">
            {/* <SearchBtnPopover /> */}
            <CartBtn />
            <AvatarDropdown />
          </div>

        </div>
          <div className="flex items-center lg:hidden justify-start ">
  <LocationSelector />
</div>

        {/* ── Category Nav row ── */}
        <div className="mx-4 hidden flex-2 lg:flex">
          <CategoryNav
            // menu={navigationMenu}
            // featuredCollection={featuredCollection}
          />
        </div>
      </div>
    </div>
  )
}

const Header2: FC<Props> = async ({ hasBorder = true }) => {
  const navigationMenu = await getNavigation()
  const allCollections = await getCollections()

  return (
    <>
      <div className="h-20" aria-hidden="true" />

      <StickyHeader
        hasBorder={hasBorder}
        navigationMenu={navigationMenu}
        featuredCollection={allCollections[10]}
      />
    </>
  )
}

export default Header2