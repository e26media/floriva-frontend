// components/Header.tsx (Client Component)
'use client'

import Logo from '@/components/Logo'
import clsx from 'clsx'
import { FC } from 'react'
import AvatarDropdown from './AvatarDropdown'
import CartBtn from './CartBtn'
import CategoriesDropdown from './CategoriesDropdown'
import CurrLangDropdown from './CurrLangDropdown'
import HamburgerBtnMenu from './HamburgerBtnMenu'
import MegaMenuPopover from './MegaMenuPopover'
import SearchBtnPopover from './SearchBtnPopover'

export interface HeaderProps {
  hasBorderBottom?: boolean
  megamenu: any
  dropdownCategories: any
  currencies: any
  languages: any
  featuredCollection: any
}

const Header: FC<HeaderProps> = ({ 
  hasBorderBottom = true,
  megamenu,
  dropdownCategories,
  currencies,
  languages,
  featuredCollection
}) => {
  return (
    <div className="relative z-10">
      <div className="container">
        <div
          className={clsx(
            'flex h-20 justify-between gap-x-2.5 border-neutral-200 dark:border-neutral-700',
            hasBorderBottom && 'border-b',
            !hasBorderBottom && 'has-[.header-popover-full-panel]:border-b'
          )}
        >
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-8">
            <Logo />
            <div className="hidden h-9 border-l border-neutral-200 md:block dark:border-neutral-700"></div>
            <CategoriesDropdown categories={dropdownCategories} className="hidden md:block" />
          </div>

          <div className="flex flex-1 items-center justify-end gap-x-2.5 sm:gap-x-5">
            <div className="block lg:hidden">
              <HamburgerBtnMenu />
            </div>
            <MegaMenuPopover megamenu={megamenu} featuredCollection={featuredCollection} />
            <CurrLangDropdown currencies={currencies} languages={languages} className="hidden md:block" />
            <SearchBtnPopover />
            <AvatarDropdown />
            <CartBtn />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header