"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";

/* ─────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────── */
interface SubCategory { _id: string; name: string }
interface Category    { _id: string; name: string; subCategories: SubCategory[] }
interface Color       { _id: string; name: string }
interface Product {
  _id: string; name: string; title: string; description: string
  exactPrice: number; discountPrice: number
  category: Category; subCategory: string; color: Color
  stock: number; deliveryInfo: string; images: string[]; createdAt: string
}

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const BASE   = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000";
const imgUrl = (p: string) => !p ? "" : p.startsWith("http") ? p : `${BASE}${p}`;
const pct    = (e: number, d: number) => e > 0 ? Math.round(((e - d) / e) * 100) : 0;

const COLOR_HEX: Record<string, string> = {
  pink:"#f9a8d4", red:"#f87171", white:"#e8e0d8", blue:"#93c5fd",
  yellow:"#fde047", green:"#86efac", purple:"#c4b5fd", orange:"#fdba74",
  black:"#2d2d2d", peach:"#ffb997", lavender:"#d8b4fe", coral:"#ff7f7f",
  brown:"#a97c50", cream:"#f5f0e8", grey:"#9ca3af", gray:"#9ca3af",
};

/* ─────────────────────────────────────────────────────────────────
   CURRENCY
───────────────────────────────────────────────────────────────── */
interface CurrencyInfo { symbol: string; code: string; locale: string }

const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  india:             { symbol: "₹",   code: "INR", locale: "en-IN" },
  in:                { symbol: "₹",   code: "INR", locale: "en-IN" },
  usa:               { symbol: "$",   code: "USD", locale: "en-US" },
  us:                { symbol: "$",   code: "USD", locale: "en-US" },
  "united-states":   { symbol: "$",   code: "USD", locale: "en-US" },
  uk:                { symbol: "£",   code: "GBP", locale: "en-GB" },
  "united-kingdom":  { symbol: "£",   code: "GBP", locale: "en-GB" },
  gb:                { symbol: "£",   code: "GBP", locale: "en-GB" },
  europe:            { symbol: "€",   code: "EUR", locale: "de-DE" },
  eu:                { symbol: "€",   code: "EUR", locale: "de-DE" },
  germany:           { symbol: "€",   code: "EUR", locale: "de-DE" },
  france:            { symbol: "€",   code: "EUR", locale: "fr-FR" },
  japan:             { symbol: "¥",   code: "JPY", locale: "ja-JP" },
  jp:                { symbol: "¥",   code: "JPY", locale: "ja-JP" },
  canada:            { symbol: "CA$", code: "CAD", locale: "en-CA" },
  ca:                { symbol: "CA$", code: "CAD", locale: "en-CA" },
  australia:         { symbol: "A$",  code: "AUD", locale: "en-AU" },
  au:                { symbol: "A$",  code: "AUD", locale: "en-AU" },
  uae:               { symbol: "AED", code: "AED", locale: "ar-AE" },
  singapore:         { symbol: "S$",  code: "SGD", locale: "en-SG" },
  sg:                { symbol: "S$",  code: "SGD", locale: "en-SG" },
};

const DEFAULT_CURRENCY: CurrencyInfo = { symbol: "₹", code: "INR", locale: "en-IN" };

function getCurrency(slug: string): CurrencyInfo {
  if (!slug) return DEFAULT_CURRENCY;
  return CURRENCY_MAP[slug.toLowerCase().trim()] ?? DEFAULT_CURRENCY;
}

function fmt(amount: number | undefined, c: CurrencyInfo): string {
  if (amount == null || isNaN(Number(amount))) return `${c.symbol}0`;
  try {
    return Number(amount).toLocaleString(c.locale, {
      style: "currency", currency: c.code, maximumFractionDigits: 0,
    });
  } catch {
    return `${c.symbol}${Number(amount).toLocaleString()}`;
  }
}

/* ─────────────────────────────────────────────────────────────────
   PARSE COUNTRY + ID FROM PATHNAME  (bulletproof fallback)
   Handles:
     /country/australia/product/abc123
     /product/abc123
───────────────────────────────────────────────────────────────── */
function parsePathParams(path: string): { country: string; id: string } {
  const m1 = path.match(/\/country\/([^/?#]+)\/product\/([^/?#]+)/);
  if (m1) return { country: m1[1], id: m1[2] };
  const m2 = path.match(/\/product\/([^/?#]+)/);
  if (m2) return { country: "", id: m2[1] };
  return { country: "", id: "" };
}

/* ─────────────────────────────────────────────────────────────────
   AUTH
───────────────────────────────────────────────────────────────── */
function getUserEmail(): string | null {
  try {
    const raw = localStorage.getItem("floriva_user");
    if (raw) { const p = JSON.parse(raw); if (p?.email) return p.email; }
    const tok = localStorage.getItem("floriva_token");
    if (tok) {
      const parts = tok.split(".");
      if (parts.length === 3) {
        const p = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (p?.email) return p.email;
      }
    }
    return null;
  } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────────
   ADD TO CART
───────────────────────────────────────────────────────────────── */
async function addToCartAPI(productId: string, quantity: number): Promise<{ ok: boolean; message: string }> {
  const userEmail = getUserEmail();
  if (!userEmail) return { ok: false, message: "Please log in to add items to cart." };
  try {
    const res = await fetch(`${BASE}/api/addtocart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, userEmail, quantity }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.message ?? `Failed (${res.status})` };
    return { ok: true, message: data?.message ?? "Added to cart!" };
  } catch {
    return { ok: false, message: "Network error. Try again." };
  }
}

/* ─────────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────────── */
type TType = "success" | "error" | "info";
interface IToast { id: number; msg: string; type: TType }

function ToastBox({ toasts, remove }: { toasts: IToast[]; remove: (n: number) => void }) {
  return (
    <div style={{ position:"fixed", top:24, right:24, zIndex:9999, display:"flex",
      flexDirection:"column", gap:10, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
          borderRadius:16, minWidth:300, maxWidth:400, pointerEvents:"auto",
          boxShadow:"0 8px 32px rgba(0,0,0,.3)",
          background: t.type==="success"?"#052e16":t.type==="error"?"#450a0a":"#1c1917",
          border:`1px solid ${t.type==="success"?"rgba(74,222,128,.25)":t.type==="error"?"rgba(248,113,113,.25)":"rgba(255,255,255,.1)"}`,
          animation:"toastIn .35s cubic-bezier(.22,1,.36,1) forwards",
        }}>
          <span style={{color:"#fff",opacity:.85,flexShrink:0,fontSize:16}}>
            {t.type==="success"?"✓":"⚠"}
          </span>
          <span style={{flex:1,fontSize:14,fontWeight:500,color:"#fff",lineHeight:1.4}}>{t.msg}</span>
          <button onClick={()=>remove(t.id)}
            style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.5)",padding:2,fontSize:18,lineHeight:1}}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <div className="aspect-square rounded-3xl bg-stone-200 animate-pulse mb-4"/>
          <div className="flex gap-3">
            {[0,1,2,3].map(i=><div key={i} className="w-20 h-20 rounded-xl bg-stone-200 animate-pulse"/>)}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-3">
          {[28,10,40,5,14,24,14].map((w,i)=>(
            <div key={i} className="h-8 rounded-xl bg-stone-200 animate-pulse" style={{width:`${w*3}px`,maxWidth:"100%"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RELATED CARD
   Navigates to /country/[country]/product/[id] — keeps country in URL
───────────────────────────────────────────────────────────────── */
function RelCard({ p, country, currency }: { p: Product; country: string; currency: CurrencyInfo }) {
  const d    = pct(p.exactPrice, p.discountPrice);
  const href = country ? `/country/${country}/product/${p._id}` : `/product/${p._id}`;

  return (
    <article
      onClick={() => { window.location.href = href; }}
      className="group shrink-0 w-56 bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-md cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-amber-50">
        {p.images?.[0] ? (
          <img src={imgUrl(p.images[0])} alt={p.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 60 60" fill="none" width="44">
              <rect width="60" height="60" rx="6" fill="#ede6dc"/>
              <path d="M12 44L22 28l8 10 8-12 10 18z" fill="#c4b8ab"/>
              <circle cx="20" cy="18" r="5" fill="#c4b8ab"/>
            </svg>
          </div>
        )}
        {d > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-orange-600 text-white text-[0.6rem] font-bold px-2.5 py-1 rounded-full">
            −{d}%
          </span>
        )}
        <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="bg-white/95 text-stone-900 text-xs font-bold px-4 py-2 rounded-lg tracking-wide">View Product</span>
        </div>
      </div>
      <div className="p-3.5">
        <p className="text-[0.6rem] text-stone-400 uppercase tracking-widest font-semibold mb-1">{p.category?.name}</p>
        <h4 className="font-serif text-[0.95rem] font-semibold leading-tight mb-2 line-clamp-2 text-stone-900">{p.name}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-[0.9rem] font-bold text-stone-900">{fmt(p.discountPrice, currency)}</span>
          {d > 0 && <span className="text-[0.7rem] text-stone-400 line-through">{fmt(p.exactPrice, currency)}</span>}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TOP NAV
───────────────────────────────────────────────────────────────── */
function TopBar({ name, cat, onShare, shared }: {
  name: string; cat?: string; onShare?: ()=>void; shared?: boolean
}) {
  return (
    <nav className="sticky top-0 bg-amber-50/95 backdrop-blur-md border-b border-amber-100 shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <button onClick={()=>window.history.back()}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 text-sm font-semibold transition-colors cursor-pointer bg-transparent border-none shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </button>
        <div className="hidden sm:flex items-center gap-1.5 text-[0.7rem] text-stone-400 flex-1 justify-center overflow-hidden">
          <span className="hover:text-orange-500 transition-colors cursor-pointer font-medium shrink-0"
            onClick={()=>window.history.back()}>All Products</span>
          {cat && (<><span className="text-stone-300 shrink-0">/</span>
            <span className="text-stone-500 font-medium shrink-0">{cat}</span></>)}
          <span className="text-stone-300 shrink-0">/</span>
          <span className="text-stone-800 font-bold truncate">{name}</span>
        </div>
        <button onClick={onShare}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 text-sm font-medium transition-colors cursor-pointer bg-transparent border-none shrink-0">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          {shared ? "Copied!" : "Share"}
        </button>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   Route file: app/country/[country]/product/[id]/page.tsx
═══════════════════════════════════════════════════════════════ */
export default function ProductDetailPage() {

  /* ── Step 1: get pathname (App Router hook, safe fallback) ── */
  let pathname = "";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = usePathname() ?? "";
  } catch {
    if (typeof window !== "undefined") pathname = window.location.pathname;
  }

  /* ── Step 2: get raw Next.js params (App Router) ── */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const rawParams = useParams();

  /* ── Step 3: parse params from URL path as fallback ── */
  const parsed = parsePathParams(
    pathname || (typeof window !== "undefined" ? window.location.pathname : "")
  );

  /* ── Step 4: extract id & country (useParams wins, pathname fallback) ── */
  const id: string = (() => {
    if (rawParams?.id) return Array.isArray(rawParams.id) ? rawParams.id[0] : String(rawParams.id);
    return parsed.id;
  })();

  const country: string = (() => {
    if (rawParams?.country) return Array.isArray(rawParams.country) ? rawParams.country[0] : String(rawParams.country);
    return parsed.country;
  })();

  /* ── Step 5: currency from country ── */
  const currency = getCurrency(country);

  /* ── State ── */
  const [product,     setProduct]     = useState<Product | null>(null);
  const [related,     setRelated]     = useState<Product[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [rawDebug,    setRawDebug]    = useState("");
  const [imgIdx,      setImgIdx]      = useState(0);
  const [qty,         setQty]         = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartAdded,   setCartAdded]   = useState(false);
  const [toasts,      setToasts]      = useState<IToast[]>([]);
  const [shared,      setShared]      = useState(false);
  const [zoom,        setZoom]        = useState(false);
  const [zPos,        setZPos]        = useState({ x: 50, y: 50 });
  const [tab,         setTab]         = useState<"desc"|"spec"|"ship">("desc");
  const [slPrev,      setSlPrev]      = useState(false);
  const [slNext,      setSlNext]      = useState(true);

  const toastRef  = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const imgRef    = useRef<HTMLDivElement>(null);

  /* ── Toast ── */
  const pushToast = useCallback((msg: string, type: TType = "info") => {
    const tid = ++toastRef.current;
    setToasts(p => [...p, { id: tid, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 4000);
  }, []);

  /* ── Slider arrows ── */
  const checkArrows = useCallback(() => {
    const el = sliderRef.current; if (!el) return;
    setSlPrev(el.scrollLeft > 8);
    setSlNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = sliderRef.current; if (!el) return;
    el.addEventListener("scroll", checkArrows, { passive: true });
    checkArrows();
    return () => el.removeEventListener("scroll", checkArrows);
  }, [related, checkArrows]);

  /* ── Fetch product ── */
  useEffect(() => {
    if (!id) { setError("No product ID found in URL"); setLoading(false); return; }
    setLoading(true); setError(""); setProduct(null); setRelated([]); setImgIdx(0);

    fetch(`${BASE}/api/productview/${id}`)
      .then(async r => {
        const raw = await r.text();
        setRawDebug(raw.slice(0, 800));
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        let d: unknown;
        try { d = JSON.parse(raw); } catch { throw new Error("Invalid JSON from server"); }

        const tryProduct = (v: unknown): v is Product =>
          typeof v === "object" && v !== null && "_id" in v;

        const p: Product | null =
          tryProduct(d)                                                                      ? d :
          tryProduct((d as {product:unknown})?.product)                                     ? (d as {product:Product}).product :
          tryProduct((d as {data:unknown})?.data)                                            ? (d as {data:Product}).data :
          tryProduct((d as {result:unknown})?.result)                                        ? (d as {result:Product}).result :
          Array.isArray((d as {products:unknown[]})?.products) && tryProduct((d as {products:Product[]}).products[0])
            ? (d as {products:Product[]}).products[0] :
          Array.isArray(d) && tryProduct((d as Product[])[0])                               ? (d as Product[])[0] :
          null;

        if (!p) throw new Error("Product not found in API response");
        setProduct(p);
        return p;
      })
      .then(p => {
        fetch(`${BASE}/api/productview`)
          .then(r => r.json())
          .then((d: unknown) => {
            const all: Product[] =
              Array.isArray(d)                                       ? d as Product[] :
              Array.isArray((d as {products:Product[]})?.products)   ? (d as {products:Product[]}).products :
              Array.isArray((d as {data:Product[]})?.data)           ? (d as {data:Product[]}).data :
              Array.isArray((d as {result:Product[]})?.result)       ? (d as {result:Product[]}).result : [];
            setRelated(all.filter(x => x._id !== p._id && x.category?.name === p.category?.name).slice(0, 16));
          })
          .catch(() => {});
      })
      .catch(e => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Add to cart ── */
  const handleAddToCart = async () => {
    if (!product || cartLoading) return;
    if (!getUserEmail()) { pushToast("Please log in to add items to your cart.", "error"); return; }
    setCartLoading(true);
    const res = await addToCartAPI(product._id, qty);
    setCartLoading(false);
    if (res.ok) {
      setCartAdded(true);
      pushToast(res.message && res.message !== "Added to cart!"
        ? res.message : `🛍️ Added to cart! (Qty: ${qty})`, "success");
      setTimeout(() => setCartAdded(false), 2800);
    } else {
      pushToast(res.message || "Could not add to cart.", "error");
    }
  };

  const doShare = () => {
    try { navigator.clipboard.writeText(window.location.href); } catch {}
    setShared(true); setTimeout(() => setShared(false), 2000);
  };

  const onZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = imgRef.current?.getBoundingClientRect(); if (!r) return;
    setZPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const slideBy = (n: number) => sliderRef.current?.scrollBy({ left: n, behavior: "smooth" });

  /* ── LOADING ── */
  if (loading) return (
    <div className="min-h-screen bg-amber-50">
      <style>{css}</style>
      <TopBar name="Loading…"/>
      <Skeleton/>
    </div>
  );

  /* ── ERROR ── */
  if (error || !product) return (
    <div className="min-h-screen bg-amber-50">
      <style>{css}</style>
      <TopBar name="Not found"/>
      <div className="max-w-2xl mx-auto px-6 mt-20">
        <div className="bg-white rounded-3xl p-10 border border-red-100 text-center shadow-xl">
          <div className="text-6xl mb-5">🌸</div>
          <h2 className="font-serif text-3xl font-bold mb-3 text-stone-900">Product not found</h2>
          <p className="text-stone-500 text-sm mb-5">{error}</p>
          <details className="text-left mb-5">
            <summary className="cursor-pointer text-xs text-orange-600 font-semibold">Debug info</summary>
            <pre className="bg-amber-50 rounded-xl p-3 text-[0.65rem] overflow-x-auto mt-2 whitespace-pre-wrap text-stone-700 border border-amber-100">
{`pathname : ${pathname}
id       : "${id}"
country  : "${country}"
currency : ${currency.code} ${currency.symbol}

RAW response (first 800 chars):
${rawDebug}`}
            </pre>
          </details>
          <p className="text-xs text-stone-400 mb-6">
            Endpoint: <code className="bg-amber-50 px-2 py-0.5 rounded">{`${BASE}/api/productview/${id}`}</code>
          </p>
          <button onClick={()=>window.history.back()}
            className="inline-flex items-center gap-2 px-7 py-3 bg-stone-900 text-amber-50 rounded-xl text-sm font-semibold cursor-pointer border-none hover:bg-stone-700 transition-colors">
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );

  /* ── COMPUTED ── */
  const disc   = pct(product.exactPrice, product.discountPrice);
  const hexCol = COLOR_HEX[product.color?.name?.toLowerCase() ?? ""] ?? "#d4c5b0";
  const imgs   = (product.images ?? []).filter(Boolean);
  const saved  = (product.exactPrice ?? 0) - (product.discountPrice ?? 0);

  /* ═══════ RENDER ═══════ */
  return (
    <div className="min-h-screen bg-amber-50 font-sans antialiased text-stone-900">
      <style>{css}</style>

      <ToastBox toasts={toasts} remove={tid => setToasts(p => p.filter(t => t.id !== tid))}/>

      <TopBar name={product.name} cat={product.category?.name} onShare={doShare} shared={shared}/>

      {/* Country / currency badge */}
      {country && (
        <div className="max-w-6xl mx-auto px-6 pt-4 flex justify-end">
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] px-3 py-1.5 rounded-full bg-white border border-stone-100 shadow-sm text-stone-500 font-semibold uppercase tracking-wide">
            <span className="text-stone-800 text-base">{currency.symbol}</span>
            {currency.code} · {country}
          </span>
        </div>
      )}

      {/* ══ PRODUCT GRID ══ */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-0 fade-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* LEFT: Gallery */}
          <div className="lg:sticky lg:top-20">
            <div
              ref={imgRef}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
              onMouseMove={onZoomMove}
              className="relative aspect-square rounded-3xl overflow-hidden bg-amber-100 mb-4 shadow-2xl select-none"
              style={{ cursor: zoom ? "zoom-out" : "zoom-in" }}
            >
              {imgs[imgIdx] ? (
                <img
                  src={imgUrl(imgs[imgIdx])} alt={product.name} draggable={false}
                  className="w-full h-full object-cover"
                  style={{
                    transformOrigin: zoom ? `${zPos.x}% ${zPos.y}%` : "center",
                    transform: zoom ? "scale(2.1)" : "scale(1)",
                    transition: "transform .2s",
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 100" fill="none" width="90">
                    <rect width="100" height="100" rx="12" fill="#e8ddd2"/>
                    <path d="M22 68L36 48l12 14 12-17 18 23z" fill="#c4b8ab"/>
                    <circle cx="32" cy="32" r="8" fill="#c4b8ab"/>
                  </svg>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {disc > 0 && (
                  <span className="bg-orange-600 text-white px-3 py-1.5 rounded-full text-[0.68rem] font-black badge-pop">
                    −{disc}% OFF
                  </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[0.65rem] font-semibold">
                    Only {product.stock} left!
                  </span>
                )}
              </div>

              {product.stock === 0 && (
                <div className="absolute inset-0 bg-amber-50/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-white text-stone-500 px-7 py-2.5 rounded-full text-[0.9rem] font-bold border border-stone-100 shadow-lg">
                    Out of Stock
                  </span>
                </div>
              )}

              {imgs.length > 1 && (
                <>
                  {(["left","right"] as const).map(dir => (
                    <button key={dir}
                      onClick={() => setImgIdx(i => dir==="left" ? (i-1+imgs.length)%imgs.length : (i+1)%imgs.length)}
                      className={`absolute top-1/2 -translate-y-1/2 ${dir==="left"?"left-3":"right-3"} w-10 h-10 rounded-full bg-white/90 hover:bg-stone-900 hover:text-white text-stone-900 flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer border-none z-10`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d={dir==="left"?"M15 18l-6-6 6-6":"M9 18l6-6-6-6"}/>
                      </svg>
                    </button>
                  ))}
                </>
              )}

              {imgs.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imgs.map((_,i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className="border-none cursor-pointer rounded-full p-0 transition-all"
                      style={{ width:i===imgIdx?20:6, height:6, background:i===imgIdx?"#fff":"rgba(255,255,255,.5)" }}/>
                  ))}
                </div>
              )}

              {!zoom && imgs.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[0.62rem] text-stone-500 font-medium">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                  Hover to zoom
                </div>
              )}
            </div>

            {imgs.length > 1 && (
              <div className="flex gap-2.5 flex-wrap">
                {imgs.map((src,i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className="w-[74px] h-[74px] rounded-2xl overflow-hidden p-0 cursor-pointer bg-amber-100 transition-all duration-200 hover:scale-105 border-2"
                    style={{ borderColor:i===imgIdx?"#c2673f":"#e5ddd4", boxShadow:i===imgIdx?"0 0 0 3px rgba(194,103,63,.2)":"none" }}>
                    <img src={imgUrl(src)} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Details */}
          <div>
            {product.category?.name && (
              <span className="text-[0.63rem] uppercase tracking-[0.16em] text-orange-600 font-black bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full inline-block mb-4">
                {product.category.name}
              </span>
            )}

            <h1 className="font-serif text-[clamp(1.8rem,3.2vw,2.65rem)] font-black leading-[1.08] text-stone-900 mb-2.5">
              {product.name}
            </h1>

            {product.title && product.title !== product.name && (
              <p className="text-stone-500 text-[0.9rem] leading-7 mb-3.5">{product.title}</p>
            )}

            {/* Stars */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                    fill={i<=4?"#f59e0b":"none"} stroke="#f59e0b" strokeWidth="1.5">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ))}
              </div>
              <span className="text-[0.75rem] text-stone-400 font-medium">4.8 · 124 reviews</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"/>
              <span className="text-[0.75rem] text-orange-600 font-semibold">✓ Verified</span>
            </div>

            <div className="h-px bg-gradient-to-r from-stone-200 to-transparent mb-6"/>

            {/* ── PRICE — dynamic currency ── */}
            <div className="flex items-end gap-3.5 mb-6 flex-wrap">
              <span className="font-serif text-5xl font-black text-stone-900 leading-none">
                {fmt(product.discountPrice, currency)}
              </span>
              {disc > 0 && (
                <>
                  <span className="text-lg text-stone-400 line-through leading-none pb-1">
                    {fmt(product.exactPrice, currency)}
                  </span>
                  <span className="text-[0.73rem] bg-green-100 text-green-800 px-3.5 py-1.5 rounded-full font-black leading-none">
                    Save {fmt(saved, currency)}
                  </span>
                </>
              )}
            </div>

            {/* Color */}
            {product.color?.name && (
              <span className="inline-flex items-center gap-2 text-[0.68rem] px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-stone-800 font-medium mb-4">
                <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: hexCol }}/>
                {product.color.name}
              </span>
            )}

            {/* Stock */}
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-2.5 bg-white rounded-xl border border-stone-100 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{
                background: product.stock===0?"#ef4444":product.stock<=5?"#f59e0b":"#22c55e",
                boxShadow: product.stock>0
                  ? (product.stock<=5?"0 0 0 3px rgba(245,158,11,.2)":"0 0 0 3px rgba(34,197,94,.2)")
                  : "none",
              }}/>
              <span className="text-[0.83rem] font-semibold text-stone-700">
                {product.stock===0 ? "Out of stock"
                  : product.stock<=5 ? `Only ${product.stock} left — order soon!`
                  : `In stock · ${product.stock} available`}
              </span>
            </div>

            {/* CTA */}
            {product.stock > 0 && (
              <div className="flex gap-3 mb-3 flex-wrap">
                {/* Qty */}
                <div className="flex items-center border-[1.5px] border-stone-200 rounded-2xl overflow-hidden bg-white shrink-0">
                  <button onClick={()=>setQty(q=>Math.max(1,q-1))} disabled={cartLoading}
                    className="w-12 h-[52px] flex items-center justify-center text-2xl text-stone-800 hover:bg-amber-50 transition-colors cursor-pointer border-none bg-transparent disabled:cursor-not-allowed font-light">−</button>
                  <span className="w-12 h-[52px] flex items-center justify-center text-lg font-bold border-x border-stone-200 text-stone-900">{qty}</span>
                  <button onClick={()=>setQty(q=>Math.min(product.stock,q+1))} disabled={cartLoading}
                    className="w-12 h-[52px] flex items-center justify-center text-2xl text-stone-800 hover:bg-amber-50 transition-colors cursor-pointer border-none bg-transparent disabled:cursor-not-allowed font-light">+</button>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading || cartAdded}
                  className="flex-1 min-w-[170px] h-[52px] rounded-2xl border-none font-bold text-[0.93rem] tracking-wide flex items-center justify-center gap-2.5 text-amber-50 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                  style={{
                    background: cartAdded?"#16a34a":cartLoading?"#6b7280":"#1c1410",
                    boxShadow: cartAdded?"0 8px 28px rgba(22,163,74,.35)":cartLoading?"none":"0 6px 24px rgba(28,20,16,.22)",
                  }}
                >
                  {cartLoading ? (
                    <>
                      <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                      Adding…
                    </>
                  ) : cartAdded ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            )}

            {product.stock > 0 && (
              <p className="text-[0.72rem] text-stone-400 mb-4 pl-1">
                Qty: <span className="font-semibold text-stone-600">{qty}</span> unit{qty!==1?"s":""} selected
              </p>
            )}

            {/* TABS */}
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-md">
              <div className="flex border-b border-stone-100">
                {(["desc","spec","ship"] as const).map(key => (
                  <button key={key} onClick={()=>setTab(key)}
                    className="flex-1 py-3.5 px-2 border-none cursor-pointer bg-transparent text-[0.79rem] transition-all relative"
                    style={{ fontWeight:tab===key?700:400, color:tab===key?"#1c1410":"#7a6b5e" }}>
                    {key==="desc"?"Description":key==="spec"?"Specifications":"Delivery"}
                    {tab===key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t"/>}
                  </button>
                ))}
              </div>
              <div className="p-5 fade-in" key={tab}>
                {tab==="desc" && (
                  product.description
                    ? <p className="text-[0.865rem] text-stone-600 leading-8 whitespace-pre-line">{product.description}</p>
                    : <p className="text-[0.865rem] text-stone-400 italic">No description available.</p>
                )}
                {tab==="spec" && (
                  <div>
                    {[
                      { label:"Name",       value: product.name },
                      { label:"Category",   value: product.category?.name },
                      { label:"Color",      value: product.color?.name, swatch: true },
                      { label:"Stock",      value: `${product.stock} units` },
                      { label:"MRP",        value: fmt(product.exactPrice, currency) },
                      { label:"Sale Price", value: fmt(product.discountPrice, currency) },
                      { label:"Discount",   value: disc>0?`${disc}%`:"No discount" },
                      { label:"Currency",   value: `${currency.code} (${currency.symbol})` },
                    ].filter(r=>r.value).map((row,i,arr) => (
                      <div key={i} className="flex items-center py-2.5 gap-4"
                        style={{ borderBottom: i<arr.length-1?"1px solid #f5efe7":"none" }}>
                        <span className="text-[0.67rem] text-stone-400 uppercase tracking-wider font-semibold w-24 shrink-0">{row.label}</span>
                        <span className="text-[0.84rem] text-stone-900 font-medium flex items-center gap-2">
                          {row.swatch && <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: hexCol }}/>}
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {tab==="ship" && (
                  <div className="flex flex-col gap-4">
                    {[
                      { icon:"🚚", t:"Free Standard Delivery",  d: product.deliveryInfo||"Delivered within 5–7 business days" },
                      { icon:"🔄", t:"7-Day Return Policy",      d:"Hassle-free return or exchange within 7 days" },
                      { icon:"🛡️", t:"Secure & Gift Packaging",  d:"Every order is carefully packed and optionally gift-wrapped" },
                    ].map((item,i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-xl">{item.icon}</div>
                        <div>
                          <p className="text-[0.84rem] font-bold text-stone-900 mb-1">{item.t}</p>
                          <p className="text-[0.77rem] text-stone-500 leading-relaxed">{item.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-categories */}
            {(product.category?.subCategories?.length ?? 0) > 0 && (
              <div className="mt-4 p-4 bg-white rounded-2xl border border-stone-100">
                <p className="text-[0.65rem] text-stone-400 uppercase tracking-widest font-semibold mb-2.5">Also available in</p>
                <div className="flex flex-wrap gap-2">
                  {product.category.subCategories.map(s => (
                    <span key={s._id}
                      className="px-3.5 py-1.5 rounded-full bg-amber-50 text-stone-600 text-[0.73rem] font-medium border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ RELATED PRODUCTS ══ */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mt-20 pb-24">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-orange-600 font-black mb-2">
                More from {product.category?.name}
              </p>
              <h2 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] font-black text-stone-900 leading-tight">
                You Might Also Love
              </h2>
            </div>
            <div className="flex gap-2.5 shrink-0">
              {(["left","right"] as const).map(dir => (
                <button key={dir}
                  onClick={() => slideBy(dir==="left"?-460:460)}
                  className="w-11 h-11 rounded-xl border-[1.5px] border-stone-200 flex items-center justify-center transition-all duration-200"
                  style={{
                    background: (dir==="left"?slPrev:slNext)?"#1c1410":"#fff",
                    color:      (dir==="left"?slPrev:slNext)?"#fef9f0":"#c4b8ab",
                    cursor:     (dir==="left"?slPrev:slNext)?"pointer":"not-allowed",
                  }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d={dir==="left"?"M15 18l-6-6 6-6":"M9 18l6-6-6-6"}/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            {slPrev && <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-amber-50 to-transparent pointer-events-none"/>}
            {slNext && <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-amber-50 to-transparent pointer-events-none"/>}

            <div ref={sliderRef}
              className="flex gap-4 overflow-x-auto pb-1 scroll-smooth"
              style={{ scrollbarWidth:"none", scrollSnapType:"x mandatory" }}>
              {related.map((p, i) => (
                <div key={p._id} className="fade-up shrink-0"
                  style={{ scrollSnapAlign:"start", animationDelay:`${Math.min(i,8)*0.05}s` }}>
                  {/* ✅ country passed → URL = /country/australia/product/[id] */}
                  <RelCard p={p} country={country} currency={currency}/>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center mt-5 text-[0.74rem] text-stone-400 font-medium">
            {related.length} more product{related.length!==1?"s":""} in {product.category?.name}
          </p>
        </section>
      )}

      <footer className="border-t border-stone-100 py-6 px-6 text-center text-[0.74rem] text-stone-400 bg-white tracking-wider">
        Handcrafted with love &nbsp;·&nbsp; Free delivery on all orders &nbsp;·&nbsp; 7-day easy returns
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,500&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .font-serif { font-family: 'Playfair Display', serif !important; }
  .font-sans  { font-family: 'Outfit', sans-serif !important; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:none } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes badgePop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes toastIn  { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:none } }
  @keyframes spin     { to { transform:rotate(360deg) } }

  .fade-up   { animation: fadeUp  .5s cubic-bezier(.22,1,.36,1) forwards; }
  .fade-in   { animation: fadeIn  .3s ease forwards; }
  .badge-pop { animation: badgePop .4s cubic-bezier(.34,1.4,.64,1); }
  .spin-icon { animation: spin .7s linear infinite; }

  * { box-sizing:border-box; }
`;