// app/orders/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

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
  handle?: string;
  images?: (string | ProductImage)[];
  exactPrice?: number | string;
  discountPrice?: number | string;
  color?: string | { name?: string };
  subCategory?: string;
}

interface OrderProduct {
  product: Product;
  quantity: number;
}

interface ShippingAddress {
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  stateProvinceRegionId?: string;
  postalCode?: string;
  country?: string;
}

interface Order {
  _id: string;
  products: OrderProduct[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cash_on_delivery" | "online";
  paymentStatus: "unpaid" | "paid" | "refunded" | "failed";
  shippingAddress: ShippingAddress;
  userEmail: string;
  createdAt: string;
  country?: string;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

type FilterKey = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled";

// =============================================================================
//  API CONFIG
// =============================================================================
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';
const USER_ORDERS = () => `${BASE}/api/orderview`;
const CANCEL_ORDER = (id: string) => `${BASE}/api/orderdelete/${id}`;
const IMAGE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';

// Auto-refresh interval in milliseconds (5 seconds)
const REFRESH_INTERVAL = 5000;

// =============================================================================
//  COUNTRY CONFIGURATION WITH CURRENCY SYMBOLS
// =============================================================================
interface CountryConfig {
  name: string;
  code: string;
  currency: string;
  symbol: string;
}

// Currency symbols mapping
const getCurrencySymbol = (countryCode: string): string => {
  const currencyMap: Record<string, string> = {
    'usd': '$',
    'eur': '€',
    'gbp': '£',
    'jpy': '¥',
    'aud': 'A$',
    'cad': 'C$',
    'chf': 'Fr',
    'cny': '¥',
    'inr': '₹',
    'aed': 'د.إ',
    'qar': '﷼',
    'sar': '﷼',
    'sgd': 'S$',
    'nzd': 'NZ$',
    'hkd': 'HK$',
    'mxn': '$',
    'brl': 'R$',
    'rub': '₽',
    'krw': '₩',
    'try': '₺',
  };
  return currencyMap[countryCode.toLowerCase()] || '$';
};

// Country to currency mapping
const getCountryCurrency = (countryName: string): string => {
  const countryCurrencyMap: Record<string, string> = {
    'united states': 'USD',
    'usa': 'USD',
    'us': 'USD',
    'canada': 'CAD',
    'uk': 'GBP',
    'united kingdom': 'GBP',
    'australia': 'AUD',
    'india': 'INR',
    'qatar': 'QAR',
    'uae': 'AED',
    'united arab emirates': 'AED',
    'saudi arabia': 'SAR',
    'singapore': 'SGD',
    'new zealand': 'NZD',
    'japan': 'JPY',
    'south korea': 'KRW',
    'brazil': 'BRL',
    'mexico': 'MXN',
    'russia': 'RUB',
    'turkey': 'TRY',
    'switzerland': 'CHF',
    'europe': 'EUR',
    'germany': 'EUR',
    'france': 'EUR',
    'italy': 'EUR',
    'spain': 'EUR',
  };
  
  const normalized = countryName.toLowerCase().trim();
  return countryCurrencyMap[normalized] || 'USD';
};

// Format amount with country-specific currency
const formatCurrency = (amount: number, countryName?: string): string => {
  const currencyCode = countryName ? getCountryCurrency(countryName) : 'USD';
  const symbol = getCurrencySymbol(currencyCode);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format country name for display
function formatCountryName(country: string): string {
  return country.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// =============================================================================
//  HELPERS
// =============================================================================
function getUserEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("floriva_user");
    if (!raw) return "";
    return (JSON.parse(raw) as { email?: string })?.email ?? "";
  } catch { return ""; }
}

function getImgSrc(images?: (string | ProductImage)[]): string | null {
  if (!images?.length) return null;
  const img = images[0];
  if (!img) return null;
  if (typeof img === "object") {
    if (!img.url) return null;
    return img.url.startsWith("http") ? img.url : `${IMAGE_BASE}${img.url}`;
  }
  return img.startsWith("http") ? img : `${IMAGE_BASE}${img}`;
}

function getPrice(p?: Product): number {
  if (!p) return 0;
  const exact = Number(p.exactPrice ?? 0);
  const disc = Number(p.discountPrice ?? 0);
  return disc > 0 && disc < exact ? disc : exact;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// =============================================================================
//  STATUS / PAYMENT CONFIG
// =============================================================================
const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  pending: { label: "Pending", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
  processing: { label: "Processing", dot: "bg-blue-400", text: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
  shipped: { label: "Shipped", dot: "bg-violet-400", text: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800" },
  delivered: { label: "Delivered", dot: "bg-emerald-400", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  cancelled: { label: "Cancelled", dot: "bg-red-400", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
};

const PAYMENT_CONFIG: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "Unpaid", cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  paid: { label: "Paid", cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  refunded: { label: "Refunded", cls: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700" },
  failed: { label: "Failed", cls: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
};

// =============================================================================
//  SVG ICONS
// =============================================================================
const IcoSpin = ({ c }: { c?: string }) => (
  <svg className={`animate-spin ${c ?? ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IcoCheck = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoX = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IcoBag = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const IcoTruck = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IcoCash = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);
const IcoCard = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IcoImg = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcoTrash = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IcoChevD = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcoChevU = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IcoRefresh = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IcoLocation = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// =============================================================================
//  TOAST
// =============================================================================
function Toast({ t }: { t: ToastState | null }) {
  if (!t) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-2xl
        ${t.type === "success" ? "bg-neutral-900 border-l-4 border-emerald-400" : "bg-red-950 border-l-4 border-red-400"}`}
    >
      {t.type === "success"
        ? <IcoCheck c="h-4 w-4 text-emerald-400 shrink-0" />
        : <IcoX c="h-4 w-4 text-red-400 shrink-0" />
      }
      <span className="max-w-xs leading-snug">{t.message}</span>
    </div>
  );
}

// =============================================================================
//  CANCEL MODAL
// =============================================================================
interface CancelModalProps {
  order: Order;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

function CancelModal({ order, onConfirm, onClose, loading }: CancelModalProps) {
  const country = order.shippingAddress?.country;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
            <IcoTrash c="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Cancel Order?</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              This will cancel order{" "}
              <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                #{order._id.slice(-8).toUpperCase()}
              </span>{" "}
              and restore product stock.
              {order.paymentMethod === "online" && order.paymentStatus === "paid" && (
                <span className="mt-1 block text-emerald-600 dark:text-emerald-400">
                  A refund will be issued automatically.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mx-6 mb-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Total</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(order.totalAmount, country)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Items</span>
            <span className="text-neutral-700 dark:text-neutral-300">{order.products?.length ?? 0} product(s)</span>
          </div>
        </div>

        <div className="flex gap-3 border-t border-neutral-100 p-6 pt-4 dark:border-neutral-800">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <><IcoSpin c="h-4 w-4" /> Cancelling…</> : <><IcoTrash c="h-4 w-4" /> Yes, Cancel</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  PRODUCT ROW inside expanded order
// =============================================================================
function ProductRow({ item, country }: { item: OrderProduct; country?: string }) {
  const p = item.product;
  const [imgErr, setImgErr] = useState(false);
  const src = getImgSrc(p?.images);
  const price = getPrice(p);
  const qty = item.quantity || 1;

  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        {src && !imgErr ? (
          <Image
            src={src}
            alt={p?.name ?? "Product"}
            fill
            sizes="64px"
            className="object-cover object-center"
            onError={() => setImgErr(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IcoImg c="h-6 w-6 text-neutral-300 dark:text-neutral-700" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {p?.name ?? p?.title ?? "Product"}
            </p>
            {(p?.color || p?.subCategory) && (
              <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                {typeof p?.color === "object" ? p?.color?.name : p?.color}
                {p?.subCategory && (
                  <><span className="mx-1.5">·</span>{p.subCategory}</>
                )}
              </p>
            )}
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatCurrency(price * qty, country)}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {formatCurrency(price, country)} × {qty}
          </span>
          {p?.handle && (
            <Link
              href={`/products/${p.handle}`}
              className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Leave review
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  SINGLE ORDER CARD
// =============================================================================
interface OrderCardProps {
  order: Order;
  onCancel: (order: Order) => void;
}

function OrderCard({ order, onCancel }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const country = order.shippingAddress?.country;

  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const paymentCfg = PAYMENT_CONFIG[order.paymentStatus] ?? PAYMENT_CONFIG.unpaid;

  const canCancel = ["pending", "processing"].includes(order.status);
  const shortId = order._id.slice(-8).toUpperCase();
  const itemCount = order.products?.reduce((a, i) => a + (i.quantity || 1), 0) ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">

      {/* Order header */}
      <div className="flex flex-col gap-4 bg-neutral-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:bg-neutral-800/40">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${statusCfg.bg} ${statusCfg.border}`}>
            {order.status === "delivered" && <IcoCheck c={`h-4 w-4 ${statusCfg.text}`} />}
            {order.status === "cancelled" && <IcoX c={`h-4 w-4 ${statusCfg.text}`} />}
            {order.status === "shipped" && <IcoTruck c={`h-4 w-4 ${statusCfg.text}`} />}
            {!["delivered", "cancelled", "shipped"].includes(order.status) && (
              <IcoBag c={`h-4 w-4 ${statusCfg.text}`} />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100">
                #{shortId}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${paymentCfg.cls}`}>
                {order.paymentMethod === "cash_on_delivery"
                  ? <IcoCash c="h-2.5 w-2.5" />
                  : <IcoCard c="h-2.5 w-2.5" />
                }
                {order.paymentMethod === "cash_on_delivery" ? "COD" : "Online"} · {paymentCfg.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-400 dark:text-neutral-500">
              <span>{timeAgo(order.createdAt)}</span>
              <span>·</span>
              <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
              <span>·</span>
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {formatCurrency(order.totalAmount, country)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {canCancel && (
            <button
              onClick={() => onCancel(order)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <IcoTrash c="h-3.5 w-3.5" /> Cancel
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            {expanded
              ? <><IcoChevU c="h-3.5 w-3.5" /> Hide</>
              : <><IcoChevD c="h-3.5 w-3.5" /> Details</>
            }
          </button>
        </div>
      </div>

      {/* Expandable section */}
      {expanded && (
        <div>
          <div className="grid grid-cols-1 gap-4 border-t border-neutral-100 p-5 sm:grid-cols-2 sm:p-6 dark:border-neutral-800">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                Shipping To
              </p>
              <div className="space-y-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                <p>{order.shippingAddress?.streetAddress1}</p>
                {order.shippingAddress?.streetAddress2 && (
                  <p>{order.shippingAddress.streetAddress2}</p>
                )}
                <p>
                  {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.stateProvinceRegionId}{" "}
                  {order.shippingAddress?.postalCode}
                </p>
                <p className="font-semibold">{order.shippingAddress?.country}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
                Order Info
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400 dark:text-neutral-500">Email</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{order.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 dark:text-neutral-500">Payment</span>
                  <span className="text-neutral-700 dark:text-neutral-300 capitalize">
                    {order.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : "Online"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 dark:text-neutral-500">Order ID</span>
                  <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{order._id}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-neutral-200 pt-1.5 dark:border-neutral-700">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Total</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(order.totalAmount, country)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-100 p-5 sm:p-6 dark:border-neutral-800">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600">
              Products ({order.products?.length ?? 0})
            </p>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {order.products?.map((item, i) => (
                <ProductRow key={item.product?._id ?? i} item={item} country={country} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
//  SKELETON
// =============================================================================
function Skeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-4 bg-neutral-50 p-5 dark:bg-neutral-800/40">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-3 w-48 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
//  EMPTY STATE
// =============================================================================
function EmptyOrders({ country }: { country?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-900">
        <IcoBag c="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-neutral-800 dark:text-neutral-200">No orders yet</h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-neutral-400 dark:text-neutral-500">
        {country 
          ? `You haven't placed any orders in ${formatCountryName(country)}.`
          : "You haven't placed any orders. Start shopping to see your orders here."
        }
      </p>
      <Link
        href={country ? `/?country=${country}` : "/"}
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
      >
        Start Shopping
      </Link>
    </div>
  );
}

// =============================================================================
//  NOT LOGGED IN
// =============================================================================
function NotLoggedIn({ country }: { country?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-900">
        <IcoBag c="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-neutral-800 dark:text-neutral-200">Please log in</h2>
      <p className="mb-8 text-sm text-neutral-400 dark:text-neutral-500">
        You need to be logged in to view your orders.
      </p>
      <Link
        href={country ? `/login?redirect=/orders?country=${country}` : "/login"}
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
      >
        Go to Login
      </Link>
    </div>
  );
}

// =============================================================================
//  DYNAMIC COUNTRY FILTER COMPONENT
// =============================================================================
interface CountryFilterProps {
  currentCountry?: string;
  onCountryChange: (country: string | undefined) => void;
  availableCountries: Array<{ name: string; count: number; currency: string }>;
}

function CountryFilter({ currentCountry, onCountryChange, availableCountries }: CountryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = availableCountries.find(c => c.name.toLowerCase() === currentCountry?.toLowerCase());

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      >
        <IcoLocation c="h-4 w-4" />
        {selectedCountry ? `${selectedCountry.name} (${selectedCountry.currency})` : 'All Countries'}
        <IcoChevD c="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800 z-10">
          <button
            onClick={() => {
              onCountryChange(undefined);
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 ${
              !currentCountry ? 'bg-neutral-100 dark:bg-neutral-700 font-semibold' : 'text-neutral-700 dark:text-neutral-300'
            }`}
          >
            All Countries ({availableCountries.reduce((sum, c) => sum + c.count, 0)})
          </button>
          {availableCountries.map((country) => (
            <button
              key={country.name}
              onClick={() => {
                onCountryChange(country.name.toLowerCase());
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700 flex justify-between items-center ${
                currentCountry?.toLowerCase() === country.name.toLowerCase() 
                  ? 'bg-neutral-100 dark:bg-neutral-700 font-semibold' 
                  : 'text-neutral-700 dark:text-neutral-300'
              }`}
            >
              <span>{country.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 dark:text-neutral-500">{country.currency}</span>
                <span className="text-xs bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded-full">
                  {country.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
//  MAIN ORDERS PAGE
// =============================================================================
export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userEmail, setUserEmail] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  
  // Get country from URL query parameter
  const countryParam = searchParams.get('country') || undefined;

  // Ref to pause auto-refresh while cancel modal is open
  const isMutating = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Extract unique countries with counts and currency from orders
  const availableCountries = useMemo(() => {
    const countryMap = new Map<string, { name: string; count: number; currency: string }>();
    
    orders.forEach(order => {
      const countryName = order.shippingAddress?.country;
      if (countryName) {
        const normalizedName = formatCountryName(countryName);
        const currencyCode = getCountryCurrency(countryName);
        const currencySymbol = getCurrencySymbol(currencyCode);
        
        if (countryMap.has(normalizedName)) {
          const existing = countryMap.get(normalizedName)!;
          countryMap.set(normalizedName, { 
            ...existing, 
            count: existing.count + 1 
          });
        } else {
          countryMap.set(normalizedName, { 
            name: normalizedName, 
            count: 1, 
            currency: currencySymbol 
          });
        }
      }
    });
    
    // Sort countries alphabetically
    return Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const email = getUserEmail();
    setUserEmail(email);
    if (!email) setLoading(false);
  }, []);

  // Handle country change - update URL without full page reload
  const handleCountryChange = useCallback((country: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (country) {
      params.set('country', country);
    } else {
      params.delete('country');
    }
    router.push(`/orders?${params.toString()}`);
  }, [router, searchParams]);

  // Function to fetch and filter orders by country
  const fetchOrders = useCallback(async (email: string, country?: string) => {
    if (!email) return;
    setLoading(true);
    try {
      const url = USER_ORDERS();
      const res = await fetch(url);
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) {
        throw new Error(`Backend returned HTML — check server is running at ${url}`);
      }
      const json = (await res.json()) as { success?: boolean; data?: any[]; message?: string };
      
      if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
      
      // Transform the API response to match our Order interface
      let allOrders: Order[] = (json.data || []).map((item: any) => ({
        _id: item._id,
        products: (item.products || []).map((p: any) => ({
          product: typeof p.product === 'object' ? p.product : {},
          quantity: p.quantity
        })),
        totalAmount: item.totalAmount,
        status: item.status,
        paymentMethod: item.paymentMethod,
        paymentStatus: item.paymentStatus,
        shippingAddress: item.shippingAddress,
        userEmail: item.userEmail,
        createdAt: item.createdAt,
        country: item.shippingAddress?.country
      }));
      
      // Filter by country if provided
      if (country) {
        const countryLower = country.toLowerCase();
        allOrders = allOrders.filter(order => 
          order.shippingAddress?.country?.toLowerCase() === countryLower
        );
      }
      
      // Sort by creation date (newest first)
      const sorted = allOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(sorted);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Silent background fetch
  const silentFetch = useCallback(async (email: string, country?: string) => {
    if (!email || isMutating.current) return;
    try {
      const url = USER_ORDERS();
      const res = await fetch(url);
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) return;
      const json = (await res.json()) as { success?: boolean; data?: any[]; message?: string };
      if (!res.ok || !json.success) return;
      
      // Transform and filter orders
      let allOrders: Order[] = (json.data || []).map((item: any) => ({
        _id: item._id,
        products: (item.products || []).map((p: any) => ({
          product: typeof p.product === 'object' ? p.product : {},
          quantity: p.quantity
        })),
        totalAmount: item.totalAmount,
        status: item.status,
        paymentMethod: item.paymentMethod,
        paymentStatus: item.paymentStatus,
        shippingAddress: item.shippingAddress,
        userEmail: item.userEmail,
        createdAt: item.createdAt,
        country: item.shippingAddress?.country
      }));
      
      if (country) {
        const countryLower = country.toLowerCase();
        allOrders = allOrders.filter(order => 
          order.shippingAddress?.country?.toLowerCase() === countryLower
        );
      }
      
      const sorted = allOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch {
      // Silent fail
    }
  }, []);

  // Manual refresh
  const manualRefresh = useCallback(async () => {
    if (!userEmail || refreshing) return;
    setRefreshing(true);
    try {
      const url = USER_ORDERS();
      const res = await fetch(url);
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) throw new Error("Backend error");
      const json = (await res.json()) as { success?: boolean; data?: any[]; message?: string };
      if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);
      
      let allOrders: Order[] = (json.data || []).map((item: any) => ({
        _id: item._id,
        products: (item.products || []).map((p: any) => ({
          product: typeof p.product === 'object' ? p.product : {},
          quantity: p.quantity
        })),
        totalAmount: item.totalAmount,
        status: item.status,
        paymentMethod: item.paymentMethod,
        paymentStatus: item.paymentStatus,
        shippingAddress: item.shippingAddress,
        userEmail: item.userEmail,
        createdAt: item.createdAt,
        country: item.shippingAddress?.country
      }));
      
      if (countryParam) {
        const countryLower = countryParam.toLowerCase();
        allOrders = allOrders.filter(order => 
          order.shippingAddress?.country?.toLowerCase() === countryLower
        );
      }
      
      const sorted = allOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
      showToast("Orders refreshed");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setRefreshing(false);
    }
  }, [userEmail, refreshing, showToast, countryParam]);

  // Initial load
  useEffect(() => {
    if (userEmail) {
      fetchOrders(userEmail, countryParam);
    }
  }, [userEmail, fetchOrders, countryParam]);

  // Auto-refresh every REFRESH_INTERVAL ms
  useEffect(() => {
    if (!userEmail) return;

    intervalRef.current = setInterval(() => {
      silentFetch(userEmail, countryParam);
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userEmail, silentFetch, countryParam]);

  // Pause auto-refresh when cancel modal is open
  useEffect(() => {
    isMutating.current = cancelTarget !== null;
  }, [cancelTarget]);

  // Cancel order
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const res = await fetch(CANCEL_ORDER(cancelTarget._id), { method: "DELETE" });
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) throw new Error("Server error — check backend");
      const json = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !json.success) throw new Error(json.message ?? `HTTP ${res.status}`);

      setOrders((prev) =>
        prev.map((o) => o._id === cancelTarget._id ? { ...o, status: "cancelled" as const } : o)
      );
      showToast("Order cancelled successfully.");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts: Record<FilterKey, number> = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Page Header */}
        <div className="mb-8 border-b border-neutral-200 pb-8 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                Order History
                {countryParam && (
                  <span className="ml-2 text-xl text-neutral-500 dark:text-neutral-400">
                    in {formatCountryName(countryParam)}
                  </span>
                )}
              </h1>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {loading
                  ? "Loading your orders…"
                  : userEmail
                  ? `${orders.length} total order${orders.length !== 1 ? "s" : ""}`
                  : "Log in to view your orders"
                }
              </p>
            </div>

            {/* Dynamic Country Filter */}
            {userEmail && !loading && availableCountries.length > 0 && (
              <CountryFilter
                currentCountry={countryParam}
                onCountryChange={handleCountryChange}
                availableCountries={availableCountries}
              />
            )}
          </div>
        </div>

        {loading ? (
          <Skeleton />
        ) : !userEmail ? (
          <NotLoggedIn country={countryParam} />
        ) : orders.length === 0 ? (
          <EmptyOrders country={countryParam} />
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
              {filterTabs.map(({ key, label }) => {
                const count = counts[key];
                if (key !== "all" && count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all
                      ${filter === key
                        ? "bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900"
                        : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 dark:hover:bg-neutral-700"
                      }`}
                  >
                    {label}
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold
                          ${filter === key
                            ? "bg-white/20 text-white dark:bg-neutral-900/20"
                            : "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                          }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Orders List */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm text-neutral-400 dark:text-neutral-500">No {filter} orders found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onCancel={(o) => setCancelTarget(o)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => !cancelLoading && setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}

      <Toast t={toast} />
    </div>
  );
}