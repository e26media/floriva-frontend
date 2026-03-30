'use client'

import { Divider } from '@/components/Divider'
import { TNavigationItem } from '@/data/navigation'
import { Link } from '@/shared/link'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  useClose,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import CountryCategory from './CountryCategory'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubCategory {
  _id: string
  name: string
}

interface Category {
  _id: string
  name: string
  subCategories: SubCategory[]
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  categories: Category[]
}

interface CountryCategory {
  _id: string
  name: string
  slug: string
  categories: Category[]
}

interface CountryApiResponse {
  categories: CountryCategory[]
}

interface SidebarNavigationProps {
  data: TNavigationItem[]
}

// ─── API URL ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categoryview`
  : 'http://localhost:7000/api/categoryview'

const COUNTRY_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/country-categories`
  : 'http://localhost:7000/api/country-categories'

// ─── Sub-component: Static nav link ───────────────────────────────────────────

const StaticNavItem: React.FC<{ href: string; label: string; onClose: () => void }> = ({
  href,
  label,
  onClose,
}) => (
  <li className="text-neutral-900 dark:text-white">
    <Link
      href={href}
      onClick={onClose}
      className="flex w-full rounded-lg px-3 py-2.5 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      {label}
    </Link>
  </li>
)

// ─── Sub-component: Category item with subcategory disclosure ─────────────────

const CategoryNavItem: React.FC<{ category: Category; onClose: () => void }> = ({
  category,
  onClose,
}) => {
  const hasChildren = category.subCategories.length > 0

  // Build a slug-style href from category name
  const categoryHref = `/category/${category._id}`

  return (
    <Disclosure as="li" className="text-neutral-900 dark:text-white">
      <DisclosureButton className="flex w-full cursor-pointer rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <Link
          href={categoryHref}
          className={clsx(!hasChildren && 'flex-1', 'block py-2.5')}
          onClick={onClose}
        >
          {category.name}
        </Link>
        {hasChildren && (
          <div className="flex flex-1 justify-end">
            <ChevronDownIcon
              className="ml-2 h-4 w-4 self-center text-neutral-500 transition-transform ui-open:rotate-180"
              aria-hidden="true"
            />
          </div>
        )}
      </DisclosureButton>

      {hasChildren && (
        <DisclosurePanel>
          <ul className="pb-1 pl-6 text-base">
            {category.subCategories.map((sub) => (
              <li key={sub._id}>
                <Link
                  href={`/category/${category._id}/sub/${sub._id}`}
                  onClick={onClose}
                  className="mt-0.5 flex rounded-lg py-2.5 pr-4 pl-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </DisclosurePanel>
      )}
    </Disclosure>
  )
}

// ─── Sub-component: Country Category item with categories disclosure ──────────

const CountryCategoryItem: React.FC<{ 
  countryCategory: CountryCategory; 
  onClose: () => void;
  currentCountry?: string;
}> = ({ countryCategory, onClose, currentCountry }) => {
  const hasChildren = countryCategory.categories?.length > 0
  const countrySlug = countryCategory.slug || countryCategory.name.toLowerCase()
  
  // Build href for the main country category page
  const countryHref = `/country/${countrySlug}`

  return (
    <Disclosure as="li" className="text-neutral-900 dark:text-white">
      <DisclosureButton className="flex w-full cursor-pointer rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800">
        <Link
          href={countryHref}
          className={clsx(!hasChildren && 'flex-1', 'block py-2.5')}
          onClick={onClose}
        >
          {countryCategory.name}
        </Link>
        {hasChildren && (
          <div className="flex flex-1 justify-end">
            <ChevronDownIcon
              className="ml-2 h-4 w-4 self-center text-neutral-500 transition-transform ui-open:rotate-180"
              aria-hidden="true"
            />
          </div>
        )}
      </DisclosureButton>

      {hasChildren && (
        <DisclosurePanel>
          <ul className="pb-1 pl-6 text-base">
            {countryCategory.categories.map((category) => (
              <li key={category._id}>
                <Link
                  href={`/country/${countrySlug}/category/${category._id}`}
                  onClick={onClose}
                  className="mt-0.5 flex rounded-lg py-2.5 pr-4 pl-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </DisclosurePanel>
      )}
    </Disclosure>
  )
}

// ─── Sub-component: Static TNavigationItem (existing data prop) ───────────────

const StaticMenuChild = (
  item: TNavigationItem,
  itemClass = 'pl-3 text-neutral-900 dark:text-neutral-200 font-medium',
  onClose: () => void
): React.ReactNode => {
  return (
    <ul className="nav-mobile-sub-menu pb-1 pl-6 text-base">
      {item.children?.map((childMenu, index) => (
        <Disclosure key={index} as="li">
          <Link
            href={childMenu.href || '#'}
            className={`mt-0.5 flex rounded-lg pr-4 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${itemClass}`}
          >
            <span className={`py-2.5 ${!childMenu.children ? 'block w-full' : ''}`}>
              {childMenu.name}
            </span>
            {childMenu.children && (
              <span className="flex grow items-center" onClick={(e) => e.preventDefault()}>
                <DisclosureButton as="span" className="flex grow justify-end">
                  <ChevronDownIcon className="ml-2 h-4 w-4 text-neutral-500" aria-hidden="true" />
                </DisclosureButton>
              </span>
            )}
          </Link>
          {childMenu.children && (
            <DisclosurePanel>
              {StaticMenuChild(childMenu, 'pl-3 text-neutral-600 dark:text-neutral-400', onClose)}
            </DisclosurePanel>
          )}
        </Disclosure>
      ))}
    </ul>
  )
}

const StaticNavItemWithChildren: React.FC<{
  menu: TNavigationItem
  index: number
  onClose: () => void
}> = ({ menu, index, onClose }) => (
  <Disclosure key={index} as="li" className="text-neutral-900 dark:text-white">
    <DisclosureButton className="flex w-full cursor-pointer rounded-lg px-3 text-start text-sm font-medium tracking-wide uppercase hover:bg-neutral-100 dark:hover:bg-neutral-800">
      <Link
        href={menu.href || '#'}
        className={clsx(!menu.children?.length && 'flex-1', 'block py-2.5')}
        onClick={onClose}
      >
        {menu.name}
      </Link>
      {menu.children?.length && (
        <div className="flex flex-1 justify-end">
          <ChevronDownIcon
            className="ml-2 h-4 w-4 self-center text-neutral-500 transition-transform ui-open:rotate-180"
            aria-hidden="true"
          />
        </div>
      )}
    </DisclosureButton>
    {menu.children && (
      <DisclosurePanel>{StaticMenuChild(menu, undefined, onClose)}</DisclosurePanel>
    )}
  </Disclosure>
)

// ─── Category Navigation Component ───────────────────────────────────────────

const CategoryNav: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const res = await fetch(API_URL, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
        const json: ApiResponse = await res.json()
        setCategories(json.categories ?? [])
      } catch (err) {
        console.error(err)
        setError('Could not load categories.')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <>
      {loading && (
        <li className="px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500 animate-pulse">
          Loading categories…
        </li>
      )}
      {error && (
        <li className="px-3 py-2 text-sm text-red-500">{error}</li>
      )}
      {!loading && !error && categories.length === 0 && (
        <li className="px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500">
          No categories available.
        </li>
      )}
      {!loading &&
        !error &&
        categories.map((category) => (
          <CategoryNavItem
            key={category._id}
            category={category}
            onClose={onClose}
          />
        ))}
    </>
  )
}

// ─── Country Category Navigation Component ───────────────────────────────────

const CountryCategoryNav: React.FC<{ 
  onClose: () => void;
  currentCountry?: string;
}> = ({ onClose, currentCountry }) => {
  const [countryCategories, setCountryCategories] = useState<CountryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCountryCategories = async () => {
      try {
        setLoading(true)
        const url = currentCountry 
          ? `${COUNTRY_API_URL}?country=${currentCountry}`
          : COUNTRY_API_URL
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to fetch country categories: ${res.status}`)
        const json: CountryApiResponse = await res.json()
        setCountryCategories(json.categories ?? [])
      } catch (err) {
        console.error(err)
        setError('Could not load country categories.')
      } finally {
        setLoading(false)
      }
    }

    fetchCountryCategories()
  }, [currentCountry])

  return (
    <>
      {loading && (
        <li className="px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500 animate-pulse">
          Loading country categories…
        </li>
      )}
      {error && (
        <li className="px-3 py-2 text-sm text-red-500">{error}</li>
      )}
      {!loading && !error && countryCategories.length === 0 && (
        <li className="px-3 py-2 text-sm text-neutral-400 dark:text-neutral-500">
          No country categories available.
        </li>
      )}
      {!loading &&
        !error &&
        countryCategories.map((countryCategory) => (
          <CountryCategoryItem
            key={countryCategory._id}
            countryCategory={countryCategory}
            onClose={onClose}
            currentCountry={currentCountry}
          />
        ))}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ data }) => {
  const handleClose = useClose()
  const pathname = usePathname()
  
  // Check if we're on a country page
  const isCountryPage = pathname?.startsWith('/country/')
  const currentCountry = isCountryPage ? pathname?.split('/')[2] : undefined

  return (
    <div>
      {/* Static nav items from `data` prop */}
      {/* <ul className="flex flex-col gap-y-1 px-2 pt-6">
        {data?.map((menu, index) => (
          <StaticNavItemWithChildren
            key={index}
            menu={menu}
            index={index}
            onClose={handleClose}
          />
        ))}
      </ul> */}

      {/* <Divider className="my-4" /> */}

      {/* Fixed static links */}
      <ul className="flex flex-col gap-y-1 px-2">
        <StaticNavItem href="/" label="Home" onClose={handleClose} />
        <StaticNavItem href="/allproduct" label="All Products" onClose={handleClose} />
      </ul>

      <Divider className="my-4" />

      {/* Dynamic navigation based on route */}
      <ul className="flex flex-col gap-y-1 px-2 pb-6">
        {isCountryPage ? (
          <CountryCategory 
            // onClose={handleClose} 
            // currentCountry={currentCountry}
          />
        ) : (
          <CategoryNav onClose={handleClose} />
        )}
      </ul>
    </div>
  )
}

export default SidebarNavigation