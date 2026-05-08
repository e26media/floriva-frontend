'use client'

import { useAside } from '@/components/aside'
import * as Headless from '@headlessui/react'
import NextLink, { type LinkProps } from 'next/link'
import React, { forwardRef } from 'react'

export const Link = forwardRef(function Link(
  props: LinkProps & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const closeHeadless = Headless.useClose()
  const aside = useAside()

  const [mounted, setMounted] = React.useState(false)
  const [newHref, setNewHref] = React.useState(props.href)

  React.useEffect(() => {
    setMounted(true)
    if (props.href) {
      const pathname = window.location.pathname
      const hrefStr = props.href.toString()
      const isInternal = hrefStr.startsWith('/') || hrefStr.startsWith('./')

      if (isInternal) {
        // 1. Try to get country from current URL
        const match = pathname.match(/^\/country\/([^/]+)/i)
        let country = match ? match[1] : null
        
        // 2. Fallback to localStorage if not in URL
        if (!country) {
          const saved = localStorage.getItem('floriva_selected_country')
          if (saved) {
            try {
              const parsed = JSON.parse(saved)
              country = parsed.country?.name?.toLowerCase()
            } catch (e) {}
          }
        }
        
        // 3. If we have a country, check if we should prefix
        if (country) {
          const isAlreadyPrefixed = hrefStr.toLowerCase().startsWith('/country/')
          if (!isAlreadyPrefixed) {
            const cleanHref = hrefStr.startsWith('/') ? hrefStr.slice(1) : hrefStr
            const prefixed = `/country/${country}/${cleanHref}`.replace(/\/+$/, '') || '/'
            if (prefixed !== newHref) {
              setNewHref(prefixed as any)
            }
          }
        }
      }
    }
  }, [props.href, newHref])

  return (
    <Headless.DataInteractive>
      <NextLink
        {...props}
        href={newHref}
        ref={ref}
        onClick={(e) => {
          if (props.onClick) {
            props.onClick(e)
          }
          closeHeadless()
          aside.close()
        }}
      />
    </Headless.DataInteractive>
  )
})
