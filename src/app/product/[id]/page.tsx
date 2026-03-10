"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

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
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000'
// const BASE = "http://localhost:7000";
const img  = (p: string) => !p ? "" : p.startsWith("http") ? p : `${BASE}${p}`;
const pct  = (e: number, d: number) => e > 0 ? Math.round(((e - d) / e) * 100) : 0;

const COLOR_HEX: Record<string, string> = {
  pink:"#f9a8d4", red:"#f87171", white:"#e8e0d8", blue:"#93c5fd",
  yellow:"#fde047", green:"#86efac", purple:"#c4b5fd", orange:"#fdba74",
  black:"#2d2d2d", peach:"#ffb997", lavender:"#d8b4fe", coral:"#ff7f7f",
  brown:"#a97c50", cream:"#f5f0e8", grey:"#9ca3af", gray:"#9ca3af",
};

/* ─────────────────────────────────────────────────────────────────
   AUTH HELPER
   localStorage keys:
     floriva_token  → raw JWT string  (NOT JSON)
     floriva_user   → JSON string: { username, email }
   We read email from floriva_user.
   Fallback: decode the JWT payload from floriva_token manually.
───────────────────────────────────────────────────────────────── */
function getUserEmail(): string | null {
  try {
    // ── Primary: floriva_user = {"username":"ISMAIL","email":"..."}
    const userRaw = localStorage.getItem("floriva_user");
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      if (parsed?.email) return parsed.email;
    }

    // ── Fallback: decode JWT payload from floriva_token
    const token = localStorage.getItem("floriva_token");
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload?.email) return payload.email;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────
   ADD TO CART API CALL
   POST /api/addtocart  →  { productId, userEmail, quantity }
───────────────────────────────────────────────────────────────── */
async function addToCartAPI(
  productId: string,
  quantity: number
): Promise<{ ok: boolean; message: string }> {
  const userEmail = getUserEmail();

  if (!userEmail) {
    return { ok: false, message: "Please log in to add items to cart." };
  }

  try {
    const res = await fetch(`${BASE}/api/addtocart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, userEmail, quantity }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        message: data?.message ?? `Failed to add to cart (${res.status})`,
      };
    }

    return { ok: true, message: data?.message ?? "Product added to cart!" };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

/* ─────────────────────────────────────────────────────────────────
   TOAST TYPES
───────────────────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType }

/* ─────────────────────────────────────────────────────────────────
   ICONS (inline SVG, no deps)
───────────────────────────────────────────────────────────────── */
const CartIcon = ({ n = 20 }: { n?: number }) => (
  <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const ChevL = ({ n = 22 }: { n?: number }) => (
  <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const ChevR = ({ n = 22 }: { n?: number }) => (
  <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);
const ArrowL = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const HeartIcon = ({ on = false }: { on?: boolean }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const ShareIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
  </svg>
);
const StarIcon = ({ f = true }: { f?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={f ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────
   TOAST CONTAINER
───────────────────────────────────────────────────────────────── */
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl min-w-[300px] max-w-[400px] pointer-events-auto shadow-2xl border animate-toast-in"
          style={{
            background: t.type === "success" ? "#052e16" : t.type === "error" ? "#450a0a" : "#1c1917",
            borderColor: t.type === "success" ? "rgba(74,222,128,.25)" : t.type === "error" ? "rgba(248,113,113,.25)" : "rgba(255,255,255,.1)",
          }}
        >
          <span className="opacity-85 shrink-0 text-white">
            {t.type === "success" ? <CheckIcon /> : <AlertIcon />}
          </span>
          <span className="flex-1 text-sm font-medium leading-snug text-white">
            {t.message}
          </span>
          <button
            onClick={() => onRemove(t.id)}
            className="shrink-0 p-0.5 text-white/50 hover:text-white/90 transition-colors cursor-pointer border-none bg-transparent"
          >
            <XIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <div className="aspect-square rounded-3xl bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse mb-4"/>
          <div className="flex gap-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-20 h-20 rounded-xl bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 animate-pulse shrink-0"/>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-3">
          <div className="h-3 w-28 rounded-full bg-stone-200 animate-pulse"/>
          <div className="h-10 w-3/4 rounded-xl bg-stone-200 animate-pulse"/>
          <div className="h-5 w-1/2 rounded-full bg-stone-200 animate-pulse"/>
          <div className="h-14 w-40 rounded-2xl bg-stone-200 animate-pulse"/>
          <div className="h-24 w-full rounded-2xl bg-stone-200 animate-pulse"/>
          <div className="h-14 w-full rounded-2xl bg-stone-200 animate-pulse"/>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RELATED PRODUCT CARD
───────────────────────────────────────────────────────────────── */
function RelCard({ p }: { p: Product }) {
  const d = pct(p.exactPrice, p.discountPrice);
  return (
    <article
      onClick={() => { window.location.href = `/product/${p._id}`; }}
      className="group shrink-0 w-56 bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-md cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-amber-50">
        {p.images?.[0] ? (
          <img
            src={img(p.images[0])} alt={p.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
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
          <span className="bg-white/95 text-stone-900 text-xs font-bold px-4 py-2 rounded-lg tracking-wide">
            View Product
          </span>
        </div>
      </div>
      <div className="p-3.5">
        <p className="text-[0.6rem] text-stone-400 uppercase tracking-widest font-semibold mb-1">
          {p.category?.name}
        </p>
        <h4 className="font-serif text-[0.95rem] font-semibold leading-tight mb-2 line-clamp-2 text-stone-900">
          {p.name}
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-[0.9rem] font-bold text-stone-900">
            ₹{p.discountPrice?.toLocaleString()}
          </span>
          {d > 0 && (
            <span className="text-[0.7rem] text-stone-400 line-through">
              ₹{p.exactPrice?.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TOP NAV BAR
───────────────────────────────────────────────────────────────── */
function TopBar({ name, cat, onShare, shared }: {
  id: string; name: string; cat?: string; onShare?: () => void; shared?: boolean
}) {
  return (
    <nav className="sticky top-0 z-50 bg-amber-50/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 text-sm font-semibold transition-colors cursor-pointer bg-transparent border-none shrink-0"
        >
          <ArrowL /> Back
        </button>
        <div className="hidden sm:flex items-center gap-1.5 text-[0.7rem] text-stone-400 flex-1 justify-center overflow-hidden">
          <span
            className="hover:text-orange-500 transition-colors cursor-pointer font-medium shrink-0"
            onClick={() => window.history.back()}
          >
            All Products
          </span>
          {cat && (
            <>
              <span className="text-stone-300 shrink-0">/</span>
              <span className="text-stone-500 font-medium shrink-0">{cat}</span>
            </>
          )}
          <span className="text-stone-300 shrink-0">/</span>
          <span className="text-stone-800 font-bold truncate">{name}</span>
        </div>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 text-sm font-medium transition-colors cursor-pointer bg-transparent border-none shrink-0"
        >
          <ShareIcon /> {shared ? "Copied!" : "Share"}
        </button>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────
   IMAGE ARROW BUTTON
───────────────────────────────────────────────────────────────── */
function ImgArrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${dir === "left" ? "left-3" : "right-3"} w-10 h-10 rounded-full bg-white/90 hover:bg-stone-900 hover:text-white text-stone-900 flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer border-none z-10`}
    >
      {dir === "left" ? <ChevL n={20} /> : <ChevR n={20} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const params = useParams();
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? "";

  /* ── State ── */
  const [product,  setProduct]  = useState<Product | null>(null);
  const [related,  setRelated]  = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [rawDebug, setRawDebug] = useState("");

  const [imgIdx,   setImgIdx]   = useState(0);
  const [qty,      setQty]      = useState(1);

  const [cartLoading, setCartLoading] = useState(false);
  const [cartAdded,   setCartAdded]   = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const [wished,  setWished]  = useState(false);
  const [shared,  setShared]  = useState(false);
  const [zoom,    setZoom]    = useState(false);
  const [zPos,    setZPos]    = useState({ x: 50, y: 50 });
  const [tab,     setTab]     = useState<"desc" | "spec" | "ship">("desc");

  const sliderRef = useRef<HTMLDivElement>(null);
  const [slPrev,  setSlPrev]  = useState(false);
  const [slNext,  setSlNext]  = useState(true);
  const imgRef    = useRef<HTMLDivElement>(null);

  /* ── Toast helpers ── */
  const pushToast = useCallback((message: string, type: ToastType = "info") => {
    const tid = ++toastIdRef.current;
    setToasts(prev => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 4000);
  }, []);

  const removeToast = useCallback((tid: number) => {
    setToasts(prev => prev.filter(t => t.id !== tid));
  }, []);

  /* ── Slider arrows ── */
  const updateArrows = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setSlPrev(el.scrollLeft > 8);
    setSlNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    updateArrows();
    return () => el.removeEventListener("scroll", updateArrows);
  }, [related, updateArrows]);

  /* ── Fetch product ── */
  useEffect(() => {
    if (!id) { setError("No product ID in URL"); setLoading(false); return; }
    setLoading(true); setError(""); setProduct(null); setRelated([]);

    fetch(`${BASE}/api/productview/${id}`)
      .then(async r => {
        const raw = await r.text();
        setRawDebug(raw.slice(0, 600));
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = JSON.parse(raw);

        const p: Product =
          d?._id           ? d            :
          d?.product?._id  ? d.product    :
          d?.data?._id     ? d.data       :
          d?.result?._id   ? d.result     :
          (Array.isArray(d?.products) && d.products[0]?._id) ? d.products[0] :
          (Array.isArray(d) && d[0]?._id) ? d[0] :
          null;

        if (!p) throw new Error("Product not found in API response");
        setProduct(p);
        return p;
      })
      .then(p => {
        return fetch(`${BASE}/api/productview`)
          .then(r => r.json())
          .then(d => {
            const all: Product[] =
              Array.isArray(d)           ? d          :
              Array.isArray(d?.products) ? d.products :
              Array.isArray(d?.data)     ? d.data     :
              Array.isArray(d?.result)   ? d.result   : [];

            const rel = all
              .filter(x => x._id !== p._id && x.category?.name === p.category?.name)
              .slice(0, 16);
            setRelated(rel);
          })
          .catch(() => {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  /* ─────────────────────────────────────────────────────────────
     ADD TO CART HANDLER
     POST /api/addtocart  →  { productId: id, userEmail, quantity }
  ───────────────────────────────────────────────────────────── */
  const handleAddToCart = async () => {
    if (!product || cartLoading) return;

    const userEmail = getUserEmail();
    if (!userEmail) {
      pushToast("Please log in to add items to your cart.", "error");
      return;
    }

    setCartLoading(true);

    // productId key with params id, quantity from qty state
    const result = await addToCartAPI(product._id, qty);

    setCartLoading(false);

    if (result.ok) {
      setCartAdded(true);
      pushToast(
        result.message && result.message !== "Product added to cart!"
          ? result.message
          : `🛍️ Product added to cart! (Qty: ${qty})`,
        "success"
      );
      setTimeout(() => setCartAdded(false), 2800);
    } else {
      pushToast(result.message || "Could not add to cart. Please try again.", "error");
    }
  };

  /* ── Misc helpers ── */
  const doShare = () => {
    try { navigator.clipboard.writeText(window.location.href); } catch {}
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const onZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = imgRef.current?.getBoundingClientRect();
    if (!r) return;
    setZPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const slideBy = (n: number) => sliderRef.current?.scrollBy({ left: n, behavior: "smooth" });

  /* ══════════ LOADING ══════════ */
  if (loading) return (
    <div className="min-h-screen bg-amber-50 font-sans">
      <style>{globalStyles}</style>
      <TopBar id={id} name="Loading…" />
      <Skeleton />
    </div>
  );

  /* ══════════ ERROR ══════════ */
  if (error || !product) return (
    <div className="min-h-screen bg-amber-50 font-sans">
      <style>{globalStyles}</style>
      <TopBar id={id} name="Not found" />
      <div className="max-w-2xl mx-auto px-6 mt-20">
        <div className="bg-white rounded-3xl p-10 border border-red-100 text-center shadow-xl">
          <div className="text-6xl mb-5">🌸</div>
          <h2 className="font-serif text-3xl font-bold mb-3 text-stone-900">Product not found</h2>
          <p className="text-stone-500 text-sm mb-5">{error}</p>
          {rawDebug && (
            <details className="text-left mb-5">
              <summary className="cursor-pointer text-xs text-orange-600 font-semibold">🔍 Debug: Raw API Response</summary>
              <pre className="bg-amber-50 rounded-xl p-3 text-[0.65rem] overflow-x-auto mt-2 border border-amber-100 whitespace-pre-wrap text-stone-700">
                {rawDebug}
              </pre>
            </details>
          )}
          <p className="text-xs text-stone-400 mb-6">
            Called: <code className="bg-amber-50 px-2 py-0.5 rounded-md">{BASE}/api/productview/{id}</code>
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2.5 px-7 py-3 bg-stone-900 text-amber-50 rounded-xl text-sm font-semibold cursor-pointer border-none hover:bg-stone-700 transition-colors"
          >
            <ArrowL /> Go Back
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════ COMPUTED ══════════ */
  const disc   = pct(product.exactPrice, product.discountPrice);
  const hexCol = COLOR_HEX[product.color?.name?.toLowerCase()] ?? "#d4c5b0";
  const imgs   = product.images ?? [];

  const cartBtnDisabled = cartLoading || cartAdded;

  /* ══════════ RENDER ══════════ */
  return (
    <div className="min-h-screen bg-amber-50 font-sans antialiased text-stone-900">
      <style>{globalStyles}</style>

      {/* ── TOAST NOTIFICATIONS ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── TOP NAV ── */}
      <TopBar id={id} name={product.name} cat={product.category?.name} onShare={doShare} shared={shared} />

      {/* ══════════════════════════════════════════════
          PRODUCT SECTION
      ══════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-0 animate-fade-up">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* ───── LEFT: Gallery ───── */}
          <div className="lg:sticky lg:top-20">
            {/* Main Image */}
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
                  src={img(imgs[imgIdx])} alt={product.name} draggable={false}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transformOrigin: zoom ? `${zPos.x}% ${zPos.y}%` : "center",
                    transform: zoom ? "scale(2.1)" : "scale(1)",
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
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
                  <span className="bg-orange-600 text-white px-3 py-1.5 rounded-full text-[0.68rem] font-black tracking-wide animate-badge-pop">
                    −{disc}% OFF
                  </span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[0.65rem] font-semibold">
                    Only {product.stock} left!
                  </span>
                )}
              </div>

              {/* Out of Stock overlay */}
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-amber-50/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-white text-stone-500 px-7 py-2.5 rounded-full text-[0.9rem] font-bold border border-stone-100 shadow-lg">
                    Out of Stock
                  </span>
                </div>
              )}

              {/* Prev/Next arrows */}
              {imgs.length > 1 && (
                <>
                  <ImgArrow dir="left"  onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)} />
                  <ImgArrow dir="right" onClick={() => setImgIdx(i => (i + 1) % imgs.length)} />
                </>
              )}

              {/* Dot indicators */}
              {imgs.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imgs.map((_, i) => (
                    <button
                      key={i} onClick={() => setImgIdx(i)}
                      className="border-none cursor-pointer rounded-full p-0 transition-all duration-250"
                      style={{
                        width: i === imgIdx ? 20 : 6, height: 6,
                        background: i === imgIdx ? "#fff" : "rgba(255,255,255,.5)",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Zoom hint */}
              {!zoom && imgs.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-white/88 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[0.62rem] text-stone-500 font-medium">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                  Hover to zoom
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && (
              <div className="flex gap-2.5 flex-wrap">
                {imgs.map((src, i) => (
                  <button
                    key={i} onClick={() => setImgIdx(i)}
                    className="w-[74px] h-[74px] rounded-2xl overflow-hidden p-0 cursor-pointer bg-amber-100 transition-all duration-200 hover:scale-105 border-none"
                    style={{
                      border: `2px solid ${i === imgIdx ? "#c2673f" : "#e5ddd4"}`,
                      boxShadow: i === imgIdx ? "0 0 0 3px rgba(194,103,63,.2)" : "none",
                    }}
                  >
                    <img src={img(src)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ───── RIGHT: Details ───── */}
          <div>
            {/* Category pill */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {product.category?.name && (
                <span className="text-[0.63rem] uppercase tracking-[0.16em] text-orange-600 font-black bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                  {product.category.name}
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="font-serif text-[clamp(1.8rem,3.2vw,2.65rem)] font-black leading-[1.08] text-stone-900 mb-2.5">
              {product.name}
            </h1>

            {product.title && product.title !== product.name && (
              <p className="text-stone-500 text-[0.9rem] leading-7 mb-3.5">{product.title}</p>
            )}

            {/* Stars + verified */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <StarIcon key={i} f={i <= 4} />)}
              </div>
              <span className="text-[0.75rem] text-stone-400 font-medium">4.8 · 124 reviews</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"/>
              <span className="text-[0.75rem] text-orange-600 font-semibold">✓ Verified product</span>
            </div>

            <div className="h-px bg-gradient-to-r from-stone-200 to-transparent mb-6"/>

            {/* Price */}
            <div className="flex items-end gap-3.5 mb-6 flex-wrap">
              <span className="font-serif text-5xl font-black text-stone-900 leading-none">
                ₹{product.discountPrice?.toLocaleString()}
              </span>
              {disc > 0 && (
                <>
                  <span className="text-lg text-stone-400 line-through leading-none pb-1">
                    ₹{product.exactPrice?.toLocaleString()}
                  </span>
                  <span className="text-[0.73rem] bg-green-100 text-green-800 px-3.5 py-1.5 rounded-full font-black leading-none">
                    Save ₹{((product.exactPrice ?? 0) - (product.discountPrice ?? 0)).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            {/* Color swatch */}
            {product.color?.name && (
              <span className="inline-flex items-center gap-2 text-[0.68rem] px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-stone-800 font-medium mb-4">
                <span className="w-3 h-3 rounded-full shrink-0 border border-black/10" style={{ background: hexCol }}/>
                {product.color.name}
              </span>
            )}

            {/* Stock status */}
            <div className="inline-flex items-center gap-2.5 mb-6 px-4 py-2.5 bg-white rounded-xl border border-stone-100 shadow-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: product.stock === 0 ? "#ef4444" : product.stock <= 5 ? "#f59e0b" : "#22c55e",
                  boxShadow: product.stock > 0
                    ? (product.stock <= 5 ? "0 0 0 3px rgba(245,158,11,.2)" : "0 0 0 3px rgba(34,197,94,.2)")
                    : "none",
                }}
              />
              <span className="text-[0.83rem] font-semibold text-stone-700">
                {product.stock === 0
                  ? "Out of stock"
                  : product.stock <= 5
                  ? `Only ${product.stock} left — order soon!`
                  : `In stock · ${product.stock} units available`}
              </span>
            </div>

            {/* ── CTA: Qty + Add to Cart ── */}
            {product.stock > 0 && (
              <div className="flex gap-3 mb-3 flex-wrap">

                {/* Qty selector */}
                <div className="flex items-center border-[1.5px] border-stone-200 rounded-2xl overflow-hidden bg-white shrink-0">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={cartLoading}
                    className="w-12 h-[52px] flex items-center justify-center text-2xl text-stone-800 hover:bg-amber-50 transition-colors cursor-pointer border-none bg-transparent disabled:cursor-not-allowed font-light"
                  >
                    −
                  </button>
                  <span className="w-12 h-[52px] flex items-center justify-center text-lg font-bold border-x border-stone-200 text-stone-900">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={cartLoading}
                    className="w-12 h-[52px] flex items-center justify-center text-2xl text-stone-800 hover:bg-amber-50 transition-colors cursor-pointer border-none bg-transparent disabled:cursor-not-allowed font-light"
                  >
                    +
                  </button>
                </div>

                {/* ADD TO CART BUTTON */}
                <button
                  onClick={handleAddToCart}
                  disabled={cartBtnDisabled}
                  className="flex-1 min-w-[170px] h-[52px] rounded-2xl border-none font-bold text-[0.93rem] tracking-wide flex items-center justify-center gap-2.5 text-amber-50 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                  style={{
                    background: cartAdded ? "#16a34a" : cartLoading ? "#6b7280" : "#1c1410",
                    boxShadow: cartAdded
                      ? "0 8px 28px rgba(22,163,74,.35)"
                      : cartLoading ? "none"
                      : "0 6px 24px rgba(28,20,16,.22)",
                    cursor: cartBtnDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {cartLoading ? (
                    <>
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                      Adding…
                    </>
                  ) : cartAdded ? (
                    <><CheckIcon /> Added to Cart!</>
                  ) : (
                    <><CartIcon n={20} /> Add to Cart</>
                  )}
                </button>
              </div>
            )}

            {/* Quantity info note */}
            {product.stock > 0 && (
              <p className="text-[0.72rem] text-stone-400 mb-4 pl-1">
                Qty: <span className="font-semibold text-stone-600">{qty}</span> unit{qty !== 1 ? "s" : ""} selected
              </p>
            )}

            {/* Wishlist */}
            {/* <button
              onClick={() => setWished(w => !w)}
              className="w-full h-[50px] rounded-2xl font-semibold text-[0.88rem] flex items-center justify-center gap-2.5 mb-7 transition-all duration-200 cursor-pointer border-[1.5px]"
              style={{
                border: `1.5px solid ${wished ? "#c2673f" : "#e5ddd4"}`,
                background: wished ? "#fff5ef" : "#fff",
                color: wished ? "#c2673f" : "#7a6b5e",
              }}
            >
              <HeartIcon on={wished} />
              {wished ? "Saved to Wishlist" : "Add to Wishlist"}
            </button> */}

            {/* Trust Badges */}
            {/* <div className="grid grid-cols-3 gap-2.5 mb-8">
              {[
                { ico: <TruckIcon />,   title: "Free Delivery",    sub: "On all orders" },
                { ico: <RefreshIcon />, title: "7-Day Returns",    sub: "Hassle-free" },
                { ico: <ShieldIcon />,  title: "Secure Packing",   sub: "Gift wrap option" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="bg-white border border-stone-100 rounded-2xl px-2.5 py-3.5 flex flex-col items-center text-center gap-1.5 shadow-sm"
                >
                  <span className="text-orange-600">{b.ico}</span>
                  <span className="text-[0.68rem] font-bold text-stone-800 leading-tight">{b.title}</span>
                  <span className="text-[0.62rem] text-stone-400">{b.sub}</span>
                </div>
              ))}
            </div> */}

            {/* ── TABS ── */}
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-md">
              {/* Tab headers */}
              <div className="flex border-b border-stone-100">
                {([["desc","Description"], ["spec","Specifications"], ["ship","Delivery"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="flex-1 py-3.5 px-2 border-none cursor-pointer bg-transparent text-[0.79rem] font-medium transition-all relative"
                    style={{
                      fontWeight: tab === key ? 700 : 400,
                      color: tab === key ? "#1c1410" : "#7a6b5e",
                    }}
                  >
                    {label}
                    {tab === key && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-t"/>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 animate-fade-in" key={tab}>
                {tab === "desc" && (
                  product.description
                    ? <p className="text-[0.865rem] text-stone-600 leading-8 whitespace-pre-line">{product.description}</p>
                    : <p className="text-[0.865rem] text-stone-400">No description available.</p>
                )}

                {tab === "spec" && (
                  <div>
                    {[
                      { label: "Name",       value: product.name },
                      { label: "Category",   value: product.category?.name },
                      { label: "Sub Cat",    value: product.subCategory || "—" },
                      { label: "Color",      value: product.color?.name, swatch: true },
                      { label: "Stock",      value: `${product.stock} units` },
                      { label: "MRP",        value: `₹${product.exactPrice?.toLocaleString()}` },
                      { label: "Sale Price", value: `₹${product.discountPrice?.toLocaleString()}` },
                      { label: "Discount",   value: disc > 0 ? `${disc}%` : "No discount" },
                    ].filter(r => r.value).map((row, i, arr) => (
                      <div
                        key={i}
                        className="flex items-center py-2.5 gap-4"
                        style={{ borderBottom: i < arr.length - 1 ? "1px solid #f5efe7" : "none" }}
                      >
                        <span className="text-[0.67rem] text-stone-400 uppercase tracking-wider font-semibold w-24 shrink-0">
                          {row.label}
                        </span>
                        <span className="text-[0.84rem] text-stone-900 font-medium flex items-center gap-2">
                          {row.swatch && (
                            <span className="w-3 h-3 rounded-full shrink-0 border border-black/10" style={{ background: hexCol }}/>
                          )}
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "ship" && (
                  <div className="flex flex-col gap-4">
                    {[
                      { ico: <TruckIcon />,   t: "Free Standard Delivery",    d: product.deliveryInfo || "Delivered within 5–7 business days" },
                      { ico: <RefreshIcon />, t: "7-Day Return Policy",        d: "Hassle-free return or exchange within 7 days" },
                      { ico: <ShieldIcon />,  t: "Secure & Gift Packaging",    d: "Every order is carefully packed and optionally gift-wrapped" },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-orange-600">
                          {item.ico}
                        </div>
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

            {/* Sub-category chips */}
            {(product.category?.subCategories?.length ?? 0) > 0 && (
              <div className="mt-4 p-4 bg-white rounded-2xl border border-stone-100">
                <p className="text-[0.65rem] text-stone-400 uppercase tracking-widest font-semibold mb-2.5">
                  Also available in
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.category.subCategories.map(s => (
                    <span
                      key={s._id}
                      className="px-3.5 py-1.5 rounded-full bg-amber-50 text-stone-600 text-[0.73rem] font-medium border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          RELATED PRODUCTS SLIDER
      ══════════════════════════════════════════════ */}
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
              <button
                onClick={() => slideBy(-460)}
                disabled={!slPrev}
                className="w-11 h-11 rounded-xl border-[1.5px] border-stone-200 flex items-center justify-center transition-all duration-200 cursor-pointer"
                style={{
                  background: slPrev ? "#1c1410" : "#fff",
                  color: slPrev ? "#fef9f0" : "#c4b8ab",
                  cursor: slPrev ? "pointer" : "not-allowed",
                }}
              >
                <ChevL n={20} />
              </button>
              <button
                onClick={() => slideBy(460)}
                disabled={!slNext}
                className="w-11 h-11 rounded-xl border-[1.5px] border-stone-200 flex items-center justify-center transition-all duration-200"
                style={{
                  background: slNext ? "#1c1410" : "#fff",
                  color: slNext ? "#fef9f0" : "#c4b8ab",
                  cursor: slNext ? "pointer" : "not-allowed",
                }}
              >
                <ChevR n={20} />
              </button>
            </div>
          </div>

          <div className="relative">
            {slPrev && (
              <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-amber-50 to-transparent pointer-events-none"/>
            )}
            {slNext && (
              <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-amber-50 to-transparent pointer-events-none"/>
            )}
            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {related.map((p, i) => (
                <div key={p._id} style={{ scrollSnapAlign: "start", animationDelay: `${Math.min(i, 8) * 0.05}s` }} className="animate-fade-up">
                  <RelCard p={p} />
                </div>
              ))}
            </div>
          </div>

          <p className="text-center mt-5 text-[0.74rem] text-stone-400 font-medium">
            {related.length} more product{related.length !== 1 ? "s" : ""} in {product.category?.name}
          </p>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-100 py-6 px-6 text-center text-[0.74rem] text-stone-400 bg-white tracking-wider">
        Handcrafted with love &nbsp;·&nbsp; Free delivery on all orders &nbsp;·&nbsp; 7-day easy returns
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GLOBAL STYLES (animations + font import)
───────────────────────────────────────────────────────────────── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,500&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .font-serif { font-family: 'Playfair Display', serif !important; }
  .font-sans  { font-family: 'Outfit', sans-serif !important; }

  @keyframes fadeUp   { from { opacity: 0; transform: translateY(22px) } to { opacity: 1; transform: none } }
  @keyframes fadeIn   { from { opacity: 0 } to { opacity: 1 } }
  @keyframes badgePop { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes toastIn  { from { opacity: 0; transform: translateY(-12px) } to { opacity: 1; transform: none } }
  @keyframes spin     { to { transform: rotate(360deg) } }

  .animate-fade-up  { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) forwards; }
  .animate-fade-in  { animation: fadeIn .3s ease forwards; }
  .animate-badge-pop{ animation: badgePop .4s cubic-bezier(.34,1.4,.64,1); }
  .animate-toast-in { animation: toastIn .35s cubic-bezier(.22,1,.36,1) forwards; }
  .animate-spin     { animation: spin .7s linear infinite; }

  * { box-sizing: border-box; }
`;