'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from '@heroicons/react/24/solid'
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

// ─── Sub-item link ─────────────────────────────────────────────────────────────

const SubCategoryLink = ({ sub }: { sub: SubCategory }) => (
  
  <li>
    <Link
      href={`/category/${sub._id}`}
      className="block rounded-md px-4 py-2 text-sm font-normal text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
    >
      {sub.name}
    </Link>
  </li>
)

// ─── Dropdown Menu Item ────────────────────────────────────────────────────────

const CategoryDropdown = ({ category }: { category: Category }) => {
  const hasChildren = category.subCategories && category.subCategories.length > 0

  return (
    <li className="relative group menu-item">
      {/* Trigger */}
      <Link
        href={`/category/${category._id}`}
        className="flex items-center self-center rounded-full px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 lg:text-[15px] xl:px-5 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
      >
        {category.name}
        {hasChildren && (
          <ChevronDownIcon
            className="ml-1 -mr-1 h-4 w-4 text-neutral-400 transition-transform duration-200 group-hover:rotate-180"
            aria-hidden="true"
          />
        )}
      </Link>

      {/* Dropdown panel */}
      {hasChildren && (
        <div
          className={clsx(
            'absolute top-full left-0 z-50 w-52 pt-1',
            // hidden by default, shown on group hover via CSS
            'invisible opacity-0 translate-y-1',
            'group-hover:visible group-hover:opacity-100 group-hover:translate-y-0',
            'transition-all duration-200 ease-out',
          )}
        >
          <ul className="rounded-lg bg-white py-2 text-sm shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
            {category.subCategories.map((sub) => (
              <SubCategoryLink key={sub._id} sub={sub} />
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

// ─── Skeleton loader ───────────────────────────────────────────────────────────

const NavSkeleton = () => (
  <ul className="flex gap-1">
    {[120, 90, 110, 80, 100].map((w, i) => (
      <li key={i}>
        <div
          className="h-9 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"
          style={{ width: w }}
        />
      </li>
    ))}
  </ul>
)

// ─── Main Component ────────────────────────────────────────────────────────────

export interface CategoryNavProps {
  className?: string
  apiUrl?: string
}

const CategoryNav = ({
  className,
  apiUrl = 'http://localhost:7000/api/categoryview',
}: CategoryNavProps) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(apiUrl, { signal: controller.signal })

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`)
        }

        const data: CategoryViewResponse = await res.json()
        setCategories(data.categories ?? [])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()

    return () => controller.abort()
  }, [apiUrl])

  if (loading) return <NavSkeleton />

  if (error) {
    return (
      <p className="text-sm text-red-500 dark:text-red-400">
        Failed to load categories: {error}
      </p>
    )
  }

  if (!categories.length) return null

  return (
    <ul className={clsx('flex flex-wrap items-center gap-1', className)}>
      <li>
    <Link
      href={`/category/`}
      className="flex items-center self-center rounded-full px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 lg:text-[15px] xl:px-5 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
    >
      home
    </Link>
  </li>
      <li>
    <Link
      href={`/allproduct`}
      className="flex items-center self-center rounded-full px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 lg:text-[15px] xl:px-5 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
    >
      All Products
    </Link>
  </li>
      {categories.map((category) => (
        <CategoryDropdown key={category._id} category={category} />
      ))}
    </ul>
  )
}

export default CategoryNav