'use client'

import { ShoppingCart02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRouter } from 'next/navigation'
import { useAside } from '../aside'

export default function CartBtn() {
  const router = useRouter()
  const { open: openAside } = useAside()

  return (
    <button
      onClick={() => router.push('/cart')}
      className="relative -m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-0 dark:hover:bg-neutral-800"
    >
      <HugeiconsIcon
        icon={ShoppingCart02Icon}
        size={24}
        color="currentColor"
        strokeWidth={1.5}
      />
    </button>
  )
}