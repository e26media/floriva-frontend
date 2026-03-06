"use client";

import Header from "@/components/Header/Header";
import Header2 from "@/components/Header/Header2";
import MainHeader from "@/components/MainHeader";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubCategory { _id: string; name: string; }
interface Category { _id: string; name: string; subCategories: SubCategory[]; }
interface Color { _id: string; name: string; }
interface Product {
  _id: string; name: string; title: string; description: string;
  exactPrice: number; discountPrice: number;
  category: Category; subCategory: string; color: Color;
  stock: number; deliveryInfo: string; images: string[]; createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE = "http://localhost:7000";
const img  = (p: string) => `${BASE}${p}`;
const pct  = (e: number, d: number) => e > 0 ? Math.round(((e - d) / e) * 100) : 0;
const PER_PAGE = 12;

const COLOR_MAP: Record<string, string> = {
  pink:"#f9a8d4", red:"#f87171", white:"#f0ece6", blue:"#93c5fd",
  yellow:"#fde047", green:"#86efac", purple:"#c4b5fd", orange:"#fdba74",
  black:"#374151", peach:"#ffb997", lavender:"#d8b4fe", coral:"#ff7f7f",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCart = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconChevLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
);
const IconChevRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconFilter = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
);

// ─── Quick View Modal ─────────────────────────────────────────────────────────
function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const discount = pct(product.exactPrice, product.discountPrice);
  const colorHex = COLOR_MAP[product.color?.name?.toLowerCase()] ?? "#e5e7eb";
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-[400] bg-[rgba(20,14,10,0.58)] backdrop-blur-md flex items-center justify-center p-4 animate-[fadein_0.2s_ease]"
      style={{ animation: 'fadein 0.2s ease' }}
    >
      <style>{`
        @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideup { from { opacity: 0; transform: translateY(26px) scale(0.98) } to { opacity: 1; transform: none } }
        @keyframes rot { to { transform: rotate(360deg) } }
        .qv-modal-anim { animation: slideup 0.28s cubic-bezier(0.34,1.3,0.64,1); }
        .spin-anim { animation: rot 0.75s linear infinite; }
        @media (max-width: 520px) {
          .qv-mobile-sheet { border-radius: 16px 16px 0 0 !important; position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important; max-height: 90vh !important; max-width: 100% !important; }
          .qv-backdrop-mobile { align-items: flex-end !important; padding: 0 !important; }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        className="qv-modal-anim qv-mobile-sheet bg-white rounded-[18px] w-full max-w-[900px] max-h-[92vh] overflow-y-auto relative shadow-[0_36px_90px_rgba(20,14,10,0.26)] scrollbar-thin"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full border border-[#e6ddd3] bg-white flex items-center justify-center cursor-pointer text-[#1e1610] shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:bg-[#1e1610] hover:text-[#f7f3ee] transition-all duration-200"
        >
          <IconClose />
        </button>

        {/* Inner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* ── Gallery ── */}
          <div className="p-7 border-b md:border-b-0 md:border-r border-[#e6ddd3]">
            {/* Main Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#f0ebe3] mb-3">
              {product.images[activeImg] ? (
                <img src={img(product.images[activeImg])} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#f0ebe3]">
                  <svg viewBox="0 0 80 80" fill="none" width="80">
                    <rect width="80" height="80" rx="8" fill="#ede8e1"/>
                    <path d="M18 55L30 38l10 12 10-14 12 19z" fill="#d4cdc4"/>
                    <circle cx="26" cy="26" r="6" fill="#d4cdc4"/>
                  </svg>
                </div>
              )}
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-[#b5623b] text-white px-2.5 py-1 rounded-full text-[0.7rem] font-semibold">
                  −{discount}%
                </span>
              )}
              {product.images.length > 1 && (
                <>
                  <button
                    className="absolute top-1/2 left-2.5 -translate-y-1/2 w-[34px] h-[34px] rounded-full border-none bg-white/90 flex items-center justify-center cursor-pointer text-[#1e1610] shadow-[0_2px_10px_rgba(0,0,0,0.1)] hover:bg-[#1e1610] hover:text-[#f7f3ee] transition-all duration-200"
                    onClick={() => setActiveImg(i => (i - 1 + product.images.length) % product.images.length)}
                  >
                    <IconChevLeft />
                  </button>
                  <button
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 w-[34px] h-[34px] rounded-full border-none bg-white/90 flex items-center justify-center cursor-pointer text-[#1e1610] shadow-[0_2px_10px_rgba(0,0,0,0.1)] hover:bg-[#1e1610] hover:text-[#f7f3ee] transition-all duration-200"
                    onClick={() => setActiveImg(i => (i + 1) % product.images.length)}
                  >
                    <IconChevRight />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`w-16 h-16 rounded-[9px] border-2 overflow-hidden cursor-pointer transition-all duration-200 p-0 bg-[#f0ebe3] flex-shrink-0 ${
                      i === activeImg ? "border-[#b5623b]" : "border-transparent hover:border-[#1e1610]"
                    }`}
                  >
                    <img src={img(src)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="p-8 flex flex-col">
            {/* Meta Row */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="text-[0.68rem] uppercase tracking-[0.13em] text-[#7a6b5e] font-bold">
                {product.category?.name}
              </span>
              {product.color?.name && (
                <span
                  className="text-[0.7rem] px-2.5 py-[3px] rounded-full bg-[#f0ebe3] text-[#1e1610] font-medium flex items-center gap-1.5 border border-[#e6ddd3]"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ background: colorHex }}
                  />
                  {product.color.name}
                </span>
              )}
            </div>

            {/* Name */}
            <h2 className="font-serif text-[clamp(1.35rem,2.4vw,1.8rem)] font-bold leading-tight mb-1.5">
              {product.name}
            </h2>
            {product.title !== product.name && (
              <p className="text-[0.84rem] text-[#7a6b5e] mb-4 leading-relaxed">{product.title}</p>
            )}

            {/* Prices */}
            <div className="flex items-baseline gap-2.5 flex-wrap mb-3.5">
              <span className="text-[1.65rem] font-bold text-[#1e1610] leading-none">
                ₹{product.discountPrice.toLocaleString()}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-[0.95rem] text-[#b0a090] line-through">
                    ₹{product.exactPrice.toLocaleString()}
                  </span>
                  <span className="text-[0.72rem] bg-[#dcfce7] text-[#3d8b5e] px-2.5 py-[3px] rounded-full font-bold">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-[0.85rem] text-[#7a6b5e] leading-[1.75] mb-4 pb-4 border-b border-[#e6ddd3]">
                {product.description}
              </p>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                product.stock === 0
                  ? "bg-red-500"
                  : product.stock <= 5
                  ? "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]"
                  : "bg-green-500"
              }`} />
              <span className="text-[0.8rem] text-[#7a6b5e] font-medium">
                {product.stock === 0
                  ? "Out of stock"
                  : product.stock <= 5
                  ? `Only ${product.stock} left — order soon`
                  : `In stock · ${product.stock} available`}
              </span>
            </div>

            {/* Add to Cart */}
            {product.stock > 0 && (
              <div className="flex gap-2.5 items-center mb-2.5 flex-wrap">
                {/* Qty */}
                <div className="flex items-center border border-[#e6ddd3] rounded-[9px] overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-[38px] h-11 border-none bg-[#f0ebe3] text-lg cursor-pointer text-[#1e1610] flex items-center justify-center hover:bg-[#e6ddd3] transition-all duration-200 font-light"
                  >−</button>
                  <span className="w-[42px] text-center text-[0.92rem] font-bold border-x border-[#e6ddd3] h-11 flex items-center justify-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="w-[38px] h-11 border-none bg-[#f0ebe3] text-lg cursor-pointer text-[#1e1610] flex items-center justify-center hover:bg-[#e6ddd3] transition-all duration-200 font-light"
                  >+</button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAdd}
                  className={`flex-1 h-11 rounded-[9px] border-none font-semibold text-[0.88rem] cursor-pointer tracking-[0.05em] flex items-center justify-center gap-2 transition-all duration-200 ${
                    added
                      ? "bg-[#3d8b5e] text-white"
                      : "bg-[#1e1610] text-[#f7f3ee] hover:bg-[#7a3e22]"
                  }`}
                >
                  {added ? <><IconCheck /> Added to Cart!</> : <><IconCart size={16} /> Add to Cart</>}
                </button>
              </div>
            )}

            {/* Wishlist */}
            <button
              onClick={() => setWished(w => !w)}
              className={`w-full h-10 rounded-[9px] border font-medium text-[0.84rem] cursor-pointer flex items-center justify-center gap-1.5 mb-4 transition-all duration-200 ${
                wished
                  ? "border-[#b5623b] text-[#b5623b] bg-[#fff5f2]"
                  : "border-[#e6ddd3] bg-transparent text-[#7a6b5e] hover:border-[#b5623b] hover:text-[#b5623b]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {wished ? "Saved to Wishlist" : "Add to Wishlist"}
            </button>

            {/* Sub-categories */}
            {product.category?.subCategories?.length > 0 && (
              <div className="pt-3.5 border-t border-[#e6ddd3] flex flex-wrap items-center gap-2">
                <span className="text-[0.68rem] text-[#b0a090] uppercase tracking-[0.09em] flex-shrink-0">
                  Also available in
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.category.subCategories.map(s => (
                    <span
                      key={s._id}
                      className="px-2.5 py-1 rounded-full bg-[#f0ebe3] text-[#7a6b5e] text-[0.72rem] font-medium border border-[#e6ddd3]"
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
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onQuickView }: { product: Product; onQuickView: () => void }) {
  const router = useRouter();
  const [imgIdx, setImgIdx] = useState(0);
  const [wished, setWished] = useState(false);
  const discount = pct(product.exactPrice, product.discountPrice);

  return (
    <article
      className="bg-white rounded-[13px] overflow-hidden shadow-[0_2px_18px_rgba(30,22,16,0.07)] transition-all duration-200 cursor-pointer border border-[#e6ddd3] hover:shadow-[0_16px_50px_rgba(30,22,16,0.16)] hover:-translate-y-1.5 group"
      onMouseEnter={() => product.images.length > 1 && setImgIdx(1)}
      onMouseLeave={() => setImgIdx(0)}
      onClick={() => router.push(`/product/${product._id}`)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#f0ebe3]">
        {product.images[imgIdx] ? (
          <img
            src={img(product.images[imgIdx])}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#b0a090] text-sm">No Image</div>
        )}

        {/* Badges */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-[#b5623b] text-white px-2.5 py-[3px] rounded-full text-[0.68rem] font-semibold tracking-[0.04em]">
            −{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-100 text-red-800 px-2.5 py-[3px] rounded-full text-[0.68rem] font-semibold tracking-[0.04em]">
            Sold Out
          </span>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-[rgba(30,22,16,0.04)] flex flex-col items-end justify-end p-2.5 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        
          <button
            className="px-3.5 py-1.5 bg-white/95 border-none rounded-[7px] text-[0.76rem] cursor-pointer font-semibold text-[#1e1610] shadow-[0_2px_10px_rgba(0,0,0,0.11)] tracking-[0.05em] whitespace-nowrap transition-all duration-200 hover:bg-[#1e1610] hover:text-[#f7f3ee]"
            onClick={(e) => { e.stopPropagation(); onQuickView(); }}
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-[15px]">
        <h3 className="font-serif text-[1.02rem] font-semibold leading-snug mb-[3px]">{product.name}</h3>
        <p className="text-[0.77rem] text-[#7a6b5e] mb-2.5 overflow-hidden text-ellipsis whitespace-nowrap">{product.title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[0.98rem] font-semibold text-[#1e1610]">₹{product.discountPrice}</span>
          {discount > 0 && (
            <span className="text-[0.76rem] text-[#b0a090] line-through">₹{product.exactPrice}</span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Filters Sidebar ──────────────────────────────────────────────────────────
function FiltersSidebar({
  products, filters, setFilters, mobileOpen, onClose,
}: {
  products: Product[];
  filters: any;
  setFilters: (f: any) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const cats   = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)));
  const colors = Array.from(new Set(products.map(p => p.color?.name).filter(Boolean)));
  const prices = products.map(p => p.discountPrice);
  const gMin   = prices.length ? Math.min(...prices) : 0;
  const gMax   = prices.length ? Math.max(...prices) : 10000;

  const reset = () => setFilters({ category: "", color: "", maxPrice: gMax, search: "" });

  return (
    <div className="mt-10">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[199] backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-[264px] flex-shrink-0 bg-white rounded-[13px] p-[26px_22px] border border-[#e6ddd3] sticky top-6
          max-md:fixed max-md:top-0 max-md:bottom-0 max-md:z-[200] max-md:w-[280px] max-md:rounded-none
          max-md:overflow-y-auto max-md:shadow-[4px_0_28px_rgba(0,0,0,0.13)] max-md:transition-[left_0.32s_cubic-bezier(0.4,0,0.2,1)]
          ${mobileOpen ? "max-md:left-0" : "max-md:-left-[290px]"}
        `}
      >
        {/* Head */}
        <div className="flex justify-between items-center mb-[26px] pb-[18px] border-b border-[#e6ddd3]">
          <h2 className="font-serif text-[1.25rem] font-semibold">Filters</h2>
          <div className="flex gap-2.5 items-center">
            <button
              onClick={reset}
              className="bg-transparent border-none text-[#b5623b] text-[0.76rem] cursor-pointer underline underline-offset-2 tracking-[0.04em]"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="md:hidden bg-transparent border-none cursor-pointer text-[#1e1610] flex items-center justify-center"
              aria-label="Close filters"
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#7a6b5e] font-semibold mb-3">Search</p>
          <div className="flex items-center gap-2 border border-[#e6ddd3] rounded-lg px-3 py-2.5 bg-[#f0ebe3] focus-within:border-[#b5623b] focus-within:bg-white transition-all duration-200">
            <IconSearch />
            <input
              className="border-none outline-none w-full text-sm bg-transparent text-[#1e1610] placeholder:text-[#b0a090]"
              placeholder="Search…"
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Category */}
        <div className="mb-6">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#7a6b5e] font-semibold mb-3">Category</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilters({ ...filters, category: "" })}
              className={`px-3 py-1.5 rounded-full border text-[0.76rem] cursor-pointer transition-all duration-200 ${
                !filters.category
                  ? "bg-[#1e1610] text-[#f7f3ee] border-[#1e1610]"
                  : "border-[#e6ddd3] bg-white text-[#1e1610] hover:border-[#b5623b] hover:text-[#b5623b]"
              }`}
            >All</button>
            {cats.map(c => (
              <button
                key={c}
                onClick={() => setFilters({ ...filters, category: filters.category === c ? "" : c })}
                className={`px-3 py-1.5 rounded-full border text-[0.76rem] cursor-pointer transition-all duration-200 ${
                  filters.category === c
                    ? "bg-[#1e1610] text-[#f7f3ee] border-[#1e1610]"
                    : "border-[#e6ddd3] bg-white text-[#1e1610] hover:border-[#b5623b] hover:text-[#b5623b]"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="mb-6">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#7a6b5e] font-semibold mb-3">Color</p>
          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={() => setFilters({ ...filters, color: "" })}
              className={`px-2.5 py-1 rounded-full border text-[0.72rem] cursor-pointer transition-all duration-200 ${
                !filters.color
                  ? "bg-[#1e1610] text-[#f7f3ee] border-[#1e1610]"
                  : "border-[#e6ddd3] bg-white text-[#1e1610] hover:border-[#b5623b] hover:text-[#b5623b]"
              }`}
            >All</button>
            {colors.map(c => (
              <button
                key={c}
                title={c}
                aria-label={`Filter by ${c}`}
                onClick={() => setFilters({ ...filters, color: filters.color === c ? "" : c })}
                className={`w-[26px] h-[26px] rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-125 ${
                  filters.color === c
                    ? "outline outline-2 outline-offset-2 outline-[#1e1610] scale-125 border-transparent"
                    : "border-transparent"
                }`}
                style={{ background: COLOR_MAP[c.toLowerCase()] ?? "#e5e7eb" }}
              />
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#7a6b5e] font-semibold mb-3 flex justify-between items-center">
            Max Price
            <span className="text-[0.76rem] text-[#1e1610] font-medium normal-case tracking-normal">
              ₹{(filters.maxPrice ?? gMax).toLocaleString()}
            </span>
          </p>
          <input
            type="range"
            min={gMin}
            max={gMax}
            value={filters.maxPrice ?? gMax}
            onChange={e => setFilters({ ...filters, maxPrice: +e.target.value })}
            className="w-full cursor-pointer h-1 mb-2 block accent-[#b5623b]"
          />
          <div className="flex justify-between text-[0.7rem] text-[#b0a090]">
            <span>₹{gMin.toLocaleString()}</span>
            <span>₹{gMax.toLocaleString()}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }: {
  page: number; total: number; perPage: number; onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const nums: (number | "…")[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push("…");
    nums.push(pages);
  }

  const btnBase = "min-w-[38px] h-[38px] px-2 rounded-[9px] border border-[#e6ddd3] bg-white text-[0.86rem] cursor-pointer flex items-center justify-center text-[#1e1610] transition-all duration-200 hover:border-[#1e1610] disabled:opacity-30 disabled:cursor-not-allowed";
  const btnActive = "!bg-[#1e1610] !text-[#f7f3ee] !border-[#1e1610]";

  return (
    <nav className="flex gap-1.5 justify-center mt-14 flex-wrap" aria-label="Pagination">
      <button className={btnBase} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous">
        <IconChevLeft />
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="flex items-center px-1 text-[#b0a090] text-[0.9rem]">…</span>
        ) : (
          <button
            key={n}
            className={`${btnBase} ${n === page ? btnActive : ""}`}
            onClick={() => onChange(n as number)}
          >{n}</button>
        )
      )}
      <button className={btnBase} disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next">
        <IconChevRight />
      </button>
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AllProductsPage() {
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [page,      setPage]      = useState(1);
  const [sort,      setSort]      = useState("newest");
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [mobSb,     setMobSb]     = useState(false);
  const [filters,   setFilters]   = useState({ category: "", color: "", maxPrice: 999999, search: "" });

  useEffect(() => {
    fetch(`${BASE}/api/productview`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        const list: Product[] = Array.isArray(d) ? d : d.products ?? d.data ?? [];
        setProducts(list);
        if (list.length) {
          setFilters(f => ({ ...f, maxPrice: Math.max(...list.map(p => p.discountPrice)) }));
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleFilters = useCallback((f: typeof filters) => { setFilters(f); setPage(1); }, []);

  const filtered = products
    .filter(p => !filters.category || p.category?.name === filters.category)
    .filter(p => !filters.color || p.color?.name?.toLowerCase() === filters.color.toLowerCase())
    .filter(p => p.discountPrice <= (filters.maxPrice ?? 999999))
    .filter(p =>
      !filters.search ||
      p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.title.toLowerCase().includes(filters.search.toLowerCase())
    );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price-asc")  return a.discountPrice - b.discountPrice;
    if (sort === "price-desc") return b.discountPrice - a.discountPrice;
    if (sort === "name")       return a.name.localeCompare(b.name);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap');
        body { font-family: 'Jost', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        @keyframes rot { to { transform: rotate(360deg) } }
        .spin-anim { animation: rot 0.75s linear infinite; }
      `}</style>

      <div className="relative overflow-hidden bg-[#f7f3ee] min-h-screen text-[#1e1610]">

        {/* ── Main Layout ── */}
        <div className="flex max-w-[1440px] mx-auto px-6 py-9 gap-0 items-start">

          {/* ── Sidebar ── */}
          {!loading && !error && (
            <FiltersSidebar
              products={products}
              filters={filters}
              setFilters={handleFilters}
              mobileOpen={mobSb}
              onClose={() => setMobSb(false)}
            />
          )}

          {/* ── Main Content ── */}
          <main className="flex-1 pl-0 md:pl-[34px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 text-center">
                <div className="spin-anim w-11 h-11 border-[3px] border-[#e6ddd3] border-t-[#b5623b] rounded-full" />
                <p className="text-[#7a6b5e] text-[0.9rem]">Loading products…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 text-center">
                <p className="text-red-700 text-[0.9rem]">⚠ Failed to load: {error}</p>
              </div>
            ) : (
              <>
                {/* Top Bar */}
                <div className="flex justify-between items-center mb-6 gap-2.5 flex-wrap mt-10">
                  <div className="flex items-center gap-3">
                    {/* Mobile Filter Button */}
                    <button
                      onClick={() => setMobSb(true)}
                      className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-white text-sm cursor-pointer text-[#1e1610] hover:border-[#1e1610] transition-all duration-200"
                    >
                      <IconFilter /> Filters
                    </button>
                    <p className="text-[0.84rem] text-[#7a6b5e]">
                      <strong className="text-[#1e1610] font-semibold">{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""} found
                    </p>
                  </div>

                  <select
                    className="px-3.5 py-2 border border-[#e6ddd3] rounded-lg text-sm bg-white text-[#1e1610] cursor-pointer outline-none focus:border-[#b5623b] transition-all duration-200"
                    value={sort}
                    onChange={e => { setSort(e.target.value); setPage(1); }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>

                {/* Grid or Empty State */}
                {paginated.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 text-center">
                    <div className="text-[2.8rem]">🌸</div>
                    <p className="text-[#7a6b5e] text-[0.9rem]">No products match your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {paginated.map(p => (
                      <ProductCard
                        key={p._id}
                        product={p}
                        onQuickView={() => setQuickView(p)}
                      />
                    ))}
                  </div>
                )}

                <Pagination
                  page={page}
                  total={filtered.length}
                  perPage={PER_PAGE}
                  onChange={setPage}
                />
              </>
            )}
          </main>
        </div>

        {/* ── Quick View Modal ── */}
        {quickView && (
          <QuickViewModal
            product={quickView}
            onClose={() => setQuickView(null)}
          />
        )}
      </div>
    </>
  );
}