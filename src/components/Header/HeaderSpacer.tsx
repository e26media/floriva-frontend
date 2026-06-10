'use client'

import { useEffect, useState } from 'react'

const HEADER_ID = 'floriva-site-header'

export default function HeaderSpacer() {
  const [height, setHeight] = useState(176)

  useEffect(() => {
    const el = document.getElementById(HEADER_ID)
    if (!el) return

    const update = () => setHeight(el.offsetHeight)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return <div style={{ height }} aria-hidden="true" className="shrink-0" />
}

export { HEADER_ID }
