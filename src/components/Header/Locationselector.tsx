'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

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

  useEffect(() => {
    if (!isOpen) return
    setFetchError('')
    setLoading(true)
    fetch('http://localhost:7000/api/allCountries')
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-14 px-4"
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
              <svg className="w-5 h-5 text-[#6b6b2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="px-5 pb-5 space-y-3">
          {/* Country Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => !loading && setDropdownOpen((v) => !v)}
              disabled={loading}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium bg-white transition-colors',
                dropdownOpen
                  ? 'border-[#6b6b2a] ring-2 ring-[#6b6b2a]/20'
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

            {dropdownOpen && countries.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                {countries.map((country) => (
                  <button
                    key={country._id}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(country)
                      setDropdownOpen(false)
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                      selectedCountry?._id === country._id
                        ? 'bg-[#6b6b2a]/10 text-[#6b6b2a] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    <span>{capitalize(country.name)}</span>
                    {selectedCountry?._id === country._id && (
                      <svg className="w-4 h-4 text-[#6b6b2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Input */}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter your city (optional)"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#6b6b2a] focus:ring-2 focus:ring-[#6b6b2a]/20 transition-colors"
          />

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
              'w-full py-3.5 rounded-lg font-semibold text-sm text-white transition-colors duration-150',
              'bg-[#6b6b2a] hover:bg-[#5a5a22] active:bg-[#4a4a1c]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-[#6b6b2a]/40',
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
          'hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg',
          'hover:bg-gray-100 transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#6b6b2a]/20',
        )}
      >
        <svg className="w-4 h-4 text-[#6b6b2a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>

        <div className="text-left">
          <p className="text-[11px] font-semibold text-gray-800 leading-tight whitespace-nowrap">
            {selected
              ? `${capitalize(selected.country.name)}${selected.city ? `, ${selected.city}` : ''}`
              : 'Where to deliver?'}
          </p>
          {!selected && (
            <p className="text-[11px] text-[#b5451b] font-medium flex items-center gap-0.5 leading-tight">
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