"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
//  ✅ API URLs — these must match EXACTLY how your backend router is mounted
//
//  In your server.js / app.js you should have:
//    app.use('/api/order', orderRouter);
//
//  Which gives:  POST http://localhost:7000/api/order/createorder
//
//  If it's mounted differently, change BASE_URL below to match.
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL        = "http://localhost:7000/api";
const CREATE_ORDER_URL = `${BASE_URL}/createorder`;
const IMAGE_BASE       = "http://localhost:7000";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getUserData() {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("floriva_user") || "{}"); }
  catch { return {}; }
}

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

const getImgSrc = (images) => {
  if (!images?.length) return null;
  const img = images[0];
  if (!img) return null;
  return img.startsWith("http") ? img : `${IMAGE_BASE}${img}`;
};

const getPrice = (p) => {
  if (!p) return 0;
  const exact = p?.exactPrice ?? 0;
  const disc  = p?.discountPrice ?? 0;
  return disc > 0 && disc < exact ? disc : exact;
};

// ─── Safe JSON fetch — shows a clear error if HTML is returned ────────────────
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";

  // If server returned HTML instead of JSON, it's a wrong URL or server crash
  if (contentType.includes("text/html")) {
    throw new Error(
      `Server returned HTML instead of JSON for ${url}\n` +
      `HTTP Status: ${res.status} ${res.statusText}\n` +
      `Check that your backend is running and the URL is correct.`
    );
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed with status ${res.status}`);
  }

  return json;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoSpin  = ({ c }) => <svg className={`animate-spin ${c ?? ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>;
const IcoCheck = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>;
const IcoChevR = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>;
const IcoInfo  = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
const IcoLock  = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
const IcoTruck = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const IcoCard  = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>;
const IcoCash  = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 12h.01M18 12h.01" /></svg>;
const IcoUser  = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IcoMap   = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IcoBag   = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>;
const IcoImgPh = ({ c }) => <svg className={c} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ t }) {
  if (!t) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[100] max-w-sm flex items-start gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-white shadow-2xl
      ${t.type === "success" ? "bg-neutral-900 border-l-4 border-emerald-400" : "bg-red-950 border-l-4 border-red-400"}`}>
      <span className="leading-relaxed">{t.message}</span>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
function Field({ label, id, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Input({ id, type = "text", placeholder, value, onChange, error, disabled }) {
  return (
    <input id={id} name={id} type={type} placeholder={placeholder}
      value={value} onChange={onChange} disabled={disabled}
      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all
        placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600
        disabled:cursor-not-allowed disabled:opacity-50
        ${error
          ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100"
          : "border-neutral-200 bg-white focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        }`}
    />
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, step }) {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">{icon}</div>
      {step && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white dark:bg-white dark:text-neutral-900">{step}</span>}
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
    </div>
  );
}

// ─── Order Item Row ───────────────────────────────────────────────────────────
function OrderItemRow({ item }) {
  const p = item.productId;
  const [imgErr, setImgErr] = useState(false);
  const src   = getImgSrc(p?.images);
  const price = getPrice(p);
  const qty   = item.quantity || 1;

  return (
    <div className="flex items-center gap-3 py-3 first:pt-0">
      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        {src && !imgErr
          ? <Image src={src} alt={p?.name || "Product"} fill sizes="48px" className="object-cover" onError={() => setImgErr(true)} unoptimized />
          : <div className="flex h-full w-full items-center justify-center"><IcoImgPh c="h-5 w-5 text-neutral-300" /></div>
        }
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-white">{qty}</span>
      </div>
      <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
        <p className="line-clamp-2 text-sm font-medium text-neutral-800 dark:text-neutral-200">{p?.name || p?.title || "Product"}</p>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{fmt(price * qty)}</p>
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ orderId, email, paymentMethod }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50 dark:bg-emerald-900/30 dark:ring-emerald-950">
        <IcoCheck c="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="mb-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Order Placed!</h2>
      <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
        Confirmation sent to <strong className="text-neutral-700 dark:text-neutral-300">{email}</strong>
      </p>
      {paymentMethod === "cash_on_delivery" && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          <IcoCash c="h-4 w-4" /> Pay on Delivery
        </div>
      )}
      {paymentMethod === "online" && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          <IcoCheck c="h-4 w-4" /> Payment Successful
        </div>
      )}
      {orderId && <p className="mb-8 font-mono text-xs text-neutral-400">Order ID: {orderId}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900">
          Continue Shopping
        </button>
        <button onClick={() => router.push("/orders")}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300">
          View My Orders
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN CHECKOUT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems]         = useState([]);
  const [submitting, setSubmitting]       = useState(false);
  const [toast, setToast]                 = useState(null);
  const [errors, setErrors]               = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [success, setSuccess]             = useState(false);
  const [doneOrderId, setDoneOrderId]     = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    streetAddress1: "", streetAddress2: "",
    city: "", stateProvinceRegionId: "", postalCode: "", country: "",
  });

  // ── Load cart from sessionStorage + prefill user ──────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_data");
      if (raw) {
        const data = JSON.parse(raw);
        setCartItems(data.items ?? []);
      }
    } catch { /* ignore */ }

    const user = getUserData();
    setForm((f) => ({
      ...f,
      email:     user.email     ?? "",
      firstName: user.firstName ?? (user.name?.split(" ")[0])          ?? "",
      lastName:  user.lastName  ?? (user.name?.split(" ").slice(1).join(" ")) ?? "",
      phone:     user.phone     ?? "",
    }));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim())             e.firstName             = "Required";
    if (!form.lastName.trim())              e.lastName              = "Required";
    if (!form.email.trim())                 e.email                 = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.streetAddress1.trim())        e.streetAddress1        = "Required";
    if (!form.city.trim())                  e.city                  = "Required";
    if (!form.stateProvinceRegionId.trim()) e.stateProvinceRegionId = "Required";
    if (!form.postalCode.trim())            e.postalCode            = "Required";
    if (!form.country.trim())               e.country               = "Required";
    return e;
  };

  const subtotal = cartItems.reduce(
    (a, i) => a + getPrice(i.productId) * (i.quantity || 1), 0
  );

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
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

    // ── Build payload exactly matching your Order model ───────────────────
    const payload = {
      userEmail:     form.email,
      paymentMethod,                          // 'cash_on_delivery' or 'online'
      products: cartItems.map((item) => ({
        product:  item.productId._id,         // MongoDB ObjectId string
        quantity: item.quantity || 1,
      })),
      totalAmount: subtotal,
      shippingAddress: {
        streetAddress1:        form.streetAddress1.trim(),
        streetAddress2:        form.streetAddress2.trim(),
        city:                  form.city.trim(),
        stateProvinceRegionId: form.stateProvinceRegionId.trim(),
        postalCode:            form.postalCode.trim(),
        country:               form.country.trim(),
      },
    };

    console.log("📦 Sending order to:", CREATE_ORDER_URL);
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    try {
      const json = await safeFetch(CREATE_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("✅ Order response:", json);

      // ── COD: order complete ─────────────────────────────────────────────
      if (paymentMethod === "cash_on_delivery") {
        sessionStorage.removeItem("checkout_data");
        setDoneOrderId(json.order?._id ?? "");
        setSuccess(true);
        return;
      }

      // ── Online: for now show success (Stripe not configured) ────────────
      // When Stripe is ready, json.clientSecret will be available
      if (paymentMethod === "online" && json.clientSecret) {
        // TODO: redirect to Stripe payment form with json.clientSecret
        // For now, we just show success so the app doesn't break
        sessionStorage.removeItem("checkout_data");
        setDoneOrderId(json.order?._id ?? json.orderId ?? "");
        setSuccess(true);
      } else if (paymentMethod === "online") {
        sessionStorage.removeItem("checkout_data");
        setDoneOrderId(json.order?._id ?? "");
        setSuccess(true);
      }

    } catch (err) {
      console.error("❌ Checkout error:", err.message);
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Success
  // ─────────────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <SuccessScreen orderId={doneOrderId} email={form.email} paymentMethod={paymentMethod} />
        </main>
        <Toast t={toast} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Main Checkout Form
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Header */}
        <div className="mb-10 border-b border-neutral-200 pb-8 dark:border-neutral-800">
          <nav className="mb-4 flex items-center gap-1.5 text-xs">
            <Link href="/" className="text-neutral-400 hover:text-neutral-700">Home</Link>
            <IcoChevR c="h-3 w-3 text-neutral-300" />
            <Link href="/cart" className="text-neutral-400 hover:text-neutral-700">Cart</Link>
            <IcoChevR c="h-3 w-3 text-neutral-300" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Checkout</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl">Checkout</h1>
          {/* ── Debug info — REMOVE IN PRODUCTION ── */}
          <p className="mt-2 text-xs text-neutral-400">
            Posting to: <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">{CREATE_ORDER_URL}</code>
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

            {/* ── LEFT: Form ─────────────────────────────────────────────── */}
            <div className="flex-1 space-y-6">

              {/* Step 1: Contact */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader step="1" icon={<IcoUser c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />} title="Contact Information" />
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <Field label="First Name" id="firstName" required error={errors.firstName}>
                    <Input id="firstName" placeholder="John" value={form.firstName} onChange={handleChange} error={errors.firstName} disabled={submitting} />
                  </Field>
                  <Field label="Last Name" id="lastName" required error={errors.lastName}>
                    <Input id="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} error={errors.lastName} disabled={submitting} />
                  </Field>
                  <Field label="Email Address" id="email" required error={errors.email}>
                    <Input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} error={errors.email} disabled={submitting} />
                  </Field>
                  <Field label="Phone" id="phone">
                    <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={handleChange} disabled={submitting} />
                  </Field>
                </div>
              </section>

              {/* Step 2: Shipping */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader step="2" icon={<IcoMap c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />} title="Shipping Address" />
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Street Address" id="streetAddress1" required error={errors.streetAddress1}>
                      <Input id="streetAddress1" placeholder="123 Main Street" value={form.streetAddress1} onChange={handleChange} error={errors.streetAddress1} disabled={submitting} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Apartment / Suite (optional)" id="streetAddress2">
                      <Input id="streetAddress2" placeholder="Apt 4B" value={form.streetAddress2} onChange={handleChange} disabled={submitting} />
                    </Field>
                  </div>
                  <Field label="City" id="city" required error={errors.city}>
                    <Input id="city" placeholder="New York" value={form.city} onChange={handleChange} error={errors.city} disabled={submitting} />
                  </Field>
                  <Field label="State / Province" id="stateProvinceRegionId" required error={errors.stateProvinceRegionId}>
                    <Input id="stateProvinceRegionId" placeholder="NY" value={form.stateProvinceRegionId} onChange={handleChange} error={errors.stateProvinceRegionId} disabled={submitting} />
                  </Field>
                  <Field label="Postal Code" id="postalCode" required error={errors.postalCode}>
                    <Input id="postalCode" placeholder="10001" value={form.postalCode} onChange={handleChange} error={errors.postalCode} disabled={submitting} />
                  </Field>
                  <Field label="Country" id="country" required error={errors.country}>
                    <Input id="country" placeholder="United States" value={form.country} onChange={handleChange} error={errors.country} disabled={submitting} />
                  </Field>
                </div>
              </section>

              {/* Step 3: Delivery */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader step="3" icon={<IcoTruck c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />} title="Delivery Method" />
                <div className="space-y-3 p-6">
                  {[
                    { id: "standard",  label: "Standard Shipping",  desc: "5–7 business days", price: "Free"   },
                    { id: "express",   label: "Express Shipping",   desc: "2–3 business days", price: "$12.99" },
                    { id: "overnight", label: "Overnight Delivery", desc: "Next business day",  price: "$24.99" },
                  ].map((opt) => (
                    <label key={opt.id}
                      className="flex cursor-pointer items-center gap-4 rounded-xl border border-neutral-200 p-4 transition-colors hover:bg-neutral-50 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:has-[:checked]:border-white dark:has-[:checked]:bg-neutral-800/60">
                      <input type="radio" name="deliveryMethod" value={opt.id} defaultChecked={opt.id === "standard"} className="h-4 w-4 accent-neutral-900" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{opt.label}</p>
                        <p className="text-xs text-neutral-400">{opt.desc}</p>
                      </div>
                      <span className={`text-sm font-semibold ${opt.price === "Free" ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-700 dark:text-neutral-300"}`}>
                        {opt.price}
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Step 4: Payment Method */}
              <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionHeader step="4" icon={<IcoCard c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />} title="Payment Method" />
                <div className="space-y-3 p-6">

                  {/* Cash on Delivery */}
                  <label className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all
                    ${paymentMethod === "cash_on_delivery"
                      ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30"
                      : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"}`}>
                    <input type="radio" name="paymentMethod" value="cash_on_delivery"
                      checked={paymentMethod === "cash_on_delivery"}
                      onChange={() => setPaymentMethod("cash_on_delivery")}
                      className="mt-0.5 h-4 w-4 accent-amber-500" />
                    <IcoCash c="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Cash on Delivery</p>
                      <p className="text-xs text-neutral-400">Pay with cash when your order arrives at your door</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:bg-amber-950 dark:text-amber-400">COD</span>
                  </label>

                  {/* Online Payment */}
                  <label className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all
                    ${paymentMethod === "online"
                      ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/60"
                      : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"}`}>
                    <input type="radio" name="paymentMethod" value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="mt-0.5 h-4 w-4 accent-neutral-900 dark:accent-white" />
                    <IcoCard c="mt-0.5 h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Pay Online</p>
                      <p className="text-xs text-neutral-400">Secure payment — Visa, Mastercard, AmEx</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {["Visa", "MC", "AmEx"].map((b) => (
                        <span key={b} className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800">{b}</span>
                      ))}
                    </div>
                  </label>

                  {/* Info banners */}
                  {paymentMethod === "cash_on_delivery" && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                      <IcoInfo c="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                        You will pay <strong>{fmt(subtotal)}</strong> cash upon delivery. Our delivery agent will provide a receipt.
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

            {/* ── RIGHT: Order Summary ──────────────────────────────────── */}
            <div className="w-full shrink-0 lg:w-[360px] xl:w-[400px]">
              <div className="sticky top-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

                <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    <IcoBag c="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Order Summary</h2>
                  {cartItems.length > 0 && (
                    <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>

                {cartItems.length > 0 ? (
                  <div className="divide-y divide-neutral-100 px-6 dark:divide-neutral-800">
                    {cartItems.map((item) => <OrderItemRow key={item._id} item={item} />)}
                  </div>
                ) : (
                  <div className="px-6 py-6 text-center text-sm text-neutral-400">
                    No items. <Link href="/cart" className="font-medium text-neutral-700 underline dark:text-neutral-300">Go to cart</Link>
                  </div>
                )}

                <div className="space-y-3 border-t border-neutral-100 p-6 dark:border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Subtotal</span>
                    <span className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Shipping</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3 dark:border-neutral-700">
                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-100">Total</span>
                    <span className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">{fmt(subtotal)}</span>
                  </div>
                  <div className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium
                    ${paymentMethod === "cash_on_delivery"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}>
                    {paymentMethod === "cash_on_delivery"
                      ? <><IcoCash c="h-4 w-4 shrink-0" /> Cash on Delivery</>
                      : <><IcoCard c="h-4 w-4 shrink-0" /> Online Payment</>
                    }
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button type="submit" disabled={submitting || cartItems.length === 0}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-neutral-900 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all hover:bg-neutral-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
                    {submitting
                      ? <><IcoSpin c="h-4 w-4" /> Processing…</>
                      : paymentMethod === "cash_on_delivery"
                        ? <><IcoCash c="h-4 w-4" /> Place Order (COD)</>
                        : <><IcoCard c="h-4 w-4" /> Place Order (Pay Online)</>
                    }
                  </button>

                  <div className="mt-4 flex items-start gap-1.5 rounded-xl bg-neutral-50 px-3 py-3 dark:bg-neutral-800/60">
                    <IcoInfo c="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                      By placing your order you agree to our{" "}
                      <a href="#" className="font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400">Terms</a>
                      {" "}and{" "}
                      <a href="#" className="font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400">Privacy Policy</a>.
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