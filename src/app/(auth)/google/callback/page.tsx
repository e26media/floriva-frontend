// src/app/auth/google/callback/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const FlorivaFlower = ({ size = 52 }: { size?: number }) => (
  <svg viewBox="0 0 52 52" width={size} height={size} fill="none">
    <circle cx="26" cy="16" r="8" fill="#fbbf24" opacity="0.92"/>
    <circle cx="36" cy="26" r="8" fill="#34d399" opacity="0.92"/>
    <circle cx="16" cy="26" r="8" fill="#f97316" opacity="0.92"/>
    <circle cx="26" cy="36" r="8" fill="#a78bfa" opacity="0.92"/>
    <circle cx="26" cy="26" r="7" fill="white"/>
    <circle cx="26" cy="26" r="4" fill="#fbbf24"/>
  </svg>
)

function CallbackContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [phase,    setPhase]    = useState<'loading' | 'success' | 'error'>('loading')
  const [userName, setUserName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPopup,  setIsPopup]  = useState(false)

  useEffect(() => {
    const error   = searchParams.get('error')
    const token   = searchParams.get('token')
    const name    = searchParams.get('name')  || ''
    const email   = searchParams.get('email') || ''
    const success = searchParams.get('success')
    const popup   = typeof window !== 'undefined' && !!window.opener

    const timer = setTimeout(() => {
      setIsPopup(popup)

      if (error) {
        const msg = decodeURIComponent(error)
        setErrorMsg(msg)
        setPhase('error')
        if (popup) {
          window.opener.postMessage({ type: 'FLORIVA_GOOGLE_ERROR', error: msg }, window.location.origin)
          setTimeout(() => window.close(), 2500)
        }
        return
      }

      if (success === 'true' && token) {
        setUserName(name || email)
        setPhase('success')
        localStorage.setItem('floriva_token', token)
        localStorage.setItem('floriva_user', JSON.stringify({ username: name, email }))

        if (popup) {
          window.opener.postMessage(
            { type: 'FLORIVA_GOOGLE_SUCCESS', payload: { token, name, email } },
            window.location.origin
          )
          setTimeout(() => window.close(), 1800)
        } else {
          setTimeout(() => router.replace('/'), 1800)
        }
        return
      }

      setErrorMsg('Authentication failed. Please try again.')
      setPhase('error')
      if (popup) {
        window.opener.postMessage({ type: 'FLORIVA_GOOGLE_ERROR', error: 'Authentication failed.' }, window.location.origin)
        setTimeout(() => window.close(), 2500)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [searchParams, router])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(145deg,#fffdf9 0%,#fff 55%,#f0fdf6 100%)', fontFamily:'Georgia,serif' }}>
      <div style={{ position:'fixed', top:0, left:0, right:0, height:5, background:'linear-gradient(90deg,#fbbf24,#f97316,#34d399,#a78bfa,#fbbf24)', backgroundSize:'200% 100%', animation:'slideBar 3s linear infinite' }}/>

      <div style={{ textAlign:'center', background:'#fff', borderRadius:24, padding:'48px 52px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', maxWidth:360, width:'100%', margin:16, animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <FlorivaFlower size={48}/>
        </div>

        {phase === 'loading' && (
          <>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 8px' }}>Completing sign in…</h2>
            <p style={{ fontSize:13, color:'#9ca3af', marginBottom:26 }}>Just a moment</p>
            <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
              {['#4285F4','#EA4335','#FBBC05','#34A853'].map((c,i) => (
                <div key={i} style={{ width:11, height:11, borderRadius:'50%', background:c, animation:'bounce 1.2s ease-in-out infinite', animationDelay:`${i*0.15}s` }}/>
              ))}
            </div>
          </>
        )}

        {phase === 'success' && (
          <>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#34d399,#10b981)', margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(52,211,153,0.4)', animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#10b981', margin:'0 0 6px' }}>You are in! 🌸</h2>
            <p style={{ fontSize:15, color:'#6b7280', margin:'0 0 6px' }}>Welcome{userName ? `, ${userName}` : ' back'}!</p>
            <p style={{ fontSize:12, color:'#d1d5db', marginTop:14 }}>
              {isPopup ? 'This window will close automatically…' : 'Redirecting you to home…'}
            </p>
          </>
        )}

        {phase === 'error' && (
          <>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#f87171,#ef4444)', margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(239,68,68,0.35)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#ef4444', margin:'0 0 8px' }}>Sign in failed</h2>
            <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 20px' }}>{errorMsg || 'Something went wrong. Please try again.'}</p>
            <button onClick={() => router.replace('/')} style={{ padding:'11px 28px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#fbbf24,#f97316)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(249,115,22,0.35)' }}>
              Back to Home
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes bounce   { 0%,80%,100%{transform:scale(0.6);opacity:0.35} 40%{transform:scale(1.1);opacity:1} }
        @keyframes popIn    { 0%{transform:scale(0.88);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes slideBar { 0%{background-position:0% 0%} 100%{background-position:200% 0%} }
      `}</style>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <CallbackContent/>
    </Suspense>
  )
}