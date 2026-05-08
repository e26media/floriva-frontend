'use client'

import clsx from 'clsx'
import { FC, useEffect, useState } from 'react'
import { formatPrice } from '@/utils/currency'

export interface PricesProps {
  className?: string
  price: number
  contentClass?: string
  countrySlug?: string | null
}

const Prices: FC<PricesProps> = ({
  className,
  price,
  contentClass = 'py-1 px-2 md:py-1.5 md:px-2.5 text-sm font-medium',
  countrySlug: propCountrySlug,
}) => {
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => {
      if (!propCountrySlug && typeof window !== 'undefined') {
        const saved = localStorage.getItem('floriva_selected_country')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed?.country?.name) {
              setDetectedCountry(parsed.country.name.toLowerCase())
            }
          } catch (e) {}
        }
      }
    }

    sync() // Initial sync
    window.addEventListener('floriva_country_changed', sync)
    return () => window.removeEventListener('floriva_country_changed', sync)
  }, [propCountrySlug])

  const slug = propCountrySlug || detectedCountry

  return (
    <div className={clsx(className)}>
      <div className={`flex items-center rounded-lg border-2 border-green-500 ${contentClass}`}>
        <span className="leading-none! text-green-500">
          {formatPrice(price, slug)}
        </span>
      </div>
    </div>
  )
}

export default Prices
