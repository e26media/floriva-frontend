'use client'

import { UserCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Divider } from '../Divider'
import { Link } from '../Link'
import { useState, useRef, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:7000/api'
interface Props { className?: string }

// ─── Google popup ─────────────────────────────────────────────────────────────
function openGooglePopup(
  onResult: (data: { token: string; name: string; email: string }) => void,
  onError: (msg: string) => void
) {
  const W = 500, H = 640
  const left = Math.round(window.screenX + (window.outerWidth - W) / 2)
  const top  = Math.round(window.screenY + (window.outerHeight - H) / 2)
  const popup = window.open(
    `${API_BASE}/google-login`, 'FlorivaGoogleLogin',
    `width=${W},height=${H},left=${left},top=${top},toolbar=no,menubar=no,location=yes,scrollbars=yes,status=no`
  )
  if (!popup) { alert('Popup blocked! Please allow popups for this site.'); return }

  const handler = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return
    if (e.data?.type === 'FLORIVA_GOOGLE_SUCCESS') {
      window.removeEventListener('message', handler); clearInterval(poll); popup.close()
      onResult(e.data.payload)
    }
    if (e.data?.type === 'FLORIVA_GOOGLE_ERROR') {
      window.removeEventListener('message', handler); clearInterval(poll); popup.close()
      onError(e.data.error || 'Google sign-in failed')
    }
  }
  window.addEventListener('message', handler)
  const poll = setInterval(() => {
    if (popup.closed) { clearInterval(poll); window.removeEventListener('message', handler) }
  }, 500)
}

// ─── UserAvatar: real image → letter initial fallback ────────────────────────
function UserAvatar({ imgUrl, name, email, size = 48 }: {
  imgUrl?: string; name?: string; email?: string; size?: number
}) {
  const [imgError, setImgError] = useState(false)
  const displayName = name || email || ''
  const initial = displayName.trim()[0]?.toUpperCase() || '?'
  const gradients = [
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-green-600',
    'from-blue-400 to-indigo-600',
    'from-pink-400 to-rose-600',
    'from-violet-400 to-purple-600',
    'from-orange-400 to-red-600',
    'from-teal-400 to-cyan-600',
  ]
  const grad = gradients[(initial.charCodeAt(0) || 0) % gradients.length]
  const canShowImage = imgUrl && !imgError

  const sizeClass = size <= 36 ? 'w-9 h-9 text-sm' : size <= 48 ? 'w-12 h-12 text-base' : 'w-16 h-16 text-xl'

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 relative flex items-center justify-center shadow-md bg-gradient-to-br ${canShowImage ? 'bg-transparent' : grad}`}>
      {canShowImage ? (
        <img src={imgUrl} alt={displayName} onError={() => setImgError(true)} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-extrabold leading-none select-none" style={{ fontFamily: 'Georgia, serif' }}>
          {initial}
        </span>
      )}
    </div>
  )
}

// ─── SVGs ─────────────────────────────────────────────────────────────────────
const FlorivaFlower = ({ size = 46 }: { size?: number }) => (
  <svg viewBox="0 0 52 52" width={size} height={size} fill="none">
    <circle cx="26" cy="16" r="8" fill="#fbbf24" opacity="0.92"/>
    <circle cx="36" cy="26" r="8" fill="#34d399" opacity="0.92"/>
    <circle cx="16" cy="26" r="8" fill="#f97316" opacity="0.92"/>
    <circle cx="26" cy="36" r="8" fill="#a78bfa" opacity="0.92"/>
    <circle cx="26" cy="26" r="7" fill="white"/>
    <circle cx="26" cy="26" r="4" fill="#fbbf24"/>
  </svg>
)

const GoogleG = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.5 1.2 8.9 3.2l6.6-6.6C35.3 2.4 30 0 24 0 14.6 0 6.6 5.5 2.6 13.5l7.7 6C12.2 13.2 17.6 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
    <path fill="#FBBC05" d="M10.3 28.5A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.1.8-4.5l-7.7-6A23.8 23.8 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.7-6.2z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.4 0-11.8-4.3-13.7-10.2l-7.7 6.2C6.6 42.5 14.6 48 24 48z"/>
  </svg>
)

const Spinner = ({ color = 'white' }: { color?: string }) => (
  <svg className="animate-spin flex-shrink-0" width="17" height="17" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color === 'white' ? 'rgba(255,255,255,0.25)' : '#e5e7eb'} strokeWidth="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

// ─── Google Loading Screen ─────────────────────────────────────────────────────
function GoogleLoadingScreen({ user, onDone }: { user: { name: string; email: string }; onDone: () => void }) {
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<'loading' | 'success'>('loading')
  const initial = (user.name || user.email || 'U')[0].toUpperCase()

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t1 = setTimeout(() => setPhase('success'), 1200)
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDone, 320) }, 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-black/55 backdrop-blur-xl transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white rounded-3xl px-8 sm:px-12 py-10 sm:py-12 text-center shadow-2xl w-full max-w-xs transition-all duration-400 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-7'}`}>
        <div className="flex justify-center mb-4"><FlorivaFlower size={44}/></div>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 mx-auto mb-3 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg" style={{ fontFamily: 'Georgia,serif', animation: 'floraPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {initial}
        </div>
        <div className="text-base font-bold text-gray-900" style={{ fontFamily: 'Georgia,serif' }}>{user.name || 'Welcome back'}</div>
        <div className="text-xs text-gray-400 mt-1 mb-6">{user.email}</div>
        {phase === 'loading' ? (
          <>
            <div className="flex justify-center gap-2 mb-3">
              {['#4285F4','#EA4335','#FBBC05','#34A853'].map((c,i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c, animation: `floraBounce 1.2s ease-in-out infinite`, animationDelay: `${i*0.14}s` }}/>
              ))}
            </div>
            <p className="text-xs text-gray-400">Signing you in to Floriva…</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ animation: 'floraPopIn 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-sm font-bold text-emerald-500">Welcome to Floriva! 🌸</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes floraBounce{0%,80%,100%{transform:scale(0.6);opacity:0.35}40%{transform:scale(1.1);opacity:1}}
        @keyframes floraPopIn{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes floraSlide{0%{background-position:0% 0%}100%{background-position:200% 0%}}
      `}</style>
    </div>
  )
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function FlorivaAuthModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (user: any, token: string) => void
}) {
  const [step,       setStep]       = useState<'email' | 'otp'>('email')
  const [email,      setEmail]      = useState('')
  const [otp,        setOtp]        = useState(['','','','','',''])
  const [loading,    setLoading]    = useState(false)
  const [gLoading,   setGLoading]   = useState(false)
  const [error,      setError]      = useState('')
  const [timer,      setTimer]      = useState(0)
  const [visible,    setVisible]    = useState(false)
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; token: string } | null>(null)

  const otpRefs  = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const closeModal = () => { setVisible(false); setTimeout(onClose, 260) }

  const startTimer = () => {
    setTimer(30)
    timerRef.current = setInterval(() => setTimer(p => {
      if (p <= 1) { clearInterval(timerRef.current!); return 0 }
      return p - 1
    }), 1000)
  }

  const sendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to send OTP')
      setStep('otp'); startTimer()
    } catch (e: any) { setError(e.message || 'Something went wrong.') }
    finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter all 6 digits.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp: code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Invalid OTP')
      onSuccess(data.user, data.token)
    } catch (e: any) {
      setError(e.message || 'Invalid OTP. Try again.')
      setOtp(['','','','','','']); otpRefs.current[0]?.focus()
    }
    finally { setLoading(false) }
  }

  const changeOtp = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const n = [...otp]; n[i] = v; setOtp(n)
    if (v && i < 5) otpRefs.current[i+1]?.focus()
  }
  const keyOtp = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus()
  }
  const pasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const d = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    const n = [...otp]; d.split('').forEach((c,i) => { n[i] = c }); setOtp(n)
    otpRefs.current[Math.min(d.length,5)]?.focus()
  }

  const handleGoogleLogin = () => {
    setGLoading(true); setError('')
    openGooglePopup(
      (data) => { setGLoading(false); setGoogleUser(data) },
      (msg)  => { setGLoading(false); setError(msg || 'Google sign-in failed. Please try again.') }
    )
    setTimeout(() => setGLoading(false), 3000)
  }

  const handleGoogleDone = useCallback(() => {
    if (googleUser) onSuccess({ username: googleUser.name, email: googleUser.email }, googleUser.token)
  }, [googleUser, onSuccess])

  return (
    <>
      {/* ── Backdrop + centering ── */}
      <div
        className={`  lg:mt-[320px] fixed inset-0 z-50 flex items-center justify-center p-4  backdrop-blur-xl transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={e => e.target === e.currentTarget && closeModal()}
      >
        {/* ── Card ── */}
        <div className={` w-full max-w-sm sm:max-w-md relative bg-gradient-to-br from-amber-50 via-white to-green-50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-350 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-6'}`}>

          {/* Rainbow bar */}
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#fbbf24,#f97316,#34d399,#a78bfa,#fbbf24)', backgroundSize: '200% 100%', animation: 'floraSlide 3s linear infinite' }}/>

          {/* Close */}
          <button onClick={closeModal} className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-400 transition-colors cursor-pointer border-0 bg-transparent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          </button>

          <div className="px-7 pt-8 pb-7 sm:px-9 ">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2.5"><FlorivaFlower size={46}/></div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight m-0" style={{ fontFamily: 'Georgia,serif' }}>
                {step === 'email' ? 'Sign Up / Login to Floriva!' : 'Check your inbox'}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
                {step === 'email' ? 'Enter your email address to continue' : (
                  <><span>We emailed a 6-digit code to</span><br/><strong className="text-orange-500">{email}</strong></>
                )}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-3.5 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* ══ EMAIL STEP ══ */}
            {step === 'email' && (
              <>
                <div className="mb-3.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <input
                      type="email" value={email} autoFocus placeholder="you@example.com"
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && sendOtp()}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-200 box-border"
                    />
                  </div>
                </div>

                <button
                  onClick={sendOtp} disabled={loading}
                  className={`w-full py-3.5 rounded-2xl border-0 text-sm font-bold flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'}`}
                >
                  {loading && <Spinner/>}
                  {loading ? 'Sending OTP…' : 'Continue →'}
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-100"/>
                  <span className="text-xs text-gray-400 font-semibold">or</span>
                  <div className="flex-1 h-px bg-gray-100"/>
                </div>

                <button
                  onClick={handleGoogleLogin} disabled={gLoading}
                  className={`w-full py-3 rounded-2xl border border-gray-200 bg-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-sm ${gLoading ? 'opacity-70 cursor-wait' : 'hover:border-blue-400 hover:shadow-md hover:shadow-blue-100 cursor-pointer'}`}
                >
                  {gLoading ? <Spinner color="#4285F4"/> : <GoogleG size={20}/>}
                  <span className="text-gray-700">{gLoading ? 'Opening Google…' : 'Login with Google'}</span>
                </button>

                <p className="mt-2.5 text-center text-xs text-gray-400">
                  Google's account picker will open in a popup window
                </p>
                <p className="mt-3.5 text-center text-xs text-gray-300">
                  By continuing you agree to our{' '}
                  <a href="#" className="text-orange-500 no-underline hover:underline">Terms</a>{' '}&{' '}
                  <a href="#" className="text-orange-500 no-underline hover:underline">Privacy</a>
                </p>
              </>
            )}

            {/* ══ OTP STEP ══ */}
            {step === 'otp' && (
              <>
                <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={pasteOtp}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      autoFocus={i === 0}
                      onChange={e => changeOtp(i, e.target.value)}
                      onKeyDown={e => keyOtp(i, e)}
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold rounded-2xl outline-none transition-all border-2 ${d ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-200' : 'border-gray-200 bg-white'}`}
                      style={{ fontFamily: 'Georgia,serif', color: '#1a1a1a' }}
                    />
                  ))}
                </div>

                <button
                  onClick={verifyOtp} disabled={loading || otp.join('').length < 6}
                  className={`w-full py-3.5 rounded-2xl border-0 text-sm font-bold flex items-center justify-center gap-2 transition-all ${(loading || otp.join('').length < 6) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200 hover:scale-[1.01] cursor-pointer'}`}
                >
                  {loading && <Spinner/>}
                  {loading ? 'Verifying…' : 'Verify & Sign In ✓'}
                </button>

                <div className="mt-4 flex items-center justify-between text-xs sm:text-sm">
                  <button
                    onClick={() => { setStep('email'); setOtp(['','','','','','']); setError('') }}
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer p-0 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Change email
                  </button>
                  <button
                    onClick={timer === 0 ? sendOtp : undefined} disabled={timer > 0 || loading}
                    className={`bg-transparent border-0 p-0 font-semibold transition-colors ${timer > 0 ? 'text-gray-300 cursor-default' : 'text-orange-500 hover:text-orange-600 cursor-pointer'}`}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {googleUser && <GoogleLoadingScreen user={googleUser} onDone={handleGoogleDone}/>}

      <style>{`
        @keyframes floraSlide{0%{background-position:0% 0%}100%{background-position:200% 0%}}
        @keyframes floraBounce{0%,80%,100%{transform:scale(0.6);opacity:0.35}40%{transform:scale(1.1);opacity:1}}
        @keyframes floraPopIn{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}
      `}</style>
    </>
  )
}

// ─── User Panel — perfectly centered on mobile + laptop ──────────────────────
function UserPanel({ user, onLogout, onClose }: { user: any; onLogout: () => void; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel — fixed, centered via translate */}
      <div
        ref={panelRef}
        className={`fixed z-[100] transition-all duration-300`}
        style={{
          top: '100%',
          left: '50%',
          width: 'min(calc(100vw - 2rem), 360px)',
          transform: visible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.94)',
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">

          {/* Rainbow bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#fbbf24,#f97316,#34d399,#a78bfa,#fbbf24)', backgroundSize: '200% 100%', animation: 'floraSlide 3s linear infinite' }}/>

          <div className="p-5">
            {/* User row */}
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar
                imgUrl={user.avatar || user.picture || user.photo}
                name={user.username || user.name}
                email={user.email}
                size={48}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">
                  {user.username || user.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email || ''}</p>
              </div>
              {/* Close */}
              <button
                onClick={onClose}
                className="ml-1 flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors border-0 cursor-pointer"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <Divider/>

            {/* My Orders */}
            <Link
              href="/orders"
              onClick={onClose}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl mt-2 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors no-underline group"
            >
              <span className="text-gray-400 group-hover:text-orange-500 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8 12.2H15" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 16.2H12.38" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6H14C16 6 16 5 16 4C16 2 15 2 14 2H10C9 2 8 2 8 4C8 6 9 6 10 6Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 4.02C19.33 4.2 21 5.43 21 10V16C21 20 20 22 15 22H9C4 22 3 20 3 16V10C3 5.44 4.67 4.2 8 4.02" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white group-hover:text-orange-500 transition-colors">
                My Orders
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => { onLogout(); onClose() }}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl mt-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-0 bg-transparent cursor-pointer group text-left"
            >
              <span className="text-gray-400 group-hover:text-red-500 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12H3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.85 8.65L2.5 12L5.85 15.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white group-hover:text-red-500 transition-colors">
                Log out
              </span>
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes floraSlide{0%{background-position:0% 0%}100%{background-position:200% 0%}}`}</style>
    </>
  )
}

// ─── AvatarDropdown — main export ─────────────────────────────────────────────
export default function AvatarDropdown({ className }: Props) {
  const [showAuth,  setShowAuth]  = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [user,      setUser]      = useState<any>(null)

  useEffect(() => {
    const saved = localStorage.getItem('floriva_user')
    const token = localStorage.getItem('floriva_token')
    if (saved && token) { try { setUser(JSON.parse(saved)) } catch (_) {} }
  }, [])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'FLORIVA_GOOGLE_SUCCESS') {
        const { token, name, email } = e.data.payload
        localStorage.setItem('floriva_token', token)
        localStorage.setItem('floriva_user', JSON.stringify({ username: name, email }))
        setUser({ username: name, email })
        setShowAuth(false)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleSuccess = useCallback((userData: any, token: string) => {
    if (token) {
      localStorage.setItem('floriva_token', token)
      localStorage.setItem('floriva_user', JSON.stringify(userData))
    }
    setUser(userData)
    setShowAuth(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('floriva_token')
    localStorage.removeItem('floriva_user')
    setUser(null)
    setShowPanel(false)
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className={className}>
        <button
          onClick={() => setShowAuth(true)}
          className="-m-2.5  flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-0 bg-transparent transition-colors"
        >
          <HugeiconsIcon icon={UserCircle02Icon} size={24} color="currentColor" strokeWidth={1.5}/>
        </button>
        {showAuth && (
          <FlorivaAuthModal onClose={() => setShowAuth(false)} onSuccess={handleSuccess}/>
        )}
      </div>
    )
  }

  // ── Logged in ──────────────────────────────────────────────────────────────
  return (
    <div className={className} >
      {/* Avatar button */}
      <button
        onClick={() => setShowPanel(v => !v)}
        className=" border-0 bg-transparent cursor-pointer p-0.5 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        aria-label="Open user menu"
      >
        <UserAvatar
          imgUrl={user.avatar || user.picture || user.photo}
          name={user.username || user.name}
          email={user.email}
          size={36}
        />
      </button>

      {/* Centered user panel */}
      {showPanel && (
        <UserPanel
          user={user}
          onLogout={handleLogout}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  )
}