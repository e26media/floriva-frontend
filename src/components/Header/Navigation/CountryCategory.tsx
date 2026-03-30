// components/CountryCategory.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubCategory {
  _id: string
  name: string
}

interface Category {
  _id: string
  name: string
  description: string
  subCategories: SubCategory[]
}

interface CategoryViewResponse {
  categories: Category[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categoryview`
    : 'http://localhost:7000/api/categoryview'

const POLL_INTERVAL = 30_000

// ─── Helper: build correct href ───────────────────────────────────────────────

function buildCategoryHref(id: string, countryName?: string | null) {
  if (countryName) return `/country/${countryName}/category/${id}`
  return `/category/${id}`
}

// ─── Category Item Component ───────────────────────────────────────────────────

interface CategoryItemProps {
  category: Category
  countryName?: string | null
  onNavigate?: () => void
}

const CategoryItem = ({ category, countryName, onNavigate }: CategoryItemProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = category.subCategories?.length > 0

  const toggleOpen = () => {
    if (hasChildren) {
      setIsOpen(!isOpen)
    }
  }

  const handleLinkClick = () => {
    if (!hasChildren && onNavigate) {
      onNavigate()
    }
  }

  const handleSubLinkClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-700">
      {/* Category Header */}
      <div className="flex items-center justify-between">
        <Link
          href={buildCategoryHref(category._id, countryName)}
          onClick={handleLinkClick}
          className="flex-1 py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          {category.name}
        </Link>
        
        {hasChildren && (
          <button
            onClick={toggleOpen}
            className="p-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${category.name}`}
          >
            <ChevronDownIcon
              className={clsx(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        )}
      </div>

      {/* Subcategories */}
      {hasChildren && isOpen && (
        <div className="bg-neutral-50 dark:bg-neutral-800/50">
          {category.subCategories.map((sub) => (
            <Link
              key={sub._id}
              href={buildCategoryHref(sub._id, countryName)}
              onClick={handleSubLinkClick}
              className="block py-2.5 px-8 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

const CategorySkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between py-3 px-4">
          <div className="h-5 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    ))}
  </div>
)

// ─── Custom hook: fetch with polling ──────────────────────────────────────────

function useCategoryData(apiUrl: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const fetchCategories = useCallback(
    async (signal: AbortSignal, isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)
        setError(null)
        const res = await fetch(apiUrl, {
          signal,
          cache: 'no-store',
        } as RequestInit)
        if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
        const data: CategoryViewResponse = await res.json()
        if (isMounted.current) setCategories(data.categories ?? [])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        if (isMounted.current) setError((err as Error).message ?? 'Unknown error')
      } finally {
        if (isMounted.current) setLoading(false)
      }
    },
    [apiUrl],
  )

  useEffect(() => {
    isMounted.current = true
    const controller = new AbortController()
    fetchCategories(controller.signal, false)

    let timer: ReturnType<typeof setInterval> | null = null
    if (POLL_INTERVAL > 0) {
      timer = setInterval(() => {
        const bg = new AbortController()
        fetchCategories(bg.signal, true)
      }, POLL_INTERVAL)
    }
    return () => {
      isMounted.current = false
      controller.abort()
      if (timer) clearInterval(timer)
    }
  }, [fetchCategories])

  return { categories, loading, error }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export interface CategoryNavProps {
  className?: string
  apiUrl?: string
  countryName?: string
  showHomeLink?: boolean
  showAllProductsLink?: boolean
  showCloseButton?: boolean
  onClose?: () => void
  isOpen?: boolean
}

const CountryCategory = ({ 
  className, 
  apiUrl = API_URL, 
  countryName: propCountry,
  showHomeLink = true,
  showAllProductsLink = true,
  showCloseButton = true,
  onClose,
  isOpen = true
}: CategoryNavProps) => {
  const { categories, loading, error } = useCategoryData(apiUrl)
  const pathname = usePathname()
  
  // Auto-detect country from URL params if not passed as prop
  const params = useParams()
  const countryName = propCountry ?? (params?.name as string | undefined) ?? null

  // Close sidebar when route changes (navigation occurs)
  useEffect(() => {
    if (isOpen && onClose) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]) // Close when pathname changes

  // Handle close button click
  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  // Handle navigation from links
  const handleNavigate = () => {
    if (onClose) {
      onClose()
    }
  }

  if (loading) {
    return (
      <div className={clsx('w-full', className)}>
        <CategorySkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className={clsx('rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400', className)}>
        <p className="text-sm">Failed to load categories: {error}</p>
      </div>
    )
  }

  if (!categories.length) {
    return (
      <div className={clsx('text-center text-neutral-500 dark:text-neutral-400', className)}>
        <p className="text-sm">No categories available</p>
      </div>
    )
  }

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header with Close Button */}
      {showCloseButton && onClose && (
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 p-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {countryName ? `${countryName.charAt(0).toUpperCase() + countryName.slice(1)}` : 'Menu'}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className={clsx('flex-1 overflow-y-auto', !showCloseButton && 'pt-2')} aria-label="Category navigation">
        <div className="space-y-1">
          {/* Home Link */}
          {showHomeLink && (
            <div className="border-b border-neutral-200 dark:border-neutral-700">
              <Link
                href="/"
                onClick={handleNavigate}
                className="block py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                Home
              </Link>
            </div>
          )}

          {/* All Products Links */}
          {showAllProductsLink && (
            <>
              <div className="border-b border-neutral-200 dark:border-neutral-700">
                <Link
                  href={countryName ? `/country/${countryName}` : '/allproduct'}
                  onClick={handleNavigate}
                  className="block py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  {countryName ? `All in ${countryName}` : 'All Products'}
                </Link>
              </div>
              <div className="border-b border-neutral-200 dark:border-neutral-700">
                <Link
                  href={countryName ? `/country/${countryName}/allproduct` : '/allproduct'}
                  onClick={handleNavigate}
                  className="block py-3 px-4 text-base font-medium text-neutral-800 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  All Products
                </Link>
              </div>
            </>
          )}

          {/* Categories */}
          {categories.map((category) => (
            <CategoryItem
              key={category._id}
              category={category}
              countryName={countryName}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}

export default CountryCategory