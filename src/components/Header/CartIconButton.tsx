'use client';

import { ShoppingCart02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useCartCount } from '@/hooks/useCartCount';

type Props = {
  onClick: () => void;
  title?: string;
  className?: string;
};

export default function CartIconButton({
  onClick,
  title = 'Cart',
  className = 'relative -m-2.5 flex cursor-pointer items-center justify-center rounded-full p-2.5 hover:bg-neutral-100 focus-visible:outline-0 dark:hover:bg-neutral-800',
}: Props) {
  const count = useCartCount();

  return (
    <button type="button" onClick={onClick} title={title} className={className}>
      <HugeiconsIcon icon={ShoppingCart02Icon} size={24} color="currentColor" strokeWidth={1.5} />
      {count > 0 && (
        <span className="absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EA5A7B] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-neutral-900">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
