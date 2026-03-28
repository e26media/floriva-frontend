"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// =============================================================================
//  TYPES
// =============================================================================
interface ProductImage {
  url?: string;
}

interface ResolvedMeta {
  colorName:      string;
  categoryName:   string;
  countryName:    string;
  countryId:      string;
  currencySymbol: string;
  currencyCode:   string;
}

interface Product {
  _id?:           string;
  name?:          string;
  title?:         string;
  images?:        (string | ProductImage)[];
  exactPrice?:    number | string;
  discountPrice?: number | string;
  color?:         string | { _id?: string; name?: string };
  category?:      string | { _id?: string; name?: string };
  country?:       string | { _id?: string; name?: string };
  stock?:         number | string;
  deliveryInfo?:  string;
}

interface CartItem {
  _id:       string;
  productId: Product;
  quantity:  number;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

interface CheckoutData {
  items:     CartItem[];
  userEmail: string;
  subtotal:  number;
  countryName: string;
}

// =============================================================================
//  API CONFIG
// =============================================================================
const BASE         = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000";
const VIEW_URL     = (email: string) => `${BASE}/api/view/${encodeURIComponent(email)}`;
const UPDATE_URL   = (id: string)    => `${BASE}/api/cartupdate/${id}`;
const DELETE_URL   = (id: string)    => `${BASE}/api/cartdelete/${id}`;
const COLOR_URL    = (id: string)    => `${BASE}/api/allColors/${id}`;
const CATEGORY_URL = (id: string)    => `${BASE}/api/allCategories/${id}`;
const COUNTRY_URL  = (id: string)    => `${BASE}/api/allCountries/${id}`;
const ALL_COUNTRIES_URL = `${BASE}/api/allCountries`;
const IMAGE_BASE   = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000";

const REFRESH_INTERVAL = 5000;

// =============================================================================
//  COUNTRY → CURRENCY MAP
// =============================================================================
const CURRENCY_MAP: Record<string, { symbol: string; code: string }> = {
  india:                    { symbol: "₹",   code: "INR" },
  australia:                { symbol: "A$",  code: "AUD" },
  "united states":          { symbol: "$",   code: "USD" },
  usa:                      { symbol: "$",   code: "USD" },
  "united kingdom":         { symbol: "£",   code: "GBP" },
  uk:                       { symbol: "£",   code: "GBP" },
  europe:                   { symbol: "€",   code: "EUR" },
  germany:                  { symbol: "€",   code: "EUR" },
  france:                   { symbol: "€",   code: "EUR" },
  italy:                    { symbol: "€",   code: "EUR" },
  spain:                    { symbol: "€",   code: "EUR" },
  japan:                    { symbol: "¥",   code: "JPY" },
  china:                    { symbol: "¥",   code: "CNY" },
  canada:                   { symbol: "CA$", code: "CAD" },
  switzerland:              { symbol: "Fr",  code: "CHF" },
  brazil:                   { symbol: "R$",  code: "BRL" },
  russia:                   { symbol: "₽",   code: "RUB" },
  "south korea":            { symbol: "₩",   code: "KRW" },
  mexico:                   { symbol: "MX$", code: "MXN" },
  indonesia:                { symbol: "Rp",  code: "IDR" },
  turkey:                   { symbol: "₺",   code: "TRY" },
  "saudi arabia":           { symbol: "﷼",   code: "SAR" },
  uae:                      { symbol: "د.إ", code: "AED" },
  "united arab emirates":   { symbol: "د.إ", code: "AED" },
  singapore:                { symbol: "S$",  code: "SGD" },
  pakistan:                 { symbol: "₨",   code: "PKR" },
  bangladesh:               { symbol: "৳",   code: "BDT" },
  "sri lanka":              { symbol: "₨",   code: "LKR" },
  nepal:                    { symbol: "₨",   code: "NPR" },
  thailand:                 { symbol: "฿",   code: "THB" },
  vietnam:                  { symbol: "₫",   code: "VND" },
  philippines:              { symbol: "₱",   code: "PHP" },
  malaysia:                 { symbol: "RM",  code: "MYR" },
  nigeria:                  { symbol: "₦",   code: "NGN" },
  "south africa":           { symbol: "R",   code: "ZAR" },
  ghana:                    { symbol: "₵",   code: "GHS" },
  kenya:                    { symbol: "KSh", code: "KES" },
  egypt:                    { symbol: "E£",  code: "EGP" },
  argentina:                { symbol: "$",   code: "ARS" },
  colombia:                 { symbol: "$",   code: "COP" },
  chile:                    { symbol: "$",   code: "CLP" },
  peru:                     { symbol: "S/",  code: "PEN" },
  poland:                   { symbol: "zł",  code: "PLN" },
  sweden:                   { symbol: "kr",  code: "SEK" },
  norway:                   { symbol: "kr",  code: "NOK" },
  denmark:                  { symbol: "kr",  code: "DKK" },
  "new zealand":            { symbol: "NZ$", code: "NZD" },
  israel:                   { symbol: "₪",   code: "ILS" },
  ukraine:                  { symbol: "₴",   code: "UAH" },
};

function currencyFor(countryName: string): { symbol: string; code: string } {
  const key = countryName.trim().toLowerCase();
  return CURRENCY_MAP[key] ?? { symbol: "$", code: "USD" };
}

// =============================================================================
//  GENERIC HELPERS
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

function fmtPrice(n: number, symbol = "$"): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
  return `${symbol}${formatted}`;
}

function extractId(val?: string | { _id?: string; name?: string }): string | null {
  if (!val) return null;
  if (typeof val === "string") return /^[a-f0-9]{24}$/i.test(val) ? val : null;
  return val._id && /^[a-f0-9]{24}$/i.test(val._id) ? val._id : null;
}

function extractDirectName(val?: string | { _id?: string; name?: string }): string | null {
  if (!val || typeof val === "string") return null;
  return val.name ?? null;
}

function getPrice(p?: Product): number {
  if (!p) return 0;
  const exact = Number(p.exactPrice   ?? 0);
  const disc  = Number(p.discountPrice ?? 0);
  return disc > 0 && disc < exact ? disc : exact;
}

function isSale(p?: Product): boolean {
  if (!p) return false;
  return !!(
    p.discountPrice &&
    Number(p.discountPrice) > 0 &&
    Number(p.discountPrice) < Number(p.exactPrice ?? 0)
  );
}

const COLOR_HEX: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", green: "#22c55e", black: "#171717",
  white: "#e5e7eb", yellow: "#eab308", orange: "#f97316", pink: "#ec4899",
  purple: "#a855f7", gray: "#6b7280", grey: "#6b7280", brown: "#92400e",
  navy: "#1e3a5f", beige: "#d4b896", gold: "#f59e0b", silver: "#9ca3af",
  maroon: "#7f1d1d", teal: "#14b8a6", violet: "#7c3aed", indigo: "#4f46e5",
};

// =============================================================================
//  ID RESOLVERS (cached)
// =============================================================================
const colorCache: Record<string, string> = {};
const categoryCache: Record<string, string> = {};
const countryCache: Record<string, { id: string; name: string }> = {};

async function resolveColor(val?: string | { _id?: string; name?: string }): Promise<string> {
  const direct = extractDirectName(val);
  if (direct) return direct;
  const id = extractId(val);
  if (!id) return "";
  if (colorCache[id]) return colorCache[id];
  try {
    const res  = await fetch(COLOR_URL(id));
    if (!res.ok) return "";
    const json = (await res.json()) as { success?: boolean; data?: { name?: string } };
    const name = json?.data?.name ?? "";
    if (name) colorCache[id] = name;
    return name;
  } catch { return ""; }
}

async function resolveCategory(val?: string | { _id?: string; name?: string }): Promise<string> {
  const direct = extractDirectName(val);
  if (direct) return direct;
  const id = extractId(val);
  if (!id) return "";
  if (categoryCache[id]) return categoryCache[id];
  try {
    const res  = await fetch(CATEGORY_URL(id));
    if (!res.ok) return "";
    const json = (await res.json()) as { success?: boolean; data?: { name?: string } };
    const name = json?.data?.name ?? "";
    if (name) categoryCache[id] = name;
    return name;
  } catch { return ""; }
}

async function resolveCountry(val?: string | { _id?: string; name?: string }): Promise<{ id: string; name: string }> {
  const direct = extractDirectName(val);
  if (direct) return { id: "", name: direct };
  const id = extractId(val);
  if (!id) return { id: "", name: "" };
  if (countryCache[id]) return countryCache[id];
  try {
    const res  = await fetch(COUNTRY_URL(id));
    if (!res.ok) return { id: "", name: "" };
    const json = (await res.json()) as { success?: boolean; data?: { _id?: string; name?: string } };
    const name = json?.data?.name ?? "";
    const countryId = json?.data?._id ?? id;
    if (name) countryCache[id] = { id: countryId, name };
    return { id: countryId, name };
  } catch { return { id: "", name: "" }; }
}

// =============================================================================
//  SAFE API FETCH
// =============================================================================
async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  const res = await fetch(url, options);
  const ct  = res.headers.get("content-type") ?? "";
  if (ct.includes("text/html")) {
    throw new Error(`Server error at ${url} (${res.status})`);
  }
  const json = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

// =============================================================================
//  SVG ICONS
// =============================================================================
const IcoCheck   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoTrash   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
const IcoMinus   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoPlus    = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcoArrowR  = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoArrowL  = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const IcoChevR   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcoInfo    = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoSpin    = ({ cls }: { cls?: string }) => (
  <svg className={`animate-spin ${cls ?? ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IcoBag     = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const IcoImg     = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcoTruck   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IcoTag     = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
const IcoGlobe   = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IcoCurrency = ({ cls }: { cls: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9.354A4 4 0 1 0 12 16" />
    <line x1="12" y1="6" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="18" />
  </svg>
);

// =============================================================================
//  TOAST
// =============================================================================
function Toast({ t }: { t: ToastState | null }) {
  if (!t) return null;
  const ok = t.type === "success";
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-2xl
      ${ok ? "bg-neutral-900 border-l-4 border-emerald-400" : "bg-red-950 border-l-4 border-red-400"}`}>
      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full
        ${ok ? "bg-emerald-400/20" : "bg-red-400/20"}`}>
        {ok
          ? <IcoCheck cls="h-3.5 w-3.5 text-emerald-400" />
          : <IcoInfo  cls="h-3.5 w-3.5 text-red-400" />}
      </div>
      <span className="max-w-xs">{t.message}</span>
    </div>
  );
}

// =============================================================================
//  QUANTITY CONTROL
// =============================================================================
function QtyControl({
  qty, stock, loading, onDec, onInc,
}: {
  qty: number; stock?: number | string; loading: boolean;
  onDec: () => void; onInc: () => void;
}) {
  const max = stock && Number(stock) > 0 ? Number(stock) : 99;
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      <button type="button" onClick={onDec} disabled={qty <= 1 || loading}
        aria-label="Decrease"
        className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white">
        <IcoMinus cls="h-4 w-4" />
      </button>
      <div className="flex h-10 min-w-[44px] items-center justify-center border-x border-neutral-200 bg-white px-2 dark:border-neutral-700 dark:bg-neutral-800">
        {loading
          ? <IcoSpin cls="h-4 w-4 text-neutral-400" />
          : <span className="text-sm font-bold tabular-nums text-neutral-800 dark:text-neutral-100">{qty}</span>}
      </div>
      <button type="button" onClick={onInc} disabled={qty >= max || loading}
        aria-label="Increase"
        className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white">
        <IcoPlus cls="h-4 w-4" />
      </button>
    </div>
  );
}

// =============================================================================
//  CART ITEM CARD
// =============================================================================
function CartItemCard({
  item, isUpdating, isRemoving, onUpdateQty, onRemove, onMetaResolved, currentCountry,
}: {
  item: CartItem; isUpdating: boolean; isRemoving: boolean;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove:    (id: string) => void;
  onMetaResolved: (cartId: string, meta: ResolvedMeta) => void;
  currentCountry: string;
}) {
  const p      = item.productId;
  const cartId = item._id;

  const [imgErr,      setImgErr]      = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [meta, setMeta] = useState<ResolvedMeta>({
    colorName: "", categoryName: "", countryName: "", countryId: "",
    currencySymbol: "$", currencyCode: "USD",
  });

  const colorKey    = typeof p?.color    === "string" ? p.color    : (p?.color    as { _id?: string })?._id ?? "";
  const categoryKey = typeof p?.category === "string" ? p.category : (p?.category as { _id?: string })?._id ?? "";
  const countryKey  = typeof p?.country  === "string" ? p.country  : (p?.country  as { _id?: string })?._id ?? "";

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);

    Promise.all([
      resolveColor(p?.color),
      resolveCategory(p?.category),
      resolveCountry(p?.country),
    ]).then(([colorName, categoryName, countryResult]) => {
      if (cancelled) return;
      const countryName = countryResult.name;
      const countryId = countryResult.id;
      const { symbol: currencySymbol, code: currencyCode } = currencyFor(currentCountry);
      const resolved: ResolvedMeta = { 
        colorName, 
        categoryName, 
        countryName, 
        countryId,
        currencySymbol, 
        currencyCode 
      };
      setMeta(resolved);
      setMetaLoading(false);
      onMetaResolved(cartId, resolved);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorKey, categoryKey, countryKey, currentCountry]);

  const src       = getImgSrc(p?.images);
  const price     = getPrice(p);
  const sale      = isSale(p);
  const qty       = Number(item.quantity) || 1;
  const sym       = meta.currencySymbol;
  const lineTotal = price * qty;
  const origTotal = Number(p?.exactPrice ?? 0) * qty;
  const savings   = sale ? origTotal - lineTotal : 0;

  return (
    <div className={`group flex gap-4 py-6 transition-all duration-300 sm:gap-5
      ${isRemoving ? "pointer-events-none scale-95 opacity-10" : "opacity-100 scale-100"}`}>

      {/* ── Image ── */}
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 sm:h-36 sm:w-28 dark:border-neutral-800 dark:bg-neutral-900">
        {src && !imgErr ? (
          <Image
            src={src} alt={p?.name ?? "Product"} fill
            sizes="(max-width:640px) 96px, 112px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgErr(true)} unoptimized
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

      {/* ── Details ── */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">

        {/* Category */}
        {metaLoading ? (
          <div className="h-3 w-20 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
        ) : meta.categoryName ? (
          <div className="flex items-center gap-1.5">
            <IcoTag cls="h-3 w-3 shrink-0 text-amber-500" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-500">
              {meta.categoryName}
            </span>
          </div>
        ) : null}

        {/* Name + desktop price */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100 sm:text-base">
            {p?.name ?? p?.title ?? "Unnamed Product"}
          </h3>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-base font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
              {fmtPrice(lineTotal, sym)}
            </p>
            {sale && (
              <p className="text-xs tabular-nums text-neutral-400 line-through">
                {fmtPrice(origTotal, sym)}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {metaLoading ? (
            <>
              <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
            </>
          ) : (
            <>
              {/* Color */}
              {meta.colorName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-neutral-300 dark:border-neutral-600"
                    style={{ backgroundColor: COLOR_HEX[meta.colorName.toLowerCase()] ?? "#9ca3af" }}
                  />
                  <span className="capitalize">{meta.colorName}</span>
                </span>
              )}

              {/* Country - Show the actual product's country */}
              {meta.countryName && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
                  <IcoGlobe cls="h-3 w-3 shrink-0" />
                  <span className="capitalize">{meta.countryName}</span>
                </span>
              )}

              {/* Currency - Show current cart's currency */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-400">
                <IcoCurrency cls="h-3 w-3 shrink-0" />
                <span>{meta.currencyCode} {meta.currencySymbol}</span>
              </span>
            </>
          )}

          {/* Stock */}
          {Number(p?.stock ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              <IcoCheck cls="h-3 w-3" /> In Stock ({p?.stock})
            </span>
          )}

          {/* Savings */}
          {!metaLoading && sale && savings > 0 && (
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              Save {fmtPrice(savings, sym)}
            </span>
          )}
        </div>

        {/* Delivery */}
        {p?.deliveryInfo && (
          <div className="flex items-center gap-1.5">
            <IcoTruck cls="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{p.deliveryInfo}</p>
          </div>
        )}

        {/* Bottom row */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <QtyControl
              qty={qty} stock={p?.stock} loading={isUpdating}
              onDec={() => onUpdateQty(cartId, qty - 1)}
              onInc={() => onUpdateQty(cartId, qty + 1)}
            />
            <button
              type="button" onClick={() => onRemove(cartId)} disabled={isRemoving}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400">
              {isRemoving ? <IcoSpin cls="h-3.5 w-3.5" /> : <IcoTrash cls="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isRemoving ? "Removing…" : "Remove"}</span>
            </button>
          </div>

          {/* Mobile price */}
          <div className="block text-right sm:hidden">
            <p className="text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
              {fmtPrice(lineTotal, sym)}
            </p>
            {sale && (
              <p className="text-xs tabular-nums text-neutral-400 line-through">
                {fmtPrice(origTotal, sym)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  ORDER SUMMARY
// =============================================================================
function OrderSummary({
  items,
  resolvedMetas,
  onCheckout,
  countryName,
}: {
  items: CartItem[];
  resolvedMetas: Record<string, ResolvedMeta>;
  onCheckout: () => void;
  countryName: string;
}) {
  const { symbol: displaySymbol } = currencyFor(countryName);
  const allResolved = items.length > 0 && items.every((item) => !!resolvedMetas[item._id]);

  const subtotal = items.reduce(
    (acc, item) => acc + getPrice(item.productId) * (Number(item.quantity) || 1), 0
  );
  const totalSavings = items.reduce((acc, item) => {
    if (!isSale(item.productId)) return acc;
    const disc = getPrice(item.productId);
    const orig = Number(item.productId?.exactPrice ?? 0);
    return acc + (orig - disc) * (Number(item.quantity) || 1);
  }, 0);

  const displayCountry = countryName
    ? countryName.charAt(0).toUpperCase() + countryName.slice(1)
    : "";

  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Order Summary{displayCountry ? ` (${displayCountry})` : ""}
        </h2>
      </div>
      <div className="space-y-5 p-6">
        <div className="space-y-3">

          <div className="flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">
              Subtotal{" "}
              <span className="text-neutral-400">({items.length} {items.length === 1 ? "item" : "items"})</span>
            </span>
            {allResolved ? (
              <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                {fmtPrice(subtotal, displaySymbol)}
              </span>
            ) : (
              <span className="inline-block h-4 w-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            )}
          </div>

          {totalSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-red-500 dark:text-red-400">Discount savings</span>
              {allResolved ? (
                <span className="font-semibold tabular-nums text-red-500 dark:text-red-400">
                  -{fmtPrice(totalSavings, displaySymbol)}
                </span>
              ) : (
                <span className="inline-block h-4 w-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3 dark:border-neutral-700">
            <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">Total</span>
            {allResolved ? (
              <span className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {fmtPrice(subtotal, displaySymbol)}
              </span>
            ) : (
              <span className="inline-block h-6 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            )}
          </div>
        </div>

        <button
          type="button" onClick={onCheckout} disabled={items.length === 0}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
          Proceed to Checkout <IcoArrowR cls="h-4 w-4" />
        </button>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {["Visa", "Mastercard", "AmEx", "PayPal"].map((label) => (
            <span key={label} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-600">
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
              <div className="h-5 w-40 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              <div className="flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
              </div>
              <div className="mt-auto flex gap-3 pt-2">
                <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-10 w-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
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
//  EMPTY / NOT-LOGGED-IN STATES
// =============================================================================
function EmptyCart({ countryName }: { countryName: string }) {
  const displayCountry = countryName
    ? countryName.charAt(0).toUpperCase() + countryName.slice(1)
    : "";
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-900">
        <IcoBag cls="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
        Your {displayCountry} cart is empty
      </h2>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-neutral-400 dark:text-neutral-500">
        Looks like you haven&apos;t added any items for {displayCountry} yet.
      </p>
      <Link href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-neutral-900">
        <IcoArrowL cls="h-4 w-4" /> Continue Shopping
      </Link>
    </div>
  );
}

function NotLoggedIn() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-900">
        <IcoBag cls="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">Please log in</h2>
      <p className="mb-8 max-w-xs text-sm text-neutral-400 dark:text-neutral-500">
        You need to be logged in to view your cart.
      </p>
      <Link href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-neutral-900">
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
  const params = useParams();

  // ── Get country from URL params - works with both [country] and [name] ────────────
  // Check both possible parameter names
  const urlCountry = (() => {
    if (!params) return "";
    // Try to get country from 'country' param (for [country] route)
    if (params.country) {
      return (Array.isArray(params.country) ? params.country[0] : params.country).toLowerCase().trim();
    }
    // Try to get country from 'name' param (for [name] route)
    if (params.name) {
      return (Array.isArray(params.name) ? params.name[0] : params.name).toLowerCase().trim();
    }
    return "";
  })();

  const [currentCountry, setCurrentCountry] = useState<string>(urlCountry);
  const [countryId,      setCountryId]      = useState<string>("");
  const [isValidCountry, setIsValidCountry] = useState<boolean>(true);
  const [isValidating,   setIsValidating]   = useState<boolean>(true);

  const [userEmail,     setUserEmail]     = useState<string>("");
  const [cartItems,     setCartItems]     = useState<CartItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CartItem[]>([]);
  const [loading,       setLoading]       = useState<boolean>(true);
  const [updatingIds,   setUpdatingIds]   = useState<Set<string>>(new Set());
  const [removingIds,   setRemovingIds]   = useState<Set<string>>(new Set());
  const [toast,         setToast]         = useState<ToastState | null>(null);
  const [resolvedMetas, setResolvedMetas] = useState<Record<string, ResolvedMeta>>({});

  const isMutating  = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sync currentCountry whenever the URL param changes ─────────────────────
  useEffect(() => {
    const fresh = (() => {
      if (!params) return "";
      if (params.country) {
        return (Array.isArray(params.country) ? params.country[0] : params.country).toLowerCase().trim();
      }
      if (params.name) {
        return (Array.isArray(params.name) ? params.name[0] : params.name).toLowerCase().trim();
      }
      return "";
    })();
    setCurrentCountry(fresh);
  }, [params]);

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const email = getUserEmail();
    setUserEmail(email);
  }, []);

  // ── Validate country exists in database ──────────────────────────────────────
  useEffect(() => {
    if (!currentCountry) {
      setIsValidating(false);
      setIsValidCountry(false);
      setLoading(false);
      return;
    }

    const validateCountry = async () => {
      setIsValidating(true);
      try {
        const res = await fetch(ALL_COUNTRIES_URL);
        if (!res.ok) {
          setIsValidCountry(false);
          setIsValidating(false);
          return;
        }
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const found = json.data.find(
            (c: { name?: string; _id?: string }) =>
              c.name?.toLowerCase() === currentCountry.toLowerCase()
          );
          if (found?._id) {
            setCountryId(found._id);
            setIsValidCountry(true);
          } else {
            setIsValidCountry(false);
          }
        } else {
          setIsValidCountry(false);
        }
      } catch {
        setIsValidCountry(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateCountry();
  }, [currentCountry]);

  const showToast = useCallback((message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleMetaResolved = useCallback((cartId: string, meta: ResolvedMeta) => {
    setResolvedMetas((prev) => ({ ...prev, [cartId]: meta }));
  }, []);

  // ── Filter items: only show products belonging to the URL country ───────────
  const filterItemsByCountry = useCallback((items: CartItem[]) => {
    if (!currentCountry || !countryId) return [];

    return items.filter((item) => {
      const productCountry = item.productId?.country;
      if (!productCountry) return false;

      let productCountryId   = "";
      let productCountryName = "";

      if (typeof productCountry === "string") {
        productCountryId = productCountry;
      } else {
        if (productCountry._id)  productCountryId   = productCountry._id;
        if (productCountry.name) productCountryName = productCountry.name.toLowerCase();
      }

      // Match by resolved MongoDB _id
      if (countryId && productCountryId === countryId) return true;

      // Fallback: match by name
      if (productCountryName && productCountryName === currentCountry.toLowerCase()) return true;

      return false;
    });
  }, [currentCountry, countryId]);

  // ── Full cart fetch ──────────────────────────────────────────────────────────
  const fetchCart = useCallback(async (email: string) => {
    if (!email || !isValidCountry) return;
    setLoading(true);
    try {
      const { ok, status, json } = await apiFetch(VIEW_URL(email));
      if (!ok) throw new Error((json.message as string) ?? `HTTP ${status}`);
      const all = json.success && Array.isArray(json.data) ? (json.data as CartItem[]) : [];
      setCartItems(all);
    } catch (err) {
      showToast(`Failed to load cart: ${(err as Error).message}`, "error");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, isValidCountry]);

  // ── Silent background refresh ───────────────────────────────────────────────
  const silentFetch = useCallback(async (email: string) => {
    if (!email || isMutating.current || !isValidCountry) return;
    try {
      const { ok, status, json } = await apiFetch(VIEW_URL(email));
      if (!ok) throw new Error((json.message as string) ?? `HTTP ${status}`);
      if (json.success && Array.isArray(json.data)) {
        setCartItems(json.data as CartItem[]);
      }
    } catch { /* silent */ }
  }, [isValidCountry]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userEmail && !isValidating && isValidCountry) {
      fetchCart(userEmail);
    }
  }, [userEmail, fetchCart, isValidating, isValidCountry]);

  // ── Auto-refresh ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userEmail || !isValidCountry) return;
    intervalRef.current = setInterval(() => silentFetch(userEmail), REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [userEmail, silentFetch, isValidCountry]);

  // ── Re-filter whenever items or country resolution changes ──────────────────
  useEffect(() => {
    if (cartItems.length > 0 && isValidCountry) {
      setFilteredItems(filterItemsByCountry(cartItems));
    } else {
      setFilteredItems([]);
    }
  }, [cartItems, filterItemsByCountry, isValidCountry]);

  // ── Update quantity ─────────────────────────────────────────────────────────
  const handleUpdateQty = useCallback(async (cartId: string, newQty: number) => {
    if (!cartId || newQty < 1) return;
    isMutating.current = true;
    setCartItems((prev) => prev.map((i) => i._id === cartId ? { ...i, quantity: newQty } : i));
    setUpdatingIds((prev) => new Set(prev).add(cartId));
    try {
      const { ok, json } = await apiFetch(UPDATE_URL(cartId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!ok || !json.success) {
        showToast((json.message as string) ?? "Update failed", "error");
        fetchCart(userEmail);
      }
    } catch (err) {
      showToast(`Failed to update: ${(err as Error).message}`, "error");
      fetchCart(userEmail);
    } finally {
      setUpdatingIds((prev) => { const n = new Set(prev); n.delete(cartId); return n; });
      isMutating.current = false;
    }
  }, [userEmail, fetchCart, showToast]);

  // ── Remove item ─────────────────────────────────────────────────────────────
  const handleRemove = useCallback(async (cartId: string) => {
    if (!cartId) return;
    isMutating.current = true;
    setRemovingIds((prev) => new Set(prev).add(cartId));
    const timer = setTimeout(() => {
      setCartItems((prev) => prev.filter((i) => i._id !== cartId));
      setResolvedMetas((prev) => {
        const next = { ...prev };
        delete next[cartId];
        return next;
      });
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
      setRemovingIds((prev) => { const n = new Set(prev); n.delete(cartId); return n; });
      isMutating.current = false;
    }
  }, [userEmail, fetchCart, showToast]);

  // ── Checkout ────────────────────────────────────────────────────────────────
  const handleCheckout = useCallback(() => {
    const data: CheckoutData = {
      items: filteredItems,
      userEmail,
      subtotal: filteredItems.reduce(
        (acc, item) => acc + getPrice(item.productId) * (Number(item.quantity) || 1), 0
      ),
      countryName: currentCountry,
    };
    sessionStorage.setItem("checkout_data", JSON.stringify(data));
    router.push(`/checkout?country=${currentCountry}`);
  }, [filteredItems, userEmail, router, currentCountry]);

  const totalItems = filteredItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  const displayCountry = currentCountry
    ? currentCountry.charAt(0).toUpperCase() + currentCountry.slice(1)
    : "";

  // ── Show validation state while checking country ───────────────────────────
  if (isValidating) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <CartSkeleton />
        </main>
      </div>
    );
  }

  // ── If country is invalid, show error ───────────────────────────────────────
  if (!isValidCountry) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-neutral-100 ring-8 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-900">
              <IcoGlobe cls="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
              Invalid Country
            </h2>
            <p className="mb-8 max-w-xs text-sm leading-relaxed text-neutral-400 dark:text-neutral-500">
              {currentCountry ? `"${displayCountry}" is not a valid country.` : "No country was specified in the URL."} Please navigate via a valid country link.
            </p>
            <Link href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-neutral-900">
              <IcoArrowL cls="h-4 w-4" /> Go Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
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
            <Link href="/cart" className="text-neutral-400 transition-colors hover:text-neutral-700 dark:text-neutral-600 dark:hover:text-neutral-300">
              Cart
            </Link>
            <IcoChevR cls="h-3 w-3 text-neutral-300 dark:text-neutral-700" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {displayCountry}
            </span>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
                Shopping Cart — {displayCountry}
              </h1>
              {!loading && userEmail && (
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  {filteredItems.length === 0
                    ? `Your ${displayCountry} cart is empty`
                    : `${totalItems} ${totalItems === 1 ? "item" : "items"} · ${filteredItems.length} ${filteredItems.length === 1 ? "product" : "products"} · ${displayCountry}`}
                </p>
              )}
            </div>
            {!loading && filteredItems.length > 0 && (
              <Link href="/"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-neutral-500 underline underline-offset-4 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 sm:flex">
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
        ) : filteredItems.length === 0 ? (
          <EmptyCart countryName={currentCountry} />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
            <div className="min-w-0 flex-1">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredItems.map((item, idx) => (
                  <CartItemCard
                    key={item._id ?? idx}
                    item={item}
                    isUpdating={updatingIds.has(item._id)}
                    isRemoving={removingIds.has(item._id)}
                    onUpdateQty={handleUpdateQty}
                    onRemove={handleRemove}
                    onMetaResolved={handleMetaResolved}
                    currentCountry={currentCountry}
                  />
                ))}
              </div>
              <div className="mt-8 flex justify-center lg:hidden">
                <Link href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
                  <IcoArrowL cls="h-3.5 w-3.5" /> Continue Shopping
                </Link>
              </div>
            </div>
            <div className="w-full shrink-0 lg:w-[360px] xl:w-[390px]">
              <OrderSummary
                items={filteredItems}
                resolvedMetas={resolvedMetas}
                onCheckout={handleCheckout}
                countryName={currentCountry}
              />
            </div>
          </div>
        )}
      </main>
      <Toast t={toast} />
    </div>
  );
}