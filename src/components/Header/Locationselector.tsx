'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Country {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
  __v: number
}

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (country: Country, city: string) => void
}

function LocationModal({ isOpen, onClose, onConfirm }: LocationModalProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [city, setCity] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setFetchError('')
    setLoading(true)
    fetch(`${BASE_URL}/api/allCountries`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then((json) => {
        const data: Country[] = Array.isArray(json) ? json : (json.data ?? [])
        setCountries(data)
        if (data.length > 0 && !selectedCountry) {
          setSelectedCountry(data[0])
        }
      })
      .catch(() => setFetchError('Failed to load countries. Please try again.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Handle scroll locking when dropdown is open
  useEffect(() => {
    if (dropdownOpen && dropdownMenuRef.current) {
      const dropdownMenu = dropdownMenuRef.current
      const handleWheel = (e: WheelEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = dropdownMenu
        const isAtTop = scrollTop === 0
        const isAtBottom = scrollTop + clientHeight >= scrollHeight

        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
          e.preventDefault()
        }
      }

      dropdownMenu.addEventListener('wheel', handleWheel, { passive: false })
      return () => dropdownMenu.removeEventListener('wheel', handleWheel)
    }
  }, [dropdownOpen])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const handleContinue = () => {
    if (!selectedCountry) return
    onConfirm(selectedCountry, city.trim())
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center  pt-14 px-4 h-auto"
      // className="fixed inset-0 z-[999] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-14 px-4 h-auto"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'modalIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#6b6b2a]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#B4538F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900 leading-snug">
                Let&apos;s Personalize Your Experience!
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Find the perfect gifts for you or your loved ones - it&apos;s like magic!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0 ml-2 mt-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* Country Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Select Country
            </label>
            <button
              type="button"
              onClick={() => !loading && setDropdownOpen((v) => !v)}
              disabled={loading}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium bg-white transition-colors',
                dropdownOpen
                  ? 'border-[#B4538F] ring-2 ring-[#B4538F]/20'
                  : 'border-gray-200 hover:border-gray-300',
                loading && 'opacity-60 cursor-not-allowed',
              )}
            >
              <div className="flex items-center gap-2.5 text-gray-800">
                {loading ? (
                  <span className="text-gray-400 text-sm">Loading countries...</span>
                ) : (
                  <span>{selectedCountry ? capitalize(selectedCountry.name) : 'Select Country'}</span>
                )}
              </div>
              {loading ? (
                <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg
                  className={clsx('w-4 h-4 text-gray-400 transition-transform duration-200', dropdownOpen && 'rotate-180')}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && countries.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl">
                <div 
                  ref={dropdownMenuRef}
                  className="max-h-64 overflow-y-auto overscroll-contain"
                  style={{ 
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {countries.map((country) => (
                    <button
                      key={country._id}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country)
                        setDropdownOpen(false)
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:bg-gray-50',
                        selectedCountry?._id === country._id
                          ? 'bg-[#B4538F]/10 text-[#B4538F] font-semibold'
                          : 'text-gray-700',
                      )}
                    >
                      <span>{capitalize(country.name)}</span>
                      {selectedCountry?._id === country._id && (
                        <svg className="w-4 h-4 text-[#B4538F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* City Input - commented out as per original */}
          {/* <div>
            <label htmlFor="city" className="block text-xs font-medium text-gray-700 mb-1.5">
              City (Optional)
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#B4538F] focus:ring-2 focus:ring-[#B4538F]/20 transition-colors"
            />
          </div> */}

          {fetchError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
              </svg>
              {fetchError}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedCountry || loading}
            className={clsx(
              'w-full py-3.5 rounded-lg font-semibold text-sm text-white transition-all duration-150',
              'bg-[#B4538F] hover:bg-[#9f3e7a] active:bg-[#8a3568]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-[#B4538F]/40',
            )}
          >
            Continue Shopping
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        /* Custom scrollbar styling for better appearance */
        .overscroll-contain {
          overscroll-behavior: contain;
        }
        
        .max-h-64::-webkit-scrollbar {
          width: 6px;
        }
        
        .max-h-64::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .max-h-64::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        
        .max-h-64::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  )
}

// ─── Trigger Button ────────────────────────────────────────────────────────────
export default function LocationSelector() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<{ country: Country; city: string } | null>(null)

  const handleConfirm = (country: Country, city: string) => {
    setSelected({ country, city })
    setModalOpen(false)
    // Navigate using country NAME (lowercase) → /country/india
    router.push(`/country/${country.name.toLowerCase()}`)
  }

  return (
    <>
      <button
  type="button"
  onClick={() => setModalOpen(true)}
  className={clsx(
    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg', // mobile: center
    'lg:flex-row lg:items-center lg:gap-2', // desktop: row layout
    'hover:bg-gray-100 transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-[#B4538F]/20',
  )}
>
  <svg
    className="w-4 h-4 text-[#B4538F] shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>

  <div className="text-center lg:text-left">
    <p className="text-[11px] font-semibold text-gray-800 leading-tight whitespace-nowrap">
      {selected
        ? `${capitalize(selected.country.name)}${selected.city ? `, ${selected.city}` : ''}`
        : 'Where to deliver?'}
    </p>
    {!selected && (
      <p className="text-[11px] text-[#b5451b] font-medium flex items-center justify-center lg:justify-start gap-0.5 leading-tight">
        Location missing
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </p>
    )}
  </div>
</button>


      <LocationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  )
}