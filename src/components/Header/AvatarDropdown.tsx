'use client'

import { UserCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Divider } from '../Divider'
import { Link } from '../Link'
import backgroundLineSvg from '@/images/floriva/Primary Logo.png'
import { useState, useRef, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';
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
    `${API_BASE}/api/google-login`, 'FlorivaGoogleLogin',
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

// ─── UserAvatar ────────────────────────────────────────────────────────────────
function UserAvatar({ imgUrl, name, email, size = 48 }: {
  imgUrl?: string; name?: string; email?: string; size?: number
}) {
  const [imgError, setImgError] = useState(false)
  const displayName = name || email || ''
  const initial = displayName.trim()[0]?.toUpperCase() || '?'
  const canShowImage = imgUrl && !imgError

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(124,76,163,0.25)',
      background: canShowImage ? 'transparent' : 'linear-gradient(135deg, #EA5A7B, #7C4CA3)',
    }}>
      {canShowImage ? (
        <img src={imgUrl} alt={displayName} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: 'white', fontWeight: 800, fontSize: size * 0.38, fontFamily: 'Georgia, serif', lineHeight: 1, userSelect: 'none' }}>
          {initial}
        </span>
      )}
    </div>
  )
}

// ─── SVGs ──────────────────────────────────────────────────────────────────────
const FlorivaFlower = ({ size = 46 }: { size?: number }) => (
  <svg viewBox="0 0 52 52" width={size} height={size} fill="none">
    <circle cx="26" cy="16" r="8" fill="#EA5A7B" opacity="0.92"/>
    <circle cx="36" cy="26" r="8" fill="#7C4CA3" opacity="0.92"/>
    <circle cx="16" cy="26" r="8" fill="#EA5A7B" opacity="0.75"/>
    <circle cx="26" cy="36" r="8" fill="#7C4CA3" opacity="0.75"/>
    <circle cx="26" cy="26" r="7" fill="white"/>
    <circle cx="26" cy="26" r="4" fill="#EA5A7B"/>
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
  <svg className="animate-spin" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} width="17" height="17" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color === 'white' ? 'rgba(255,255,255,0.25)' : '#e5e7eb'} strokeWidth="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

// ─── Google Loading Screen ──────────────────────────────────────────────────────
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
    <div style={{
      position: 'fixed', 
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px',
      background: 'rgba(0,0,0,0.55)', 
      backdropFilter: 'blur(12px)',
      transition: 'opacity 0.3s', 
      opacity: visible ? 1 : 0,
    }}>
      <div style={{
        background: 'white', 
        borderRadius: '28px', 
        padding: '40px 32px',
        textAlign: 'center', 
        boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
        width: '100%', 
        maxWidth: '320px',
        transition: 'transform 0.4s cubic-bezier(0.34,1.3,0.64,1)',
        transform: visible ? 'scale(1)' : 'scale(0.88)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><FlorivaFlower size={44}/></div>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #EA5A7B, #7C4CA3)',
          margin: '0 auto 12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white', 
          fontSize: '26px', 
          fontWeight: 800, 
          fontFamily: 'Georgia,serif',
          boxShadow: '0 4px 16px rgba(234,90,123,0.4)',
          animation: 'floraPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          {initial}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', fontFamily: 'Georgia,serif' }}>{user.name || 'Welcome back'}</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', marginBottom: '24px' }}>{user.email}</div>
        {phase === 'loading' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
              {['#EA5A7B','#7C4CA3','#EA5A7B','#7C4CA3'].map((c,i) => (
                <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, animation: `floraBounce 1.2s ease-in-out infinite`, animationDelay: `${i*0.14}s` }}/>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Signing you in to Floriva…</p>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg, #EA5A7B, #7C4CA3)',
              margin: '0 auto 12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(234,90,123,0.4)',
              animation: 'floraPopIn 0.42s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#EA5A7B', margin: 0 }}>Welcome to Floriva! 🌸</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes floraBounce{0%,80%,100%{transform:scale(0.6);opacity:0.35}40%{transform:scale(1.1);opacity:1}}
        @keyframes floraPopIn{0%{transform:scale(0);opacity:0}100%{transform:scale(1);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </div>
  )
}

// ─── Auth Modal ────────────────────────────────────────────────────────────────
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
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => setVisible(true))
    return () => {
      document.body.style.overflow = 'unset'
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [])

  const closeModal = () => { 
    setVisible(false); 
    setTimeout(() => {
      document.body.style.overflow = 'unset'
      onClose()
    }, 260) 
  }

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
      const res = await fetch(`${API_BASE}/api/send-otp`, {
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
      const res = await fetch(`${API_BASE}/api/verify-otp`, {
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

  // FIXED: Perfectly centered overlay
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: 'rgba(124,76,163,0.15)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    transition: 'opacity 0.25s',
    opacity: visible ? 1 : 0,
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '420px',
    margin: 'auto', // This ensures centering
    background: 'linear-gradient(145deg, #fff5f8 0%, #ffffff 50%, #f7f3ff 100%)',
    borderRadius: '28px',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(124,76,163,0.22), 0 10px 32px rgba(234,90,123,0.14)',
    transition: 'transform 0.35s cubic-bezier(0.34,1.3,0.64,1), opacity 0.25s',
    transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(28px)',
    opacity: visible ? 1 : 0,
    position: 'relative',
  }

  return (
    <>
      <div style={overlayStyle} onClick={e => e.target === e.currentTarget && closeModal()}>
        <div style={cardStyle}>
          {/* Rainbow bar */}
          <div style={{
            height: '5px', 
            width: '100%',
            background: 'linear-gradient(90deg,#EA5A7B,#c0397a,#7C4CA3,#9b6fd4,#EA5A7B)',
            backgroundSize: '200% 100%',
            animation: 'floraSlide 3s linear infinite',
          }}/>

          {/* Close button */}
          <button
            onClick={closeModal}
            style={{
              position: 'absolute', 
              top: '14px', 
              right: '14px',
              width: '32px', 
              height: '32px', 
              borderRadius: '50%',
              border: 'none', 
              background: 'rgba(0,0,0,0.06)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer', 
              color: '#9ca3af',
              zIndex: 1,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ padding: '28px 28px 32px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                {/* <FlorivaFlower size={46}/> */}
                <img src={backgroundLineSvg.src} alt="Floriva" style={{margin: '0 12px' }} className='h-10'/>
              </div>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {step === 'email' ? 'Sign Up / Login to Floriva!' : 'Check your inbox'}
              </h2>
              <p style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: 0 }}>
                {step === 'email' ? 'Enter your email address to continue' : (
                  <><span>We emailed a 6-digit code to</span><br/><strong style={{ color: '#EA5A7B' }}>{email}</strong></>
                )}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div style={{ 
                marginBottom: '14px', 
                padding: '10px 14px', 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '12px', 
                fontSize: '12px', 
                color: '#dc2626', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* EMAIL STEP */}
            {step === 'email' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: '#9ca3af', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em', 
                    marginBottom: '6px' 
                  }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#d1d5db', 
                      pointerEvents: 'none' 
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      autoFocus
                      placeholder="you@example.com"
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && sendOtp()}
                      style={{
                        width: '100%', 
                        boxSizing: 'border-box',
                        paddingLeft: '42px', 
                        paddingRight: '16px',
                        paddingTop: '13px', 
                        paddingBottom: '13px',
                        borderRadius: '16px', 
                        border: '1.5px solid #e5e7eb',
                        background: 'white', 
                        fontSize: '16px',
                        outline: 'none', 
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                      onFocus={e => { 
                        e.target.style.borderColor = '#EA5A7B'; 
                        e.target.style.boxShadow = '0 0 0 3px rgba(234,90,123,0.15)' 
                      }}
                      onBlur={e => { 
                        e.target.style.borderColor = '#e5e7eb'; 
                        e.target.style.boxShadow = 'none' 
                      }}
                    />
                  </div>
                </div>

                {/* Continue button */}
                <button
                  onClick={sendOtp}
                  disabled={loading}
                  style={{
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '16px', 
                    border: 'none',
                    fontSize: '14px', 
                    fontWeight: 700,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #EA5A7B 0%, #7C4CA3 100%)',
                    color: loading ? '#9ca3af' : 'white',
                    boxShadow: loading ? 'none' : '0 6px 24px rgba(234,90,123,0.38)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  {loading && <Spinner/>}
                  {loading ? 'Sending OTP…' : 'Continue →'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }}/>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }}/>
                </div>

                {/* Google button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={gLoading}
                  style={{
                    width: '100%', 
                    padding: '13px', 
                    borderRadius: '16px',
                    border: '1.5px solid #e5e7eb', 
                    background: 'white',
                    fontSize: '14px', 
                    fontWeight: 600,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '10px',
                    cursor: gLoading ? 'wait' : 'pointer', 
                    color: '#374151',
                    opacity: gLoading ? 0.7 : 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => { 
                    if (!gLoading) { 
                      e.currentTarget.style.borderColor = '#7C4CA3'; 
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,76,163,0.15)' 
                    }
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.borderColor = '#e5e7eb'; 
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' 
                  }}
                >
                  {gLoading ? <Spinner color="#7C4CA3"/> : <GoogleG size={20}/>}
                  <span>{gLoading ? 'Opening Google…' : 'Login with Google'}</span>
                </button>

                <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginBottom: 0 }}>
                  Google's account picker will open in a popup window
                </p>
                <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: '#d1d5db', marginBottom: 0 }}>
                  By continuing you agree to our{' '}
                  <a href="#" style={{ color: '#EA5A7B', textDecoration: 'none' }}>Terms</a>
                  {' '}& {' '}
                  <a href="#" style={{ color: '#EA5A7B', textDecoration: 'none' }}>Privacy</a>
                </p>
              </>
            )}

            {/* OTP STEP */}
            {step === 'otp' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '22px' }} onPaste={pasteOtp}>
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text" 
                      inputMode="numeric" 
                      maxLength={1} 
                      value={d}
                      autoFocus={i === 0}
                      onChange={e => changeOtp(i, e.target.value)}
                      onKeyDown={e => keyOtp(i, e)}
                      style={{
                        width: '48px', 
                        height: '56px',
                        textAlign: 'center', 
                        fontSize: '22px', 
                        fontWeight: 800,
                        fontFamily: 'Georgia,serif', 
                        color: '#111827',
                        borderRadius: '14px', 
                        outline: 'none',
                        border: `2px solid ${d ? '#EA5A7B' : '#e5e7eb'}`,
                        background: d ? '#fff5f8' : 'white',
                        boxShadow: d ? '0 0 0 3px rgba(234,90,123,0.15)' : 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={verifyOtp}
                  disabled={loading || otp.join('').length < 6}
                  style={{
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '16px', 
                    border: 'none',
                    fontSize: '14px', 
                    fontWeight: 700,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    cursor: (loading || otp.join('').length < 6) ? 'not-allowed' : 'pointer',
                    background: (loading || otp.join('').length < 6) ? '#e5e7eb' : 'linear-gradient(135deg, #EA5A7B 0%, #7C4CA3 100%)',
                    color: (loading || otp.join('').length < 6) ? '#9ca3af' : 'white',
                    boxShadow: (loading || otp.join('').length < 6) ? 'none' : '0 6px 24px rgba(234,90,123,0.38)',
                  }}
                >
                  {loading && <Spinner/>}
                  {loading ? 'Verifying…' : 'Verify & Sign In ✓'}
                </button>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                  <button
                    onClick={() => { setStep('email'); setOtp(['','','','','','']); setError('') }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: '#9ca3af', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      padding: 0, 
                      fontSize: '13px' 
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5m7-7-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Change email
                  </button>
                  <button
                    onClick={timer === 0 ? sendOtp : undefined}
                    disabled={timer > 0 || loading}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      padding: 0, 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: timer > 0 ? '#d1d5db' : '#EA5A7B', 
                      cursor: timer > 0 ? 'default' : 'pointer' 
                    }}
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
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
    </>
  )
}

// ─── User Panel ────────────────────────────────────────────────────────────────
function UserPanel({ user, onLogout, onClose }: { user: any; onLogout: () => void; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  useEffect(() => {
    const handle = (e: MouseEvent) => { 
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose() 
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 9990,
          background: 'rgba(124,76,163,0.15)', 
          backdropFilter: 'blur(6px)',
          transition: 'opacity 0.2s', 
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Panel - perfectly centered */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: '100%',
          left: '50%',
          transform: visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.92)',
          width: 'min(calc(100vw - 2rem), 360px)',
          zIndex: 9991,
          transition: 'transform 0.3s cubic-bezier(0.34,1.3,0.64,1), opacity 0.2s',
          opacity: visible ? 1 : 0,
        }}
      >
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          boxShadow: '0 30px 80px rgba(124,76,163,0.25), 0 8px 24px rgba(234,90,123,0.15)' 
        }}>
          <div style={{ 
            height: '5px', 
            width: '100%', 
            background: 'linear-gradient(90deg,#EA5A7B,#c0397a,#7C4CA3,#9b6fd4,#EA5A7B)', 
            backgroundSize: '200% 100%', 
            animation: 'floraSlide 3s linear infinite' 
          }}/>

          <div style={{ padding: '20px' }}>
            {/* User row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <UserAvatar 
                imgUrl={user.avatar || user.picture || user.photo} 
                name={user.username || user.name} 
                email={user.email} 
                size={48}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ 
                  fontWeight: 700, 
                  fontSize: '14px', 
                  color: '#111827', 
                  margin: 0, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {user.username || user.name || 'User'}
                </p>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af', 
                  margin: '2px 0 0', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {user.email || ''}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ 
                  flexShrink: 0, 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '50%', 
                  background: '#f3f4f6', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#9ca3af', 
                  cursor: 'pointer' 
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <Divider/>

            {/* My Orders */}
            <Link
              href="/orders" 
              onClick={onClose}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '10px 8px', 
                borderRadius: '12px', 
                marginTop: '8px', 
                textDecoration: 'none', 
                color: '#1f2937' 
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff5f8' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: '#9ca3af' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8 12.2H15" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 16.2H12.38" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6H14C16 6 16 5 16 4C16 2 15 2 14 2H10C9 2 8 2 8 4C8 6 9 6 10 6Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 4.02C19.33 4.2 21 5.43 21 10V16C21 20 20 22 15 22H9C4 22 3 20 3 16V10C3 5.44 4.67 4.2 8 4.02" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>My Orders</span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => { onLogout(); onClose() }}
              style={{ 
               
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '10px 8px', 
                borderRadius: '12px', 
                marginTop: '4px', 
                border: 'none', 
                background: 'transparent', 
                cursor: 'pointer', 
                color: '#1f2937', 
                textAlign: 'left' ,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff5f8' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: '#9ca3af' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8.9 7.56C9.21 3.96 11.06 2.49 15.11 2.49H15.24C19.71 2.49 21.5 4.28 21.5 8.75V15.27C21.5 19.74 19.71 21.53 15.24 21.53H15.11C11.09 21.53 9.24 20.08 8.91 16.54" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12H3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.85 8.65L2.5 12L5.85 15.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Log out</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes floraSlide{0%{background-position:0% 0%}100%{background-position:200% 0%}}`}</style>
    </>
  )
}

// ─── AvatarDropdown — main export ──────────────────────────────────────────────
export default function AvatarDropdown({ className }: Props) {
  const [showAuth,  setShowAuth]  = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [user,      setUser]      = useState<any>(null)

  useEffect(() => {
    const saved = localStorage.getItem('floriva_user')
    const token = localStorage.getItem('floriva_token')
    if (saved && token) { 
      try { 
        setUser(JSON.parse(saved)) 
      } catch (_) {}
    }
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

  if (!user) {
    return (
      <div className={className}>
        <button
          onClick={() => setShowAuth(true)}
          style={{ 
            margin: '-10px', 
            display: 'flex', 
            cursor: 'pointer', 
            alignItems: 'center', 
            justifyContent: 'center', 
            borderRadius: '50%', 
            padding: '10px', 
            border: 'none', 
            background: 'transparent' 
          }}
        >
          <HugeiconsIcon icon={UserCircle02Icon} size={24} color="currentColor" strokeWidth={1.5}/>
        </button>
        {showAuth && <FlorivaAuthModal onClose={() => setShowAuth(false)} onSuccess={handleSuccess}/>}
      </div>
    )
  }

  return (
    <div className={className}>
      <button
        onClick={() => setShowPanel(v => !v)}
        style={{ 
          border: 'none', 
          background: 'transparent', 
          cursor: 'pointer', 
          padding: '2px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
        aria-label="Open user menu"
      >
        <UserAvatar 
          imgUrl={user.avatar || user.picture || user.photo} 
          name={user.username || user.name} 
          email={user.email} 
          size={36}
        />
      </button>
      {showPanel && <UserPanel user={user} onLogout={handleLogout} onClose={() => setShowPanel(false)}/>}
    </div>
  )
}