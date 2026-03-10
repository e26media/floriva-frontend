"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// =============================================================================
//  TYPES
// =============================================================================
interface ProductImage {
  url?: string;
}

interface Product {
  _id?: string;
  name?: string;
  title?: string;
  images?: (string | ProductImage)[];
  exactPrice?: number | string;
  discountPrice?: number | string;
  color?: string | { name?: string };
  category?: string | { name?: string };
  stock?: number | string;
  deliveryInfo?: string;
}

interface CartItem {
  _id: string;
  productId: Product;
  quantity: number;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

interface CheckoutData {
  items: CartItem[];
  userEmail: string;
  subtotal: number;
}

// =============================================================================
//  API CONFIG
// =============================================================================
const BASE       =process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';
const VIEW_URL   = (email: string) => `${BASE}/api/view/${encodeURIComponent(email)}`;
const UPDATE_URL = (id: string)    => `${BASE}/api/cartupdate/${id}`;
const DELETE_URL = (id: string)    => `${BASE}/api/cartdelete/${id}`;
const IMAGE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';

// =============================================================================
//  HELPERS
// =============================================================================
function getUserEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("floriva_user");
    if (!raw) return "";
    return (JSON.parse(raw) as { email?: string })?.email ?? "";
  } catch {
    return "";
  }
}

function getImgSrc(images?: (string | ProductImage)[]): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const img = images[0];
  if (!img) return null;
  if (typeof img === "string") return img.startsWith("http") ? img : `${IMAGE_BASE}${img}`;
  if (img.url) return img.url.startsWith("http") ? img.url : `${IMAGE_BASE}${img.url}`;
  return null;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
}

function getColorName(c?: string | { name?: string }): string {
  if (!c) return "";
  return typeof c === "object" ? (c.name ?? "") : String(c);
}

function getCatName(c?: string | { name?: string }): string {
  if (!c) return "";
  return typeof c === "object" ? (c.name ?? "") : String(c);
}

function getPrice(p?: Product): number {
  if (!p) return 0;
  const exact = Number(p.exactPrice ?? 0);
  const disc  = Number(p.discountPrice ?? 0);
  return disc > 0 && disc < exact ? disc : exact;
}

function isSale(p?: Product): boolean {
  if (!p) return false;
  return !!(p.discountPrice && Number(p.discountPrice) > 0 && Number(p.discountPrice) < Number(p.exactPrice ?? 0));
}

const COLOR_HEX: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", green: "#22c55e", black: "#171717",
  white: "#e5e7eb", yellow: "#eab308", orange: "#f97316", pink: "#ec4899",
  purple: "#a855f7", gray: "#6b7280", grey: "#6b7280", brown: "#92400e",
  navy: "#1e3a5f", beige: "#d4b896",
};

// =============================================================================
//  SAFE FETCH
// =============================================================================
async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch(url, options);
  const ct  = res.headers.get("content-type") ?? "";
  if (ct.includes("text/html")) {
    throw new Error(`Wrong URL or server down: ${url} returned HTML (${res.status})`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

// =============================================================================
//  SVG ICONS
// =============================================================================
const IcoCheck  = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoTrash  = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IcoMinus  = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoPlus   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5"  y1="12" x2="19" y2="12" />
  </svg>
);
const IcoArrowR = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoArrowL = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const IcoChevR  = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcoInfo   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8"  x2="12"    y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoSpin   = ({ cls }: { cls?: string }) => (
  <svg className={`animate-spin ${cls ?? ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IcoBag    = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const IcoImg    = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcoTruck  = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5"  cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IcoTag    = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

// =============================================================================
//  TOAST
// =============================================================================
function Toast({ t }: { t: ToastState | null }) {
  if (!t) return null;
  const isSuccess = t.type === "success";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-2xl
        ${isSuccess ? "bg-neutral-900 border-l-4 border-emerald-400" : "bg-red-950 border-l-4 border-red-400"}`}
    >
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isSuccess ? "bg-emerald-400/20" : "bg-red-400/20"}`}>
        {isSuccess
          ? <IcoCheck cls="h-3.5 w-3.5 text-emerald-400" />
          : <IcoInfo  cls="h-3.5 w-3.5 text-red-400" />
        }
      </div>
      <span className="max-w-xs">{t.message}</span>
    </div>
  );
}

// =============================================================================
//  QUANTITY CONTROL
// =============================================================================
interface QtyControlProps {
  qty:     number;
  stock?:  number | string;
  loading: boolean;
  onDec:   () => void;
  onInc:   () => void;
}

function QtyControl({ qty, stock, loading, onDec, onInc }: QtyControlProps) {
  const max = stock && Number(stock) > 0 ? Number(stock) : 99;
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <button
        type="button"
        onClick={onDec}
        disabled={qty <= 1 || loading}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
      >
        <IcoMinus cls="h-4 w-4" />
      </button>

      <div className="flex h-10 min-w-[44px] items-center justify-center border-x border-neutral-200 bg-white px-2 dark:border-neutral-700 dark:bg-neutral-800">
        {loading
          ? <IcoSpin cls="h-4 w-4 text-neutral-400" />
          : <span className="text-sm font-bold tabular-nums text-neutral-800 dark:text-neutral-100">{qty}</span>
        }
      </div>

      <button
        type="button"
        onClick={onInc}
        disabled={qty >= max || loading}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white"
      >
        <IcoPlus cls="h-4 w-4" />
      </button>
    </div>
  );
}

// =============================================================================
//  CART ITEM CARD
// =============================================================================
interface CartItemCardProps {
  item:        CartItem;
  isUpdating:  boolean;
  isRemoving:  boolean;
  onUpdateQty: (cartId: string, newQty: number) => void;
  onRemove:    (cartId: string) => void;
}

function CartItemCard({ item, isUpdating, isRemoving, onUpdateQty, onRemove }: CartItemCardProps) {
  const p = item.productId;
  const [imgErr, setImgErr] = useState(false);

  const src       = getImgSrc(p?.images);
  const price     = getPrice(p);
  const sale      = isSale(p);
  const cName     = getColorName(p?.color);
  const catName   = getCatName(p?.category);
  const qty       = Number(item.quantity) || 1;
  const lineTotal = price * qty;
  const origTotal = Number(p?.exactPrice ?? 0) * qty;
  const savings   = sale ? origTotal - lineTotal : 0;
  const cartId    = item._id;

  return (
    <div
      className={`group flex gap-4 py-6 transition-all duration-300 sm:gap-5
        ${isRemoving ? "pointer-events-none scale-95 opacity-10" : "opacity-100 scale-100"}`}
    >
      {/* Product image */}
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 sm:h-36 sm:w-28 dark:border-neutral-800 dark:bg-neutral-900">
        {src && !imgErr ? (
          <Image
            src={src}
            alt={p?.name ?? "Product"}
            fill
            sizes="(max-width:640px) 96px, 112px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IcoImg cls="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
          </div>
        )}
        {sale && (
          <span className="absolute left-2 top-2 rounded-lg bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
            Sale
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {catName && (
          <div className="flex items-center gap-1.5">
            <IcoTag cls="h-3 w-3 shrink-0 text-amber-500" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-500">
              {catName}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100 sm:text-base">
            {p?.name ?? p?.title ?? "Unnamed Product"}
          </h3>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{fmt(lineTotal)}</p>
            {sale && <p className="text-xs tabular-nums text-neutral-400 line-through">{fmt(origTotal)}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cName && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              <span
                className="h-2.5 w-2.5 rounded-full border border-neutral-300 dark:border-neutral-600"
                style={{ backgroundColor: COLOR_HEX[cName.toLowerCase()] ?? "#9ca3af" }}
              />
              <span className="capitalize">{cName}</span>
            </span>
          )}
          {Number(p?.stock ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              <IcoCheck cls="h-3 w-3" /> In Stock ({p?.stock})
            </span>
          )}
          {sale && savings > 0 && (
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              Save {fmt(savings)}
            </span>
          )}
        </div>

        {p?.deliveryInfo && (
          <div className="flex items-center gap-1.5">
            <IcoTruck cls="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{p.deliveryInfo}</p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <QtyControl
              qty={qty}
              stock={p?.stock}
              loading={isUpdating}
              onDec={() => onUpdateQty(cartId, qty - 1)}
              onInc={() => onUpdateQty(cartId, qty + 1)}
            />
            <button
              type="button"
              onClick={() => onRemove(cartId)}
              disabled={isRemoving}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              {isRemoving ? <IcoSpin cls="h-3.5 w-3.5" /> : <IcoTrash cls="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isRemoving ? "Removing…" : "Remove"}</span>
            </button>
          </div>

          {/* Mobile price */}
          <div className="block text-right sm:hidden">
            <p className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{fmt(lineTotal)}</p>
            {sale && <p className="text-xs tabular-nums text-neutral-400 line-through">{fmt(origTotal)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  ORDER SUMMARY
// =============================================================================
interface OrderSummaryProps {
  items:      CartItem[];
  onCheckout: () => void;
}

function OrderSummary({ items, onCheckout }: OrderSummaryProps) {
  const subtotal = items.reduce(
    (acc, item) => acc + getPrice(item.productId) * (Number(item.quantity) || 1),
    0
  );
  const totalSavings = items.reduce((acc, item) => {
    if (!isSale(item.productId)) return acc;
    const disc = getPrice(item.productId);
    const orig = Number(item.productId?.exactPrice ?? 0);
    return acc + (orig - disc) * (Number(item.quantity) || 1);
  }, 0);

  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Order Summary</h2>
      </div>

      <div className="space-y-5 p-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">
              Subtotal{" "}
              <span className="text-neutral-400">
                ({items.length} {items.length === 1 ? "item" : "items"})
              </span>
            </span>
            <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{fmt(subtotal)}</span>
          </div>

          {totalSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-red-500 dark:text-red-400">Discount savings</span>
              <span className="font-semibold tabular-nums text-red-500 dark:text-red-400">-{fmt(totalSavings)}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3 dark:border-neutral-700">
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">Total</span>
            <span className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{fmt(subtotal)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={items.length === 0}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
        >
          Proceed to Checkout <IcoArrowR cls="h-4 w-4" />
        </button>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {["Visa", "Mastercard", "AmEx", "PayPal"].map((label) => (
            <span
              key={label}
              className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex items-start gap-1.5 rounded-xl bg-neutral-50 px-3 py-3 dark:bg-neutral-800/60">
          <IcoInfo cls="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            Learn more about{" "}
            <a href="#" className="font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400">taxes</a>
            {" "}and{" "}
            <a href="#" className="font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400">shipping</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  SKELETON
// =============================================================================
function CartSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
      <div className="flex-1 divide-y divide-neutral-100 dark:divide-neutral-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-5 py-6">
            <div className="h-28 w-24 shrink-0 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800 sm:h-36 sm:w-28" />
            <div className="flex flex-1 flex-col gap-3 py-1">
              <div className="h-3 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-5 w-40 animate-pulse rounded-lg  bg-neutral-100 dark:bg-neutral-800" />
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
              </div>
              <div className="mt-auto flex gap-3 pt-2">
                <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-10 w-20 animate-pulse rounded-lg  bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full shrink-0 lg:w-[360px] xl:w-[390px]">
        <div className="h-[480px] animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

// =============================================================================
//  EMPTY CART
// =============================================================================
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-900">
        <IcoBag cls="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
        Your cart is empty
      </h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-neutral-400 dark:text-neutral-500">
        Looks like you haven&apos;t added anything yet.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-neutral-900"
      >
        <IcoArrowL cls="h-4 w-4" /> Continue Shopping
      </Link>
    </div>
  );
}

// =============================================================================
//  NOT LOGGED IN
// =============================================================================
function NotLoggedIn() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-900">
        <IcoBag cls="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
        Please log in
      </h2>
      <p className="mb-8 max-w-xs text-sm text-neutral-400 dark:text-neutral-500">
        You need to be logged in to view your cart.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-neutral-900"
      >
        Go to Login <IcoArrowR cls="h-4 w-4" />
      </Link>
    </div>
  );
}

// =============================================================================
//  MAIN CART PAGE
// =============================================================================
export default function CartPage() {
  const router = useRouter();

  const [userEmail,   setUserEmail]   = useState<string>("");
  const [cartItems,   setCartItems]   = useState<CartItem[]>([]);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [toast,       setToast]       = useState<ToastState | null>(null);

  useEffect(() => {
    const email = getUserEmail();
    setUserEmail(email);
    if (!email) setLoading(false);
  }, []);

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchCart = useCallback(async (email: string) => {
    if (!email) return;
    setLoading(true);
    try {
      const { ok, status, json } = await apiFetch(VIEW_URL(email));
      if (!ok) throw new Error((json.message as string) ?? `HTTP ${status}`);
      setCartItems(json.success && Array.isArray(json.data) ? (json.data as CartItem[]) : []);
    } catch (err) {
      showToast(`Failed to load cart: ${(err as Error).message}`, "error");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (userEmail) fetchCart(userEmail);
  }, [userEmail, fetchCart]);

  // ── Update quantity ─────────────────────────────────────────────────────────
  const handleUpdateQty = useCallback(async (cartId: string, newQty: number) => {
    if (!cartId || newQty < 1) return;

    setCartItems((prev) =>
      prev.map((i) => i._id === cartId ? { ...i, quantity: newQty } : i)
    );
    setUpdatingIds((prev) => new Set(prev).add(cartId));

    try {
      const { ok, json } = await apiFetch(UPDATE_URL(cartId), {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ quantity: newQty }),
      });
      if (!ok || !json.success) {
        showToast((json.message as string) ?? "Update failed", "error");
        fetchCart(userEmail);
      }
    } catch (err) {
      showToast(`Failed to update: ${(err as Error).message}`, "error");
      fetchCart(userEmail);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartId);
        return next;
      });
    }
  }, [userEmail, fetchCart, showToast]);

  // ── Remove item ─────────────────────────────────────────────────────────────
  const handleRemove = useCallback(async (cartId: string) => {
    if (!cartId) return;

    setRemovingIds((prev) => new Set(prev).add(cartId));

    const timer = setTimeout(() => {
      setCartItems((prev) => prev.filter((i) => i._id !== cartId));
    }, 300);

    try {
      const { json } = await apiFetch(DELETE_URL(cartId), { method: "DELETE" });
      if (json.success) {
        showToast("Item removed from cart");
      } else {
        clearTimeout(timer);
        showToast((json.message as string) ?? "Remove failed", "error");
        fetchCart(userEmail);
      }
    } catch (err) {
      clearTimeout(timer);
      showToast(`Failed to remove: ${(err as Error).message}`, "error");
      fetchCart(userEmail);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartId);
        return next;
      });
    }
  }, [userEmail, fetchCart, showToast]);

  // ── Proceed to checkout ─────────────────────────────────────────────────────
  const handleCheckout = useCallback(() => {
    const checkoutData: CheckoutData = {
      items: cartItems,
      userEmail,
      subtotal: cartItems.reduce(
        (acc, item) => acc + getPrice(item.productId) * (Number(item.quantity) || 1),
        0
      ),
    };
    sessionStorage.setItem("checkout_data", JSON.stringify(checkoutData));
    router.push("/checkout");
  }, [cartItems, userEmail, router]);

  const totalItems = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Header */}
        <div className="mb-8 border-b border-neutral-200 pb-8 dark:border-neutral-800">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs">
            <Link href="/" className="text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300">
              Home
            </Link>
            <IcoChevR cls="h-3 w-3 text-neutral-300 dark:text-neutral-700" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Shopping Cart</span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                Shopping Cart
              </h1>
              {!loading && userEmail && (
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {cartItems.length === 0
                    ? "Your cart is empty"
                    : `${totalItems} ${totalItems === 1 ? "item" : "items"} · ${cartItems.length} ${cartItems.length === 1 ? "product" : "products"}`
                  }
                </p>
              )}
            </div>

            {!loading && cartItems.length > 0 && (
              <Link
                href="/"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 sm:flex"
              >
                <IcoArrowL cls="h-3.5 w-3.5" /> Continue Shopping
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <CartSkeleton />
        ) : !userEmail ? (
          <NotLoggedIn />
        ) : cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

            {/* Items list */}
            <div className="min-w-0 flex-1">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {cartItems.map((item, idx) => (
                  <CartItemCard
                    key={item._id ?? idx}
                    item={item}
                    isUpdating={updatingIds.has(item._id)}
                    isRemoving={removingIds.has(item._id)}
                    onUpdateQty={handleUpdateQty}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              <div className="mt-8 flex justify-center lg:hidden">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <IcoArrowL cls="h-3.5 w-3.5" /> Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order summary */}
            <div className="w-full shrink-0 lg:w-[360px] xl:w-[390px]">
              <OrderSummary items={cartItems} onCheckout={handleCheckout} />
            </div>
          </div>
        )}
      </main>

      <Toast t={toast} />
    </div>
  );
}