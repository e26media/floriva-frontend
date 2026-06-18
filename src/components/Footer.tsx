"use client";

import Logo from '@/components/Logo'
import { CustomLink } from '@/data/types'
import SocialsList1 from '@/shared/SocialsList1/SocialsList1'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface StaticWidgetMenu {
  id: string
  title: string
  menus: CustomLink[]
}

interface CategoryMenu {
  href: string
  label: string
  id: string
}

interface CategoryWidgetMenu {
  id: string
  title: string
  menus: CategoryMenu[]
}

type WidgetFooterMenu = StaticWidgetMenu | CategoryWidgetMenu

interface Category {
  _id: string
  name: string
  subCategories?: any[]
  createdAt: string
  updatedAt: string
  __v: number
  categoriesimg?: string
}

const widgetMenus: StaticWidgetMenu[] = [
  {
    id: '5',
    title: 'Quick Links',
    menus: [
      { href: '/', label: 'Home' },
      { href: '/allproduct', label: 'All Products' },
      { href: '/contact', label: 'Contact Us' },
    ],
  },
  {
    id: '4',
    title: 'Policy Info',
    menus: [
      { href: '/Cancellation-Refund', label: 'Cancellation & Refund' },
      { href: '/PrivacyPolicy', label: 'Shipping Policy' },
      { href: '/TermsConditions', label: 'Terms & Conditions' },
    ],
  },
]

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesone, setCategoriesone] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'
      const response = await fetch(`${apiBase}/api/categoryview`)
      const data = await response.json()

      // API returns { categories: [...] }
      const categoryList: Category[] = data.categories || []
      setCategories(categoryList.slice(0, 4))
      setCategoriesone(categoryList.slice(4, 8))
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderWidgetMenuItem = (menu: WidgetFooterMenu, index: number) => {
    return (
      <div key={menu.id} className="text-sm">
        <h2 className="font-semibold text-neutral-700 dark:text-neutral-200">
          {menu.title}
        </h2>
        <ul className="mt-4 space-y-3">
          {menu.menus.map((item, idx) => (
            <li key={idx}>
              <Link
                href={item.href}
                className="text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const categoriesMenu: CategoryWidgetMenu = {
    id: 'categories',
    title: 'Categories',
    menus: loading
      ? [{ href: '#', label: 'Loading...', id: 'loading' }]
      : categories.map((category) => ({
          href: `/category/${category._id}`,
          label: category.name,   // only using the name key
          id: category._id,
        })),
  }
  const categoriesMenuone: CategoryWidgetMenu = {
    id: 'categories-2',
    title: 'Categories',
    menus: loading
      ? [{ href: '#', label: 'Loading...', id: 'loading' }]
      : categoriesone.map((category) => ({
          href: `/category/${category._id}`,
          label: category.name,   // only using the name key
          id: category._id,
        })),
  }

  const allMenus: WidgetFooterMenu[] = [...widgetMenus,categoriesMenu, categoriesMenuone]

  return (
    <footer className="relative border-t">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-10">
          <div className="col-span-2 flex flex-col gap-4 md:col-span-4 lg:col-span-1">
            <Logo />
            <SocialsList1 />
          </div>
          {allMenus.map(renderWidgetMenuItem)}
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-neutral-50 py-5 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="container text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>
            Copyright reserved by Floriva Gifts · Powered by The Scenarios Co. · Made by{' '}
            <Link
              href="https://www.e26media.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#7C4CA3] transition-colors hover:text-[#6a3f8f] hover:underline"
            >
              E26 Media
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer