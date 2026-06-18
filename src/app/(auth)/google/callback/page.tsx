// src/app/auth/google/callback/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { completeGoogleLogin } from '@/lib/googleAuthPopup'

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

  useEffect(() => {
    const error   = searchParams.get('error')
    const token   = searchParams.get('token')
    const name    = searchParams.get('name')  || ''
    const email   = searchParams.get('email') || ''
    const countrySlug = searchParams.get('countrySlug') || ''
    const success = searchParams.get('success')

    const timer = setTimeout(() => {
      if (error) {
        setErrorMsg(decodeURIComponent(error))
        setPhase('error')
        return
      }

      if (success === 'true' && token) {
        setUserName(name || email)
        setPhase('success')
        completeGoogleLogin({
          token,
          name,
          email,
          countrySlug: countrySlug || undefined,
        }).catch(() => router.replace('/'))
        return
      }

      setErrorMsg('Authentication failed. Please try again.')
      setPhase('error')
    }, 0)

    return () => clearTimeout(timer)
  }, [searchParams, router])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(145deg,#fffdf9 0%,#fff 55%,#f0fdf6 100%)', fontFamily:'Georgia,serif' }}>
      <div style={{ position:'fixed', top:0, left:0, right:0, height:5, background:'linear-gradient(90deg,#fbbf24,#f97316,#34d399,#a78bfa,#fbbf24)', backgroundSize:'200% 100%', animation:'slideBar 3s linear infinite' }}/>

      <div style={{ textAlign:'center', background:'#fff', borderRadius:24, padding:'48px 52px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', maxWidth:360, width:'100%', margin:16 }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
          <FlorivaFlower size={48}/>
        </div>

        {phase === 'loading' && (
          <>
            <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 8px' }}>Completing sign in…</h2>
            <p style={{ fontSize:13, color:'#9ca3af', marginBottom:26 }}>Just a moment</p>
          </>
        )}

        {phase === 'success' && (
          <>
            <h2 style={{ fontSize:22, fontWeight:700, color:'#10b981', margin:'0 0 6px' }}>You are in! 🌸</h2>
            <p style={{ fontSize:15, color:'#6b7280', margin:'0 0 6px' }}>Welcome{userName ? `, ${userName}` : ' back'}!</p>
            <p style={{ fontSize:12, color:'#d1d5db', marginTop:14 }}>Taking you to the home page…</p>
          </>
        )}

        {phase === 'error' && (
          <>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#ef4444', margin:'0 0 8px' }}>Sign in failed</h2>
            <p style={{ fontSize:13, color:'#6b7280', margin:'0 0 20px' }}>{errorMsg}</p>
            <button onClick={() => router.replace('/')} style={{ padding:'11px 28px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#fbbf24,#f97316)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer' }}>
              Back to Home
            </button>
          </>
        )}
      </div>
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
