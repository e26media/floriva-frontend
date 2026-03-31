'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Country {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
  __v: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Map country name (lowercase) → emoji flag
const FLAG_MAP: Record<string, string> = {
  india:              '🇮🇳',
  usa:                '🇺🇸',
  'united states':    '🇺🇸',
  'united kingdom':   '🇬🇧',
  uk:                 '🇬🇧',
  canada:             '🇨🇦',
  australia:          '🇦🇺',
  uae:                '🇦🇪',
  'united arab emirates': '🇦🇪',
  germany:            '🇩🇪',
  france:             '🇫🇷',
  japan:              '🇯🇵',
  china:              '🇨🇳',
  brazil:             '🇧🇷',
  mexico:             '🇲🇽',
  italy:              '🇮🇹',
  spain:              '🇪🇸',
  russia:             '🇷🇺',
  'south korea':      '🇰🇷',
  netherlands:        '🇳🇱',
  switzerland:        '🇨🇭',
  sweden:             '🇸🇪',
  norway:             '🇳🇴',
  denmark:            '🇩🇰',
  finland:            '🇫🇮',
  singapore:          '🇸🇬',
  'new zealand':      '🇳🇿',
  portugal:           '🇵🇹',
  turkey:             '🇹🇷',
  indonesia:          '🇮🇩',
  malaysia:           '🇲🇾',
  thailand:           '🇹🇭',
  philippines:        '🇵🇭',
  pakistan:           '🇵🇰',
  bangladesh:         '🇧🇩',
  'sri lanka':        '🇱🇰',
  nepal:              '🇳🇵',
  egypt:              '🇪🇬',
  'saudi arabia':     '🇸🇦',
  qatar:              '🇶🇦',
  kuwait:             '🇰🇼',
  bahrain:            '🇧🇭',
  oman:               '🇴🇲',
  kenya:              '🇰🇪',
  nigeria:            '🇳🇬',
  'south africa':     '🇿🇦',
  ghana:              '🇬🇭',
  argentina:          '🇦🇷',
  colombia:           '🇨🇴',
  chile:              '🇨🇱',
  peru:               '🇵🇪',
}

export function getFlag(name: string): string {
  return FLAG_MAP[name.toLowerCase()] ?? '🌐'
}

// ─────────────────────────────────────────────────────────────────────────────
// LocationModal
// ─────────────────────────────────────────────────────────────────────────────

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (country: Country, city: string) => void
}

export function LocationModal({ isOpen, onClose, onConfirm }: LocationModalProps) {
  const [countries, setCountries]             = useState<Country[]>([])
  const [loading, setLoading]                 = useState(false)
  const [fetchError, setFetchError]           = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [city, setCity]                       = useState('')
  const [dropdownOpen, setDropdownOpen]       = useState(false)
  const [search, setSearch]                   = useState('')

  const dropdownRef     = useRef<HTMLDivElement>(null)
  const modalRef        = useRef<HTMLDivElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)
  const searchRef       = useRef<HTMLInputElement>(null)

  // ── Filtered countries based on search ────────────────────────────────────
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // ── Fetch countries dynamically on open ───────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    setFetchError('')
    setLoading(true)
    setCountries([])
    setSelectedCountry(null)

    fetch(`${BASE_URL}/api/allCountries`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((json) => {
        const data: Country[] = Array.isArray(json) ? json : (json.data ?? [])
        if (data.length === 0) throw new Error('No countries returned from server.')
        setCountries(data)
        setSelectedCountry(data[0])
      })
      .catch((err: Error) => {
        setFetchError(err.message || 'Failed to load countries. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  // ── Auto-focus search when dropdown opens ─────────────────────────────────
  useEffect(() => {
    if (dropdownOpen) {
      setSearch('')
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [dropdownOpen])

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Prevent background scroll when dropdown overflows ─────────────────────
  useEffect(() => {
    if (dropdownOpen && dropdownMenuRef.current) {
      const el = dropdownMenuRef.current
      const handleWheel = (e: WheelEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = el
        const atTop    = scrollTop === 0
        const atBottom = scrollTop + clientHeight >= scrollHeight
        if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) e.preventDefault()
      }
      el.addEventListener('wheel', handleWheel, { passive: false })
      return () => el.removeEventListener('wheel', handleWheel)
    }
  }, [dropdownOpen])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
  }

  const handleContinue = () => {
    if (!selectedCountry) return
    onConfirm(selectedCountry, city.trim())
  }

  const handleRetry = () => {
    setFetchError('')
    setLoading(true)
    fetch(`${BASE_URL}/api/allCountries`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((json) => {
        const data: Country[] = Array.isArray(json) ? json : (json.data ?? [])
        if (data.length === 0) throw new Error('No countries returned.')
        setCountries(data)
        setSelectedCountry(data[0])
      })
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setLoading(false))
  }

  if (!isOpen) return null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-14 px-4
                 bg-[#eeeeee] lg:bg-transparent"
      onClick={handleBackdropClick}
    >
      {/* Card */}
      <div
        ref={modalRef}
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-visible"
        style={{ animation: 'modalIn 0.25s ease-out' }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#B4538F]/10 flex items-center justify-center shrink-0">
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
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center
                       text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors
                       shrink-0 ml-2 mt-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 pb-5 space-y-4">

          {/* ── Loading State ── */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <svg className="w-5 h-5 text-[#B4538F] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm text-gray-500">Loading countries...</span>
            </div>
          )}

          {/* ── Error State ── */}
          {!loading && fetchError && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd" />
                </svg>
                <p className="text-xs text-red-500">{fetchError}</p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="text-xs font-semibold text-[#B4538F] underline underline-offset-2 hover:text-[#9f3e7a] transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Country Dropdown (only when data ready) ── */}
          {!loading && !fetchError && countries.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Select Country
              </label>

              {/* ── Trigger Button ── */}
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                className={clsx(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium bg-white transition-all duration-200',
                  dropdownOpen
                    ? 'border-[#B4538F] ring-2 ring-[#B4538F]/20 shadow-sm'
                    : 'border-gray-200 hover:border-[#B4538F]/50 hover:shadow-sm',
                )}
              >
                <div className="flex items-center gap-2.5">
                  {/* <span className="text-lg leading-none">{getFlag(selectedCountry?.name ?? '')}</span> */}
                  <span className="text-gray-800 font-semibold">
                    {selectedCountry ? capitalize(selectedCountry.name) : 'Select Country'}
                  </span>
                </div>
                <svg
                  className={clsx(
                    'w-4 h-4 text-gray-400 transition-transform duration-200',
                    dropdownOpen && 'rotate-180',
                  )}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* ── Dropdown Panel ── */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">

                  {/* Search Box */}
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-[#B4538F] focus-within:ring-1 focus-within:ring-[#B4538F]/20 transition-all">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search country"
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          className="text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Country List */}
                  <div
                    ref={dropdownMenuRef}
                    className="country-scroll overflow-y-auto overscroll-contain"
                    style={{
                      maxHeight: '260px',
                      scrollBehavior: 'smooth',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    {filteredCountries.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400">
                        No countries found for &ldquo;{search}&rdquo;
                      </div>
                    ) : (
                      filteredCountries.map((country, index) => {
                        const isSelected = selectedCountry?._id === country._id
                        const isLast     = index === filteredCountries.length - 1
                        return (
                          <button
                            key={country._id}
                            type="button"
                            onClick={() => { setSelectedCountry(country); setDropdownOpen(false) }}
                            className={clsx(
                              'w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors',
                              !isLast && 'border-b border-gray-100',
                              isSelected
                                ? 'bg-[#B4538F]/5'
                                : 'hover:bg-gray-50',
                            )}
                          >
                            {/* Flag */}
                            {/* <span className="text-xl leading-none shrink-0">
                              {getFlag(country.name)}
                            </span> */}

                            {/* Name */}
                            <span className={clsx(
                              'flex-1 font-medium',
                              isSelected ? 'text-[#B4538F]' : 'text-gray-800',
                            )}>
                              {capitalize(country.name)}
                            </span>

                            {/* Radio Button */}
                            <span className={clsx(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                              isSelected
                                ? 'border-[#B4538F] bg-[#B4538F]'
                                : 'border-gray-300 bg-white',
                            )}>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Continue Button ── */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedCountry || loading || !!fetchError}
            className={clsx(
              'w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-150',
              'bg-[#B4538F] hover:bg-[#9f3e7a] active:bg-[#8a3568]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-[#B4538F]/40',
            )}
          >
            Continue Shopping
          </button>
        </div>
      </div>

      {/* ── Animations & Scrollbar ── */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .country-scroll::-webkit-scrollbar              { width: 5px; }
        .country-scroll::-webkit-scrollbar-track        { background: transparent; }
        .country-scroll::-webkit-scrollbar-thumb        { background: #d1d5db; border-radius: 10px; }
        .country-scroll::-webkit-scrollbar-thumb:hover  { background: #9ca3af; }
        .overscroll-contain                             { overscroll-behavior: contain; }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LocationSelector — Trigger Button + Modal
// ─────────────────────────────────────────────────────────────────────────────

export default function LocationSelector() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected]   = useState<{ country: Country; city: string } | null>(null)

  const handleConfirm = (country: Country, city: string) => {
    setSelected({ country, city })
    setModalOpen(false)
    router.push(`/country/${country.name.toLowerCase()}`)
  }

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={clsx(
          'flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg ml-1 mr-1 mb-1 w-full',
          'bg-white border border-gray-200 shadow-sm',
          'lg:flex-row lg:items-center lg:gap-2',
          'lg:bg-transparent lg:border-0 lg:shadow-none',
          'hover:bg-gray-50 lg:hover:bg-gray-100 transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#B4538F]/20',
        )}
      >
        <div className="flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-[#B4538F] shrink-0"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-[12px] font-semibold text-gray-800 leading-tight whitespace-nowrap">
            {selected
              ? `${getFlag(selected.country.name)} ${capitalize(selected.country.name)}${selected.city ? `, ${selected.city}` : ''}`
              : 'Where to deliver?'}
          </p>
        </div>
        {!selected && (
          <p className="text-[11px] text-[#b5451b] font-medium flex items-center gap-0.5 leading-tight pl-[22px] lg:pl-0">
            Location missing
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </p>
        )}
      </button>

      <LocationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  )
}