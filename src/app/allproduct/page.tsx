"use client";

import Header from "@/components/Header/Header";
import Header2 from "@/components/Header/Header2";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SubCategory { _id: string; name: string; }
interface Category    { _id: string; name: string; subCategories: SubCategory[]; }
interface Color       { _id: string; name: string; }
interface Product {
  _id: string; name: string; title: string; description: string;
  exactPrice: number; discountPrice: number;
  category: Category; subCategory: string | { _id: string };
  color: Color; stock: number; deliveryInfo: string;
  images: string[]; createdAt: string;
}
interface Filters {
  categories:    string[];   // selected category names  (multi)
  subCategories: string[];   // selected subCategory _ids (multi)
  color:  string;
  maxPrice: number;
  search: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const BASE     = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7000";
const imgUrl   = (p: string) => p?.startsWith("http") ? p : `${BASE}${p}`;
const discount = (exact: number, disc: number) =>
  exact > 0 ? Math.round(((exact - disc) / exact) * 100) : 0;
const PER_PAGE = 12;

const COLOR_MAP: Record<string, string> = {
  pink:"#f9a8d4", red:"#f87171",   white:"#f0ece6",  blue:"#93c5fd",
  yellow:"#fde047", green:"#86efac", purple:"#c4b5fd", orange:"#fdba74",
  black:"#374151",  peach:"#ffb997", lavender:"#d8b4fe", coral:"#ff7f7f",
  crimson:"#dc2626", rose:"#fda4af", cream:"#fef3c7",  ivory:"#fef9c3",
  salmon:"#fca5a5",  teal:"#5eead4", mint:"#6ee7b7",   sky:"#7dd3fc",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getSubId = (p: Product): string =>
  typeof p.subCategory === "object" ? (p.subCategory as any)?._id ?? "" : p.subCategory ?? "";

// ─── Icons ─────────────────────────────────────────────────────────────────────
const IcoCart = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IcoClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoChevL = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6"/></svg>
);
const IcoChevR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18l6-6-6-6"/></svg>
);
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IcoFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);
const IcoX = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path d="M1.5 6l3 3 5.5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── CheckboxRow ───────────────────────────────────────────────────────────────
function CheckboxRow({
  checked, onChange, label, count, indent = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`
        flex items-center gap-[9px] w-full text-left rounded-[5px]
        py-[5px] transition-colors duration-100 cursor-pointer bg-transparent border-none
        hover:bg-[#f3ede6] group
        ${indent ? "pl-[10px]" : "pl-[2px]"}
      `}
    >
      <span className={`
        w-[17px] h-[17px] flex-shrink-0 rounded-[4px] border-[1.8px] flex items-center justify-center
        transition-all duration-150
        ${checked
          ? "bg-[#1e1610] border-[#1e1610]"
          : "bg-white border-[#c0b5aa] group-hover:border-[#1e1610]"}
      `}>
        {checked && <IcoCheck />}
      </span>
      <span className={`
        text-[0.83rem] leading-snug flex-1
        ${checked ? "font-semibold text-[#1e1610]" : "text-[#2d2520] group-hover:text-[#1e1610]"}
      `}>
        {label}
        {count !== undefined && (
          <span className="font-normal text-[#9e8e80]"> ({count})</span>
        )}
      </span>
    </button>
  );
}

// ─── QuickViewModal ────────────────────────────────────────────────────────────
function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const disc = discount(product.exactPrice, product.discountPrice);
  const colorHex = COLOR_MAP[product.color?.name?.toLowerCase()] ?? "#e5e7eb";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  return (
    <div ref={ref} onClick={e => e.target === ref.current && onClose()}
      className="fixed inset-0 z-[400] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ animation: "qvFade .2s ease" }}>
      <style>{`
        @keyframes qvFade  { from{opacity:0} to{opacity:1} }
        @keyframes qvSlide { from{opacity:0;transform:translateY(24px) scale(.98)} to{opacity:1;transform:none} }
        .qv-box { animation: qvSlide .26s cubic-bezier(.34,1.3,.64,1); }
      `}</style>

      <div className="qv-box bg-white rounded-2xl w-full max-w-[900px] max-h-[92vh] overflow-y-auto relative shadow-[0_32px_80px_rgba(0,0,0,.22)]">
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full border border-[#e6ddd3] bg-white flex items-center justify-center cursor-pointer hover:bg-[#1e1610] hover:text-white transition-all">
          <IcoClose />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery */}
          <div className="p-7 border-b md:border-b-0 md:border-r border-[#e6ddd3]">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#f0ebe3] mb-3">
              {product.images[imgIdx]
                ? <img src={imgUrl(product.images[imgIdx])} alt={product.name} className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-[#f0ebe3]"/>}
              {disc > 0 && (
                <span className="absolute top-3 left-3 bg-[#b5623b] text-white px-2.5 py-1 rounded-full text-[.7rem] font-semibold">−{disc}%</span>
              )}
              {product.images.length > 1 && (<>
                <button onClick={() => setImgIdx(i => (i - 1 + product.images.length) % product.images.length)}
                  className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-[#1e1610] hover:text-white transition-all cursor-pointer">
                  <IcoChevL/>
                </button>
                <button onClick={() => setImgIdx(i => (i + 1) % product.images.length)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-[#1e1610] hover:text-white transition-all cursor-pointer">
                  <IcoChevR/>
                </button>
              </>)}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {product.images.map((src, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-14 h-14 rounded-lg border-2 overflow-hidden cursor-pointer p-0 bg-[#f0ebe3] transition-all ${i === imgIdx ? "border-[#b5623b]" : "border-transparent hover:border-[#1e1610]"}`}>
                    <img src={imgUrl(src)} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[.68rem] uppercase tracking-widest text-[#7a6b5e] font-bold">{product.category?.name}</span>
              {product.color?.name && (
                <span className="text-[.7rem] px-2.5 py-[3px] rounded-full bg-[#f0ebe3] font-medium flex items-center gap-1.5 border border-[#e6ddd3]">
                  <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: colorHex }}/>
                  {product.color.name}
                </span>
              )}
            </div>
            <h2 className="font-serif text-[clamp(1.3rem,2.4vw,1.75rem)] font-bold leading-tight mb-1">{product.name}</h2>
            {product.title !== product.name && <p className="text-[.84rem] text-[#7a6b5e] mb-4 leading-relaxed">{product.title}</p>}
            <div className="flex items-baseline gap-2.5 flex-wrap mb-3">
              <span className="text-[1.6rem] font-bold leading-none">₹{product.discountPrice.toLocaleString()}</span>
              {disc > 0 && (<>
                <span className="text-[.94rem] text-[#b0a090] line-through">₹{product.exactPrice.toLocaleString()}</span>
                <span className="text-[.7rem] bg-[#dcfce7] text-[#3d8b5e] px-2.5 py-[3px] rounded-full font-bold">Save {disc}%</span>
              </>)}
            </div>
            {product.description && (
              <p className="text-[.84rem] text-[#7a6b5e] leading-[1.75] mb-4 pb-4 border-b border-[#e6ddd3]">{product.description}</p>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${product.stock === 0 ? "bg-red-500" : product.stock <= 5 ? "bg-amber-500" : "bg-green-500"}`}/>
              <span className="text-[.8rem] text-[#7a6b5e] font-medium">
                {product.stock === 0 ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : `In stock · ${product.stock} available`}
              </span>
            </div>
            {product.stock > 0 && (
              <div className="flex gap-2.5 items-center flex-wrap">
                <div className="flex items-center border border-[#e6ddd3] rounded-[9px] overflow-hidden flex-shrink-0">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-11 bg-[#f0ebe3] text-lg cursor-pointer flex items-center justify-center hover:bg-[#e6ddd3] transition-all">−</button>
                  <span className="w-11 text-center text-[.9rem] font-bold border-x border-[#e6ddd3] h-11 flex items-center justify-center">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-10 h-11 bg-[#f0ebe3] text-lg cursor-pointer flex items-center justify-center hover:bg-[#e6ddd3] transition-all">+</button>
                </div>
                <button onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 2200); }}
                  className={`flex-1 h-11 rounded-[9px] font-semibold text-[.88rem] cursor-pointer flex items-center justify-center gap-2 transition-all ${added ? "bg-[#3d8b5e] text-white" : "bg-[#1e1610] text-white hover:bg-[#7a3e22]"}`}>
                  {added
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Added!</>
                    : <><IcoCart s={15}/>Add to Cart</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, onQuickView }: { product: Product; onQuickView: () => void }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const disc = discount(product.exactPrice, product.discountPrice);

  return (
    <article
      className="bg-white rounded-[13px] overflow-hidden border border-[#e6ddd3] shadow-[0_2px_18px_rgba(30,22,16,.07)] hover:shadow-[0_16px_50px_rgba(30,22,16,.16)] hover:-translate-y-1.5 transition-all duration-200 cursor-pointer group"
      onMouseEnter={() => product.images.length > 1 && setIdx(1)}
      onMouseLeave={() => setIdx(0)}
      onClick={() => router.push(`/product/${product._id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-[#f0ebe3]">
        {product.images[idx]
          ? <img src={imgUrl(product.images[idx])} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.07] transition-transform duration-500"/>
          : <div className="w-full h-full flex items-center justify-center text-[#b0a090] text-sm">No Image</div>}
        {disc > 0 && <span className="absolute top-2.5 left-2.5 bg-[#b5623b] text-white px-2.5 py-[3px] rounded-full text-[.68rem] font-semibold">−{disc}%</span>}
        {product.stock === 0 && <span className="absolute top-2.5 left-2.5 bg-red-100 text-red-700 px-2.5 py-[3px] rounded-full text-[.68rem] font-semibold">Sold Out</span>}
        <div className="absolute inset-0 flex items-end justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="px-3 py-1.5 bg-white/95 rounded-lg text-[.76rem] font-semibold cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,.11)] hover:bg-[#1e1610] hover:text-white transition-all"
            onClick={e => { e.stopPropagation(); onQuickView(); }}>
            Quick View
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-[1rem] font-semibold leading-snug mb-0.5">{product.name}</h3>
        <p className="text-[.76rem] text-[#7a6b5e] mb-2 truncate">{product.title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[.97rem] font-semibold">₹{product.discountPrice.toLocaleString()}</span>
          {disc > 0 && <span className="text-[.75rem] text-[#b0a090] line-through">₹{product.exactPrice.toLocaleString()}</span>}
        </div>
      </div>
    </article>
  );
}

// ─── FiltersSidebar ────────────────────────────────────────────────────────────
function FiltersSidebar({
  products, allCatData, filters, setFilters, mobileOpen, onClose,
}: {
  products:   Product[];
  allCatData: Category[];
  filters:    Filters;
  setFilters: (f: Filters) => void;
  mobileOpen: boolean;
  onClose:    () => void;
}) {
  const router = useRouter();

  const catNames = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))) as string[];
  const colorNames = Array.from(new Set(products.map(p => p.color?.name).filter(Boolean))) as string[];

  const prices = products.map(p => p.discountPrice);
  const gMin = prices.length ? Math.min(...prices) : 0;
  const gMax = prices.length ? Math.max(...prices) : 10000;

  const catCount = (name: string) => products.filter(p => p.category?.name === name).length;

  const getMergedSubs = (catName: string): { name: string; ids: string[] }[] => {
    const apiCat = allCatData.find(c => c.name === catName);
    const merged: { name: string; ids: string[] }[] = [];
    (apiCat?.subCategories ?? []).forEach(sc => {
      const ex = merged.find(m => m.name === sc.name);
      if (ex) ex.ids.push(sc._id);
      else merged.push({ name: sc.name, ids: [sc._id] });
    });
    return merged;
  };

  const subCount = (catName: string, ids: string[]) =>
    products.filter(p => p.category?.name === catName && ids.includes(getSubId(p))).length;

  const toggleCat = (name: string) => {
    const next = filters.categories.includes(name)
      ? filters.categories.filter(c => c !== name)
      : [...filters.categories, name];
    let nextSubs = filters.subCategories;
    if (!next.includes(name)) {
      const removedSubs = (allCatData.find(c => c.name === name)?.subCategories ?? []).map(s => s._id);
      nextSubs = nextSubs.filter(id => !removedSubs.includes(id));
    }
    setFilters({ ...filters, categories: next, subCategories: nextSubs });
  };

  const toggleSub = (ids: string[]) => {
    const anyOn = ids.some(id => filters.subCategories.includes(id));
    const next = anyOn
      ? filters.subCategories.filter(id => !ids.includes(id))
      : [...filters.subCategories, ...ids.filter(id => !filters.subCategories.includes(id))];
    setFilters({ ...filters, subCategories: next });
  };

  const isSubOn = (ids: string[]) => ids.some(id => filters.subCategories.includes(id));

  const handleColor = (c: string) => {
    const next = filters.color === c ? "" : c;
    setFilters({ ...filters, color: next });
    const params = new URLSearchParams(window.location.search);
    next ? params.set("color", next) : params.delete("color");
    window.history.replaceState({}, "", params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname);
  };

  const reset = () => {
    setFilters({ categories: [], subCategories: [], color: "", maxPrice: gMax, search: "" });
    router.push(window.location.pathname, { scroll: false });
  };

  const totalActive = filters.categories.length + filters.subCategories.length + (filters.color ? 1 : 0);

  return (
    <>
   
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-[199] backdrop-blur-sm md:hidden" onClick={onClose}/>}

      <aside className={`
        w-[252px] flex-shrink-0 bg-white rounded-[14px] border border-[#e6ddd3] sticky top-6  mt-10
        max-md:fixed max-md:top-0 max-md:bottom-0 max-md:z-[200]
        max-md:w-[272px] max-md:rounded-none max-md:overflow-y-auto
        max-md:shadow-[4px_0_30px_rgba(0,0,0,.14)] max-md:transition-[left_.3s_ease]
        ${mobileOpen ? "max-md:left-0" : "max-md:-left-[280px]"}
      `}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6ddd3]">
          <div className="flex items-center gap-2">
            <span className="font-serif text-[1.06rem] font-semibold text-[#1e1610]">Filters</span>
            {totalActive > 0 && (
              <span className="bg-[#1e1610] text-white text-[.6rem] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center leading-none">
                {totalActive}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalActive > 0 && (
              <button type="button" onClick={reset}
                className="text-[#b5623b] text-[.74rem] font-medium bg-transparent border-none cursor-pointer hover:underline">
                Clear All
              </button>
            )}
            <button type="button" onClick={onClose} className="md:hidden bg-transparent border-none cursor-pointer text-[#1e1610]">
              <IcoClose/>
            </button>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-120px)]">

          {/* Search */}
          <div>
            <p className="sidebar-label">Search</p>
            <div className="flex items-center gap-2 border border-[#ddd5cb] rounded-[8px] px-3 py-[9px] bg-[#faf7f4] focus-within:border-[#b5623b] focus-within:bg-white transition-all">
              <IcoSearch/>
              <input
                className="border-none outline-none w-full text-[.83rem] bg-transparent text-[#1e1610] placeholder:text-[#b8aba0]"
                placeholder="Search products…"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
              {filters.search && (
                <button type="button" onClick={() => setFilters({ ...filters, search: "" })}
                  className="flex-shrink-0 text-[#a09080] hover:text-[#1e1610] bg-transparent border-none cursor-pointer flex items-center">
                  <IcoX/>
                </button>
              )}
            </div>
          </div>

          {/* Category + SubCategory */}
          <div>
            <p className="sidebar-label">Category</p>
            <div className="flex flex-col gap-0.5">
              {catNames.map(catName => {
                const isCatOn = filters.categories.includes(catName);
                const mergedSubs = getMergedSubs(catName);
                const count = catCount(catName);
                return (
                  <div key={catName}>
                    <CheckboxRow
                      checked={isCatOn}
                      onChange={() => toggleCat(catName)}
                      label={catName}
                      count={count}
                    />
                    {isCatOn && mergedSubs.length > 0 && (
                      <div
                        className="ml-[26px] border-l-2 border-[#ece5dd] pl-[10px] mb-1 flex flex-col gap-0.5"
                        style={{ animation: "scIn .18s ease both" }}
                      >
                        {mergedSubs.map(sc => (
                          <CheckboxRow
                            key={sc.name}
                            checked={isSubOn(sc.ids)}
                            onChange={() => toggleSub(sc.ids)}
                            label={sc.name}
                            count={subCount(catName, sc.ids)}
                            indent
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Colour swatches */}
          <div>
            <p className="sidebar-label">Colour</p>
            <div className="flex flex-wrap gap-x-[10px] gap-y-3">
              <button type="button"
                onClick={() => filters.color && handleColor(filters.color)}
                className="flex flex-col items-center gap-[3px] cursor-pointer bg-transparent border-none p-0 group/sw">
                <span className={`w-[28px] h-[28px] rounded-full border-2 flex items-center justify-center transition-all ${!filters.color ? "border-[#1e1610] scale-110" : "border-[#ddd5cb] group-hover/sw:border-[#b5623b]"}`}
                  style={{ background: !filters.color ? "#1e1610" : "conic-gradient(#f87171,#fde047,#86efac,#93c5fd,#c4b5fd,#f9a8d4,#f87171)" }}>
                  {!filters.color && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                </span>
                <span className={`text-[.58rem] ${!filters.color ? "font-bold text-[#1e1610]" : "text-[#7a6b5e]"}`}>All</span>
              </button>

              {colorNames.map(c => {
                const on = filters.color === c;
                return (
                  <button key={c} type="button" title={c} onClick={() => handleColor(c)}
                    className="flex flex-col items-center gap-[3px] cursor-pointer bg-transparent border-none p-0 group/sw">
                    <span
                      className={`w-[28px] h-[28px] rounded-full border-2 flex items-center justify-center transition-all ${on ? "border-[#1e1610] scale-110 shadow-[0_0_0_3px_rgba(30,22,16,.15)]" : "border-transparent hover:border-[#b5623b] hover:scale-105"}`}
                      style={{ background: COLOR_MAP[c.toLowerCase()] ?? "#e5e7eb" }}>
                      {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke={["white","yellow","cream","ivory","peach"].includes(c.toLowerCase()) ? "#1e1610" : "white"} strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/></svg>}
                    </span>
                    <span className={`text-[.58rem] capitalize ${on ? "font-bold text-[#1e1610]" : "text-[#7a6b5e]"}`}>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="sidebar-label flex justify-between">
              Max Price
              <span className="text-[.76rem] text-[#1e1610] font-semibold normal-case tracking-normal">
                ₹{(filters.maxPrice ?? gMax).toLocaleString()}
              </span>
            </p>
            <input type="range" min={gMin} max={gMax} value={filters.maxPrice ?? gMax}
              onChange={e => setFilters({ ...filters, maxPrice: +e.target.value })}
              className="w-full cursor-pointer h-1 mb-2 block accent-[#b5623b]"/>
            <div className="flex justify-between text-[.68rem] text-[#b0a090]">
              <span>₹{gMin.toLocaleString()}</span><span>₹{gMax.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar-label {
          font-size: .67rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .12em;
          color: #9e8e80;
          margin-bottom: .45rem;
          display: flex;
        }
        @keyframes scIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }: {
  page: number; total: number; perPage: number; onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const nums: (number | "…")[] = [];
  if (pages <= 7) { for (let i = 1; i <= pages; i++) nums.push(i); }
  else {
    nums.push(1);
    if (page > 3) nums.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push("…");
    nums.push(pages);
  }

  const base = "min-w-[36px] h-[36px] px-2 rounded-[8px] border border-[#e6ddd3] bg-white text-[.84rem] cursor-pointer flex items-center justify-center text-[#1e1610] transition-all hover:border-[#1e1610] disabled:opacity-30 disabled:cursor-not-allowed";
  const act  = "!bg-[#1e1610] !text-white !border-[#1e1610]";

  return (
    <nav className="flex gap-1.5 justify-center mt-14 flex-wrap" aria-label="Pagination">
      <button className={base} disabled={page === 1} onClick={() => onChange(page - 1)}><IcoChevL/></button>
      {nums.map((n, i) =>
        n === "…"
          ? <span key={`e${i}`} className="flex items-center px-1 text-[#b0a090]">…</span>
          : <button key={n} className={`${base} ${n === page ? act : ""}`} onClick={() => onChange(n as number)}>{n}</button>
      )}
      <button className={base} disabled={page === pages} onClick={() => onChange(page + 1)}><IcoChevR/></button>
    </nav>
  );
}

// ─── AllProductsPageInner (contains all the real logic) ───────────────────────
function AllProductsPageInner() {
  const searchParams = useSearchParams();
  const urlColor = searchParams.get("color") ?? "";

  const [products,     setProducts]     = useState<Product[]>([]);
  const [allCatData,   setAllCatData]   = useState<Category[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [page,         setPage]         = useState(1);
  const [sort,         setSort]         = useState("newest");
  const [quickView,    setQuickView]    = useState<Product | null>(null);
  const [mobSb,        setMobSb]        = useState(false);

  const [filters, setFilters] = useState<Filters>({
    categories:    [],
    subCategories: [],
    color:         urlColor,
    maxPrice:      999999,
    search:        "",
  });

  useEffect(() => {
    setFilters(f => ({ ...f, color: urlColor }));
    setPage(1);
  }, [urlColor]);

  useEffect(() => {
    fetch(`${BASE}/api/productview`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        const list: Product[] = Array.isArray(d) ? d : d.products ?? d.data ?? [];
        setProducts(list);
        if (list.length)
          setFilters(f => ({ ...f, maxPrice: Math.max(...list.map(p => p.discountPrice)) }));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${BASE}/api/categoryview`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => {
        const list: Category[] = Array.isArray(d) ? d : d.categories ?? d.data ?? [];
        setAllCatData(list);
      })
      .catch(e => console.warn("Category fetch failed:", e.message));
  }, []);

  const handleFilters = useCallback((f: Filters) => { setFilters(f); setPage(1); }, []);

  const filtered = products
    .filter(p => filters.categories.length === 0 || filters.categories.includes(p.category?.name))
    .filter(p => filters.subCategories.length === 0 || filters.subCategories.includes(getSubId(p)))
    .filter(p => !filters.color || p.color?.name?.toLowerCase() === filters.color.toLowerCase())
    .filter(p => p.discountPrice <= (filters.maxPrice ?? 999999))
    .filter(p => !filters.search ||
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

  const selectedSubNames = (() => {
    const seen = new Set<string>();
    return filters.subCategories
      .map(id => {
        for (const cat of allCatData) {
          const sc = cat.subCategories.find(s => s._id === id);
          if (sc && !seen.has(sc.name)) { seen.add(sc.name); return sc.name; }
        }
        return null;
      })
      .filter((n): n is string => n !== null);
  })();

  const totalActive = filters.categories.length + selectedSubNames.length + (filters.color ? 1 : 0);

  const headingText =
    selectedSubNames.length === 1 ? selectedSubNames[0]
    : filters.categories.length  === 1 ? filters.categories[0]
    : filters.color ? `${filters.color.charAt(0).toUpperCase()}${filters.color.slice(1)} Flowers`
    : "All Flowers";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap');
        body { font-family: 'Jost', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        @keyframes spin { to { transform: rotate(360deg) } }
        .spin { animation: spin .75s linear infinite; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none} }
        .fade-up { animation: fadeUp .4s ease both; }
      `}</style>

      <div className="bg-[#f7f3ee] min-h-screen text-[#1e1610]">
        <div className="flex max-w-[1440px] mx-auto px-5 py-9 gap-0 items-start">

          {!loading && !error && (
            <FiltersSidebar
              products={products}
              allCatData={allCatData}
              filters={filters}
              setFilters={handleFilters}
              mobileOpen={mobSb}
              onClose={() => setMobSb(false)}
            />
          )}

          <main className="flex-1 md:pl-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[360px] gap-4">
                <div className="spin w-11 h-11 border-[3px] border-[#e6ddd3] border-t-[#b5623b] rounded-full"/>
                <p className="text-[#7a6b5e] text-[.9rem]">Loading products…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[360px]">
                <p className="text-red-600 text-[.9rem]">⚠ Failed to load: {error}</p>
              </div>
            ) : (
              <>
                <div className="fade-up mt-10 mb-6">
                  <nav className="flex items-center gap-2 text-[.77rem] text-[#b0a090] mb-3 flex-wrap">
                    <a href="/" className="hover:text-[#1e1610] transition-colors">Home</a>
                    <span>/</span>
                    <span className="text-[#7a6b5e]">Shop</span>
                    {filters.categories.length === 1 && (
                      <><span>/</span>
                        <button type="button"
                          onClick={() => handleFilters({ ...filters, categories: [], subCategories: [] })}
                          className="text-[#7a6b5e] hover:text-[#1e1610] bg-transparent border-none cursor-pointer transition-colors">
                          {filters.categories[0]}
                        </button>
                      </>
                    )}
                    {selectedSubNames.length === 1 && (
                      <><span>/</span><span className="text-[#1e1610] font-medium">{selectedSubNames[0]}</span></>
                    )}
                  </nav>

                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] font-bold leading-tight">
                        {headingText}
                        {filters.color && (
                          <span className="ml-3 inline-block w-[15px] h-[15px] rounded-full align-middle border border-black/10"
                            style={{ background: COLOR_MAP[filters.color.toLowerCase()] ?? "#e5e7eb", verticalAlign: "middle" }}/>
                        )}
                      </h1>
                      <p className="text-[.84rem] text-[#7a6b5e] mt-1">
                        <strong className="text-[#1e1610] font-semibold">{filtered.length}</strong>
                        {" "}of{" "}
                        <strong className="text-[#1e1610] font-semibold">{products.length}</strong> products
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button type="button" onClick={() => setMobSb(true)}
                        className="md:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-white text-sm cursor-pointer hover:border-[#1e1610] transition-all">
                        <IcoFilter/>
                        Filters
                        {totalActive > 0 && (
                          <span className="ml-0.5 bg-[#1e1610] text-white text-[.58rem] w-[17px] h-[17px] rounded-full flex items-center justify-center font-bold">{totalActive}</span>
                        )}
                      </button>
                      <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
                        className="px-3.5 py-2 border border-[#e6ddd3] rounded-lg text-sm bg-white cursor-pointer outline-none focus:border-[#b5623b] transition-all">
                        <option value="newest">Newest First</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="name">Name A–Z</option>
                      </select>
                    </div>
                  </div>
                </div>

                {paginated.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 text-center">
                    <div className="text-5xl">🌸</div>
                    <p className="text-[#7a6b5e] text-[.9rem]">No products match your filters.</p>
                    <button type="button"
                      onClick={() => handleFilters({ categories: [], subCategories: [], color: "", maxPrice: 999999, search: "" })}
                      className="px-5 py-2 rounded-full bg-[#1e1610] text-white text-sm font-semibold hover:bg-[#7a3e22] transition-colors cursor-pointer border-none">
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {paginated.map(p => (
                      <ProductCard key={p._id} product={p} onQuickView={() => setQuickView(p)}/>
                    ))}
                  </div>
                )}

                <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage}/>
              </>
            )}
          </main>
        </div>

        {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)}/>}
      </div>
    </>
  );
}

// ─── AllProductsPage — default export with Suspense wrapper ───────────────────
export default function AllProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#f7f3ee] min-h-screen flex flex-col items-center justify-center gap-4">
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ animation: "spin .75s linear infinite" }}
            className="w-11 h-11 border-[3px] border-[#e6ddd3] border-t-[#b5623b] rounded-full"/>
          <p className="text-[#7a6b5e] text-[.9rem]">Loading products…</p>
        </div>
      }
    >
      <AllProductsPageInner />
    </Suspense>
  );
}