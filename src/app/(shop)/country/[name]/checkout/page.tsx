"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// =============================================================================
//  COUNTRY CONFIG — only "qatar" is permitted
// =============================================================================
const ALLOWED_COUNTRY = "qatar";

interface CountryConfig {
  label: string;
  currencyCode: string;
  currencySymbol: string;
  locale: string;
  flag: string;
}

const COUNTRY_MAP: Record<string, CountryConfig> = {
  qatar: {
    label:          "Qatar",
    currencyCode:   "QAR",
    currencySymbol: "ر.ق",
    locale:         "ar-QA",
    flag:           "🇶🇦",
  },
};

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
  stock?: number | string;
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

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  stateProvinceRegionId: string;
  postalCode: string;
  country: string;
}

// =============================================================================
//  API CONFIG
// =============================================================================
const BASE_URL         = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000";
const CREATE_ORDER_URL = `${BASE_URL}/api/createorder`;
const CONFIRM_CART_URL = `${BASE_URL}/api/confirm-order`;
const IMAGE_BASE       = "http://localhost:7000";

// =============================================================================
//  HELPERS
// =============================================================================
function getUserData(): Partial<{
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
}> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("floriva_user") || "{}");
  } catch {
    return {};
  }
}

/** Format a number as currency using the given country config */
function fmt(n: number, cfg: CountryConfig): string {
  // Format number with 2 decimal places and thousands separator
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);
  return `${cfg.currencySymbol} ${formatted}`;
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
  const disc  = Number(p.discountPrice ?? 0);
  return disc > 0 && disc < exact ? disc : exact;
}

// =============================================================================
//  SAFE FETCH
// =============================================================================
async function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<Record<string, unknown>> {
  const res = await fetch(url, options);
  const ct  = res.headers.get("content-type") ?? "";
  if (ct.includes("text/html")) {
    throw new Error(
      `Server returned HTML for ${url} (status ${res.status}). Check backend is running.`
    );
  }
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok || !json.success) {
    throw new Error(
      (json.message as string) || `Request failed with status ${res.status}`
    );
  }
  return json;
}

// =============================================================================
//  SVG ICONS
// =============================================================================
const IcoSpin  = ({ c }: { c?: string }) => (
  <svg className={`animate-spin ${c ?? ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);
const IcoCheck = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcoChevR = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcoInfo  = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8"  x2="12"    y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IcoLock  = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const IcoTruck = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5"  cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IcoCard  = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IcoCash  = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);
const IcoUser  = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IcoMap   = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IcoBag   = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const IcoImgPh = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IcoGlobe = ({ c }: { c: string }) => (
  <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
  </svg>
);

// =============================================================================
//  TOAST
// =============================================================================
function Toast({ t }: { t: ToastState | null }) {
  if (!t) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] max-w-sm flex items-start gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-2xl
        ${t.type === "success"
          ? "bg-neutral-900 border-l-4 border-emerald-400"
          : "bg-red-950 border-l-4 border-red-400"
        }`}
    >
      <span className="leading-relaxed">{t.message}</span>
    </div>
  );
}

// =============================================================================
//  COUNTRY NOT ALLOWED SCREEN
// =============================================================================
function CountryNotAllowed({ countrySlug }: { countrySlug: string }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 ring-8 ring-red-50 dark:bg-red-900/20 dark:ring-red-950">
            <IcoGlobe c="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* Text */}
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Region Not Available
        </h1>
        <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          The checkout is not available for{" "}
          <strong className="text-neutral-700 dark:text-neutral-300 capitalize">
            {countrySlug || "this region"}
          </strong>
          .
        </p>
        <p className="mb-8 text-sm text-neutral-400 dark:text-neutral-500 leading-relaxed">
          This store currently only ships to{" "}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            🇶🇦 Qatar
          </span>
          . Please visit the Qatar store to place your order.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push("/country/qatar/cart")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-all"
          >
            🇶🇦 Go to Qatar Store
          </button>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  FORM FIELD WRAPPER
// =============================================================================
interface FieldProps {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, id, required, error, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// =============================================================================
//  INPUT
// =============================================================================
interface InputProps {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

function Input({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled,
  readOnly,
}: InputProps) {
  return (
    <input
      id={id}
      name={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all
        placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600
        disabled:cursor-not-allowed disabled:opacity-50
        read-only:bg-neutral-50 read-only:cursor-default dark:read-only:bg-neutral-800/50
        ${error
          ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
          : "border-neutral-200 bg-white focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        }`}
    />
  );
}

// =============================================================================
//  SECTION HEADER
// =============================================================================
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  step?: string;
  badge?: React.ReactNode;
}

function SectionHeader({ icon, title, step, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {icon}
      </div>
      {step && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white dark:bg-white dark:text-neutral-900">
          {step}
        </span>
      )}
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      {badge && <div className="ml-auto">{badge}</div>}
    </div>
  );
}

// =============================================================================
//  ORDER ITEM ROW (right sidebar)
// =============================================================================
function OrderItemRow({
  item,
  cfg,
}: {
  item: CartItem;
  cfg: CountryConfig;
}) {
  const p = item.productId;
  const [imgErr, setImgErr] = useState(false);
  const src   = getImgSrc(p?.images);
  const price = getPrice(p);
  const qty   = item.quantity || 1;

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0">
      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        {src && !imgErr ? (
          <Image
            src={src}
            alt={p?.name ?? "Product"}
            fill
            sizes="48px"
            className="object-cover"
            onError={() => setImgErr(true)}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IcoImgPh c="h-5 w-5 text-neutral-300" />
          </div>
        )}
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-white">
          {qty}
        </span>
      </div>
      <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
        <p className="line-clamp-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {p?.name ?? p?.title ?? "Product"}
        </p>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {fmt(price * qty, cfg)}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
//  SUCCESS SCREEN
// =============================================================================
interface SuccessScreenProps {
  orderId: string;
  email: string;
  paymentMethod: string;
  cfg: CountryConfig;
  subtotal: number;
}

function SuccessScreen({
  orderId,
  email,
  paymentMethod,
  cfg,
  subtotal,
}: SuccessScreenProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50 dark:bg-emerald-900/30 dark:ring-emerald-950">
        <IcoCheck c="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Country badge */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
        {cfg.flag} {cfg.label} &nbsp;·&nbsp; {cfg.currencyCode}
      </div>

      <h2 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        Order Placed!
      </h2>
      <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
        Confirmation sent to{" "}
        <strong className="text-neutral-700 dark:text-neutral-300">
          {email}
        </strong>
      </p>

      {paymentMethod === "cash_on_delivery" && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          <IcoCash c="h-4 w-4" /> Pay on Delivery · {fmt(subtotal, cfg)}
        </div>
      )}
      {paymentMethod === "online" && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <IcoCheck c="h-4 w-4" /> Payment Successful · {fmt(subtotal, cfg)}
        </div>
      )}

      {orderId && (
        <p className="mb-8 font-mono text-xs text-neutral-400">
          Order ID: {orderId}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => router.push(`/country/${ALLOWED_COUNTRY}`)}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          Continue Shopping
        </button>
        <button
          onClick={() => router.push("/orders")}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
        >
          View My Orders
        </button>
      </div>
    </div>
  );
}

// =============================================================================
//  MAIN CHECKOUT PAGE
// =============================================================================
export default function CheckoutPage() {
  const router = useRouter();

  // ── Read [country] param from URL (e.g. /country/qatar/cart) ──────────────
  // Works with Next.js App Router. If you are on Pages Router, use useRouter().query.country
  const params      = useParams();
  const countrySlug = (
    Array.isArray(params?.country) ? params.country[0] : params?.country ?? ""
  ).toLowerCase();

  const cfg = COUNTRY_MAP[countrySlug]; // undefined if not allowed

  // ── State ─────────────────────────────────────────────────────────────────
  const [cartItems,     setCartItems]     = useState<CartItem[]>([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [toast,         setToast]         = useState<ToastState | null>(null);
  const [errors,        setErrors]        = useState<Partial<Record<keyof FormState, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "online">("cash_on_delivery");
  const [success,       setSuccess]       = useState(false);
  const [doneOrderId,   setDoneOrderId]   = useState("");

  const [form, setForm] = useState<FormState>({
    firstName: "", lastName: "", email: "", phone: "",
    streetAddress1: "", streetAddress2: "",
    city: "", stateProvinceRegionId: "", postalCode: "",
    // Pre-fill country field with the country from the URL
    country: cfg?.label ?? "",
  });

  // ── Load cart + prefill user ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_data");
      if (raw) {
        const data = JSON.parse(raw) as { items?: CartItem[] };
        setCartItems(data.items ?? []);
      }
    } catch { /* ignore */ }

    const user = getUserData();
    setForm((f) => ({
      ...f,
      email:     user.email     ?? "",
      firstName: user.firstName ?? (user.name?.split(" ")[0])                ?? "",
      lastName:  user.lastName  ?? (user.name?.split(" ").slice(1).join(" ")) ?? "",
      phone:     user.phone     ?? "",
      // Always keep country locked to the URL country
      country: cfg?.label ?? f.country,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySlug]);

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Prevent editing the locked "country" field
    if (name === "country") return;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((p) => {
        const n = { ...p };
        delete n[name as keyof FormState];
        return n;
      });
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim())             e.firstName             = "Required";
    if (!form.lastName.trim())              e.lastName              = "Required";
    if (!form.email.trim())                 e.email                 = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email";
    if (!form.streetAddress1.trim())        e.streetAddress1        = "Required";
    if (!form.city.trim())                  e.city                  = "Required";
    if (!form.stateProvinceRegionId.trim()) e.stateProvinceRegionId = "Required";
    if (!form.postalCode.trim())            e.postalCode            = "Required";
    return e;
  };

  const subtotal = cartItems.reduce(
    (a, i) => a + getPrice(i.productId) * (i.quantity || 1),
    0
  );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast("Please fill in all required fields.", "error");
      return;
    }
    if (cartItems.length === 0) {
      showToast("Your cart is empty. Go back and add items.", "error");
      return;
    }

    setSubmitting(true);

    const payload = {
      userEmail:    form.email,
      paymentMethod,
      country:      countrySlug,
      currency:     cfg?.currencyCode ?? "QAR",
      products: cartItems.map((item) => ({
        product:  item.productId._id,
        quantity: item.quantity || 1,
      })),
      totalAmount: subtotal,
      shippingAddress: {
        streetAddress1:        form.streetAddress1.trim(),
        streetAddress2:        form.streetAddress2.trim(),
        city:                  form.city.trim(),
        stateProvinceRegionId: form.stateProvinceRegionId.trim(),
        postalCode:            form.postalCode.trim(),
        country:               cfg?.label ?? "Qatar",
      },
    };

    try {
      const json = await safeFetch(CREATE_ORDER_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      // Clear cart
      try {
        await fetch(CONFIRM_CART_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ userEmail: form.email }),
        });
      } catch (cartErr) {
        console.warn(
          "[Checkout] Could not clear cart:",
          (cartErr as Error).message
        );
      }

      sessionStorage.removeItem("checkout_data");

      const order = json.order as { _id?: string } | undefined;
      setDoneOrderId(order?._id ?? (json.orderId as string) ?? "");
      setSuccess(true);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================================
  //  RENDER — Country not allowed (block all except qatar)
  // ==========================================================================
  if (!cfg) {
    return <CountryNotAllowed countrySlug={countrySlug} />;
  }

  // ==========================================================================
  //  RENDER — Success
  // ==========================================================================
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <SuccessScreen
            orderId={doneOrderId}
            email={form.email}
            paymentMethod={paymentMethod}
            cfg={cfg}
            subtotal={subtotal}
          />
        </main>
        <Toast t={toast} />
      </div>
    );
  }

  // ==========================================================================
  //  RENDER — Main Checkout Form
  // ==========================================================================
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* ── Header ── */}
        <div className="mb-10 border-b border-neutral-200 pb-8 dark:border-neutral-800">
          <nav className="mb-4 flex items-center gap-1.5 text-xs">
            <Link
              href={`/country/${countrySlug}`}
              className="text-neutral-400 transition-colors hover:text-neutral-700"
            >
              Home
            </Link>
            <IcoChevR c="h-3 w-3 text-neutral-300" />
            <Link
              href={`/country/${countrySlug}/cart`}
              className="text-neutral-400 transition-colors hover:text-neutral-700"
            >
              Cart
            </Link>
            <IcoChevR c="h-3 w-3 text-neutral-300" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Checkout
            </span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">
              Checkout
            </h1>
            {/* Country + currency badge */}
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <span className="text-xl">{cfg.flag}</span>
              <div className="text-xs">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {cfg.label}
                </p>
                <p className="text-neutral-400">
                  {cfg.currencyCode} ({cfg.currencySymbol})
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

            {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
            <div className="flex-1 space-y-6">

              {/* Step 1 — Contact */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader
                  step="1"
                  icon={<IcoUser c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
                  title="Contact Information"
                />
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <Field
                    label="First Name"
                    id="firstName"
                    required
                    error={errors.firstName}
                  >
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={form.firstName}
                      onChange={handleChange}
                      error={errors.firstName}
                      disabled={submitting}
                    />
                  </Field>
                  <Field
                    label="Last Name"
                    id="lastName"
                    required
                    error={errors.lastName}
                  >
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={handleChange}
                      error={errors.lastName}
                      disabled={submitting}
                    />
                  </Field>
                  <Field
                    label="Email Address"
                    id="email"
                    required
                    error={errors.email}
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={form.email}
                      onChange={handleChange}
                      error={errors.email}
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="Phone" id="phone">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+974 5000 0000"
                      value={form.phone}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </Field>
                </div>
              </section>

              {/* Step 2 — Shipping */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader
                  step="2"
                  icon={<IcoMap c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
                  title="Shipping Address"
                />
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      label="Street Address"
                      id="streetAddress1"
                      required
                      error={errors.streetAddress1}
                    >
                      <Input
                        id="streetAddress1"
                        placeholder="Building 12, Street 45"
                        value={form.streetAddress1}
                        onChange={handleChange}
                        error={errors.streetAddress1}
                        disabled={submitting}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Apartment / Floor (optional)"
                      id="streetAddress2"
                    >
                      <Input
                        id="streetAddress2"
                        placeholder="Floor 3, Unit 301"
                        value={form.streetAddress2}
                        onChange={handleChange}
                        disabled={submitting}
                      />
                    </Field>
                  </div>
                  <Field label="City" id="city" required error={errors.city}>
                    <Input
                      id="city"
                      placeholder="Doha"
                      value={form.city}
                      onChange={handleChange}
                      error={errors.city}
                      disabled={submitting}
                    />
                  </Field>
                  <Field
                    label="Zone / District"
                    id="stateProvinceRegionId"
                    required
                    error={errors.stateProvinceRegionId}
                  >
                    <Input
                      id="stateProvinceRegionId"
                      placeholder="Al Rayyan"
                      value={form.stateProvinceRegionId}
                      onChange={handleChange}
                      error={errors.stateProvinceRegionId}
                      disabled={submitting}
                    />
                  </Field>
                  <Field
                    label="Postal Code"
                    id="postalCode"
                    required
                    error={errors.postalCode}
                  >
                    <Input
                      id="postalCode"
                      placeholder="12345"
                      value={form.postalCode}
                      onChange={handleChange}
                      error={errors.postalCode}
                      disabled={submitting}
                    />
                  </Field>

                  {/* Country — locked / read-only */}
                  <Field label="Country" id="country" required>
                    <div className="relative">
                      <Input
                        id="country"
                        value={`${cfg.flag}  ${cfg.label}`}
                        onChange={handleChange}
                        readOnly
                        disabled={submitting}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Locked
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Delivery is available in {cfg.label} only.
                    </p>
                  </Field>
                </div>
              </section>

              {/* Step 3 — Delivery */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader
                  step="3"
                  icon={<IcoTruck c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
                  title="Delivery Method"
                />
                <div className="space-y-3 p-6">
                  {(
                    [
                      {
                        id:    "standard",
                        label: "Standard Shipping",
                        desc:  "3–5 business days",
                        price: "Free",
                      },
                      {
                        id:    "express",
                        label: "Express Shipping",
                        desc:  "1–2 business days",
                        price: `${cfg.currencySymbol} 19.99`,
                      },
                      {
                        id:    "overnight",
                        label: "Same-Day Delivery",
                        desc:  "Today (order before 12 PM)",
                        price: `${cfg.currencySymbol} 39.99`,
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-center gap-4 rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:has-[:checked]:border-white dark:has-[:checked]:bg-neutral-800/60"
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value={opt.id}
                        defaultChecked={opt.id === "standard"}
                        className="h-4 w-4 accent-neutral-900"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                          {opt.label}
                        </p>
                        <p className="text-xs text-neutral-400">{opt.desc}</p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          opt.price === "Free"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {opt.price}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Step 4 — Payment */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader
                  step="4"
                  icon={<IcoCard c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
                  title="Payment Method"
                />
                <div className="space-y-3 p-6">

                  {/* Cash on Delivery */}
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all
                      ${paymentMethod === "cash_on_delivery"
                        ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30"
                        : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === "cash_on_delivery"}
                      onChange={() => setPaymentMethod("cash_on_delivery")}
                      className="mt-0.5 h-4 w-4 accent-amber-500"
                    />
                    <IcoCash c="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        Cash on Delivery
                      </p>
                      <p className="text-xs text-neutral-400">
                        Pay with cash when your order arrives
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                      COD
                    </span>
                  </label>

                  {/* Online Payment */}
                  <label
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all
                      ${paymentMethod === "online"
                        ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/60"
                        : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="mt-0.5 h-4 w-4 accent-neutral-900 dark:accent-white"
                    />
                    <IcoCard c="mt-0.5 h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        Pay Online
                      </p>
                      <p className="text-xs text-neutral-400">
                        Secure — Visa, Mastercard, AmEx
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {(["Visa", "MC", "AmEx"] as const).map((b) => (
                        <span
                          key={b}
                          className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </label>

                  {/* Info banners */}
                  {paymentMethod === "cash_on_delivery" && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                      <IcoInfo c="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                        You will pay{" "}
                        <strong>{fmt(subtotal, cfg)}</strong> cash upon
                        delivery.
                      </p>
                    </div>
                  )}
                  {paymentMethod === "online" && (
                    <div className="flex items-start gap-3 rounded-xl bg-sky-50 p-4 dark:bg-sky-950/20">
                      <IcoLock c="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                      <p className="text-xs leading-relaxed text-sky-700 dark:text-sky-400">
                        Your card details are encrypted and never stored by us.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ── RIGHT COLUMN — Order Summary ─────────────────────────── */}
            <div className="w-full shrink-0 lg:w-[360px] xl:w-[400px]">
              <div className="sticky top-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

                {/* Summary header */}
                <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    <IcoBag c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Order Summary
                  </h2>
                  {cartItems.length > 0 && (
                    <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {cartItems.length}{" "}
                      {cartItems.length === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>

                {/* Currency banner */}
                <div className="flex items-center gap-2.5 border-b border-neutral-100 bg-neutral-50 px-6 py-3 dark:border-neutral-800 dark:bg-neutral-800/60">
                  <span className="text-base">{cfg.flag}</span>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Prices shown in{" "}
                    <strong className="text-neutral-700 dark:text-neutral-300">
                      {cfg.currencyCode} ({cfg.currencySymbol})
                    </strong>
                  </p>
                </div>

                {/* Items */}
                {cartItems.length > 0 ? (
                  <div className="divide-y divide-neutral-100 px-6 dark:divide-neutral-800">
                    {cartItems.map((item) => (
                      <OrderItemRow key={item._id} item={item} cfg={cfg} />
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-6 text-center text-sm text-neutral-400">
                    No items.{" "}
                    <Link
                      href={`/country/${countrySlug}/cart`}
                      className="font-medium text-neutral-700 underline dark:text-neutral-300"
                    >
                      Go to cart
                    </Link>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-3 border-t border-neutral-100 p-6 dark:border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Subtotal
                    </span>
                    <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                      {fmt(subtotal, cfg)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Shipping
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Free
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3 dark:border-neutral-700">
                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      Total
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {fmt(subtotal, cfg)}
                      </span>
                      <p className="text-[10px] text-neutral-400">
                        {cfg.currencyCode}
                      </p>
                    </div>
                  </div>

                  {/* Payment method pill */}
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium
                      ${paymentMethod === "cash_on_delivery"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                  >
                    {paymentMethod === "cash_on_delivery" ? (
                      <>
                        <IcoCash c="h-4 w-4 shrink-0" /> Cash on Delivery
                      </>
                    ) : (
                      <>
                        <IcoCard c="h-4 w-4 shrink-0" /> Online Payment
                      </>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="px-6 pb-6">
                  <button
                    type="submit"
                    disabled={submitting || cartItems.length === 0}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                  >
                    {submitting ? (
                      <>
                        <IcoSpin c="h-4 w-4" /> Processing…
                      </>
                    ) : paymentMethod === "cash_on_delivery" ? (
                      <>
                        <IcoCash c="h-4 w-4" /> Place Order (COD)
                      </>
                    ) : (
                      <>
                        <IcoCard c="h-4 w-4" /> Place Order (Pay Online)
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-start gap-1.5 rounded-xl bg-neutral-50 px-3 py-3 dark:bg-neutral-800/60">
                    <IcoInfo c="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                      By placing your order you agree to our{" "}
                      <a
                        href="#"
                        className="font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400"
                      >
                        Terms
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400"
                      >
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </form>
      </main>
      <Toast t={toast} />
    </div>
  );
}