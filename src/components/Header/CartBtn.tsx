'use client'

import { useState, useRef } from 'react'
import { ShoppingCart02Icon, Store02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'

/* ─── Types ─────────────────────────────────────────────────── */
interface VendorFormData {
  vendorName: string
  vendorAddress: string
  email: string
  phone: string
  shopLicence: string
  vendorPhoto: File | null
  shopPhoto: File | null
}

/* ─── Brand colors ───────────────────────────────────────────── */
// Primary:   #EA5A7B  (pink)
// Secondary: #7C4CA3  (purple)

/* ─── Image preview hook ─────────────────────────────────────── */
function useImagePreview() {
  const [preview, setPreview] = useState<string | null>(null)
  const handleFile = (file: File | null) => {
    if (!file) return setPreview(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }
  return { preview, handleFile }
}

/* ─── Upload Box ─────────────────────────────────────────────── */
function UploadBox({
  label,
  sublabel,
  preview,
  onFile,
  accept = 'image/*',
  icon,
}: {
  label: string
  sublabel?: string
  preview: string | null
  onFile: (f: File | null) => void
  accept?: string
  icon: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative cursor-pointer rounded-2xl border-2 border-dashed border-[#EA5A7B]/20 bg-[#EA5A7B]/[0.02] overflow-hidden aspect-[4/3] transition-all duration-200 hover:border-[#EA5A7B]/50 hover:bg-[#EA5A7B]/[0.05] group"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <>
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/30 px-3 py-1 rounded-full">
              Change
            </span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-[11px] font-semibold text-gray-400 text-center leading-tight">{label}</span>
          {sublabel && (
            <span className="text-[10px] text-gray-300 text-center">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Field wrapper ──────────────────────────────────────────── */
function Field({
  label,
  optional,
  children,
}: {
  label: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-gray-400">
        {label}
        {optional && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#7C4CA3]/10 text-[#7C4CA3] tracking-wider normal-case">
            Optional
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

/* ─── Shared input class ─────────────────────────────────────── */
const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-300 outline-none transition-all duration-150 focus:border-[#EA5A7B]/50 focus:bg-white focus:ring-2 focus:ring-[#EA5A7B]/10'

/* ─── Vendor Popup ───────────────────────────────────────────── */
function VendorPopup({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<VendorFormData>({
    vendorName: '',
    vendorAddress: '',
    email: '',
    phone: '',
    shopLicence: '',
    vendorPhoto: null,
    shopPhoto: null,
  })

  const vendorImg = useImagePreview()
  const shopImg = useImagePreview()

  const set = (key: keyof VendorFormData, value: string | File | null) =>
    setForm((f) => ({ ...f, [key]: value }))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        @keyframes vpFadeIn  { from { opacity: 0 }                              to { opacity: 1 } }
        @keyframes vpSlideUp { from { opacity: 0; transform: translateY(18px) scale(.97) } to { opacity: 1; transform: none } }
        @keyframes popIn     { from { transform: scale(.4); opacity: 0 }        to { transform: scale(1); opacity: 1 } }
        .vp-animate-in  { animation: vpFadeIn  .22s ease; }
        .vp-shell       { animation: vpSlideUp .28s cubic-bezier(.22,1,.36,1); }
        .vp-pop-in      { animation: popIn     .4s  cubic-bezier(.22,1,.36,1); }
        .font-syne      { font-family: 'Syne', sans-serif; }
      `}</style>

      {/* Backdrop — centered with flex */}
      <div
        className="vp-animate-in fixed inset-0 z-50 flex items-center justify-center p-4  backdrop-blur-sm mt-80 "
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Modal — white background */}
        <div className="vp-shell relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl shadow-black/15 border border-gray-100/80">

          {/* Top accent stripe */}
          <div
            className="h-1 w-full rounded-t-3xl"
            style={{ background: 'linear-gradient(90deg, #7C4CA3, #B95592, #EA5A7B)' }}
          />

          {!submitted ? (
            <>
              {/* ── Header ── */}
              <div className="flex items-start justify-between px-7 pt-6">
                <div>
                  <h2 className="font-syne text-xl font-extrabold text-gray-800 tracking-tight">
                    Vendor Registration
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {step === 1 ? 'Upload photos & basic info' : 'Contact details & licence'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base text-gray-300 hover:text-[#EA5A7B] hover:bg-[#EA5A7B]/10 transition-all duration-150 flex-shrink-0 mt-0.5"
                >
                  ✕
                </button>
              </div>

              {/* ── Step pills ── */}
              <div className="flex items-center gap-2 px-7 mt-4">
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: 36,
                    background: step >= 1
                      ? 'linear-gradient(90deg, #7C4CA3, #EA5A7B)'
                      : '#e5e7eb',
                  }}
                />
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: 36,
                    background: step === 2
                      ? 'linear-gradient(90deg, #7C4CA3, #EA5A7B)'
                      : '#e5e7eb',
                  }}
                />
                <span className="ml-auto text-[10px] font-bold tracking-widest uppercase text-gray-300">
                  Step {step} / 2
                </span>
              </div>

              {/* ── Divider ── */}
              <div className="mx-7 mt-4 h-px bg-gray-100" />

              {/* ── Body ── */}
              <div className="px-7 py-5 flex flex-col gap-4">
                {step === 1 ? (
                  <>
                    {/* Photo uploads */}
                    <div className="grid grid-cols-2 gap-3">
                      <UploadBox
                        label="Vendor Photo"
                        sublabel="Your profile picture"
                        preview={vendorImg.preview}
                        onFile={(f) => { set('vendorPhoto', f); vendorImg.handleFile(f) }}
                        icon="🧑‍💼"
                      />
                      <UploadBox
                        label="Shop Photo"
                        sublabel="Storefront / interior"
                        preview={shopImg.preview}
                        onFile={(f) => { set('shopPhoto', f); shopImg.handleFile(f) }}
                        icon="🏪"
                      />
                    </div>

                    <div className="h-px bg-gray-100" />

                    <Field label="Vendor / Shop Name">
                      <input
                        className={inputCls}
                        placeholder="e.g. Sunrise Traders"
                        value={form.vendorName}
                        onChange={(e) => set('vendorName', e.target.value)}
                      />
                    </Field>

                    <Field label="Vendor Address">
                      <textarea
                        className={inputCls + ' resize-none min-h-[72px]'}
                        placeholder="Street, City, State, PIN code..."
                        value={form.vendorAddress}
                        onChange={(e) => set('vendorAddress', e.target.value)}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    {/* Email + Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Email">
                        <input
                          className={inputCls}
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                        />
                      </Field>
                      <Field label="Phone">
                        <input
                          className={inputCls}
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={(e) => set('phone', e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <Field label="Shop Licence Number" optional>
                      <input
                        className={inputCls}
                        placeholder="e.g. KA/MNG/2024/00123"
                        value={form.shopLicence}
                        onChange={(e) => set('shopLicence', e.target.value)}
                      />
                    </Field>

                    {/* Review summary */}
                    <div
                      className="rounded-2xl p-4 text-xs leading-relaxed"
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,76,163,.04), rgba(234,90,123,.04))',
                        border: '1px solid rgba(234,90,123,.12)',
                      }}
                    >
                      <p className="font-syne text-[10px] font-bold tracking-widest uppercase mb-2.5"
                        style={{ color: '#7C4CA3' }}>
                        Review
                      </p>
                      <div className="flex flex-col gap-1 text-gray-500">
                        <span>🏷 <span className="font-semibold text-gray-700">{form.vendorName || '—'}</span></span>
                        <span>📍 {form.vendorAddress || '—'}</span>
                        <span>📷 Vendor photo: <span className="text-gray-600">{form.vendorPhoto?.name ?? '—'}</span></span>
                        <span>🏪 Shop photo: <span className="text-gray-600">{form.shopPhoto?.name ?? '—'}</span></span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── Footer ── */}
              <div className="px-7 pb-7 flex gap-3">
                {step === 1 ? (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.99]"
                      style={{
                        background: 'linear-gradient(135deg, #7C4CA3, #EA5A7B)',
                        boxShadow: '0 4px 18px rgba(234,90,123,.32)',
                      }}
                    >
                      Continue →
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all duration-150"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => setSubmitted(true)}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.99]"
                      style={{
                        background: 'linear-gradient(135deg, #7C4CA3, #EA5A7B)',
                        boxShadow: '0 4px 18px rgba(234,90,123,.32)',
                      }}
                    >
                      Submit Registration
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* ── Success ── */
            <div className="flex flex-col items-center gap-5 px-8 py-14 text-center">
              <div
                className="vp-pop-in w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7C4CA3, #EA5A7B)',
                  boxShadow: '0 0 40px rgba(234,90,123,.35)',
                }}
              >
                ✓
              </div>
              <div>
                <h3 className="font-syne text-xl font-extrabold text-gray-800">
                  You're registered!
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Your vendor profile has been submitted.<br />
                  We'll review and activate your account within 24 hours.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #7C4CA3, #EA5A7B)',
                  boxShadow: '0 4px 18px rgba(234,90,123,.3)',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── CartBtn (default export) ───────────────────────────────── */
export default function CartBtn() {
  const router = useRouter()
  const [showVendorPopup, setShowVendorPopup] = useState(false)

  return (
    <>
      {/* Cart button */}
      <button
        onClick={() => router.push('/cart')}
        title="Cart"
        className="relative -m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-0 dark:hover:bg-neutral-800"
      >
        <HugeiconsIcon
          icon={ShoppingCart02Icon}
          size={24}
          color="currentColor"
          strokeWidth={1.5}
        />
      </button>

      {/* Join as Vendor button */}
      <button
        onClick={() => setShowVendorPopup(true)}
        title="Join as Vendor"
        className="hidden md:block relative -m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-0 dark:hover:bg-neutral-800"
      >
        <HugeiconsIcon
          icon={Store02Icon}
          size={24}
          color="currentColor"
          strokeWidth={1.5}
        />
      </button>

      {/* Vendor Registration Popup */}
      {showVendorPopup && (
        <VendorPopup onClose={() => setShowVendorPopup(false)} />
      )}
    </>
  )
}