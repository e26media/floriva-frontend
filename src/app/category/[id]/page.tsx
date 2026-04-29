'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubCategory { _id: string; name: string }
interface Category {
  _id: string; name: string; description?: string
  subCategories: SubCategory[]
}
interface Color { _id: string; name: string }
interface Country {
  _id: string;
  name: string;
}
interface Product {
  _id: string; name: string; title: string; description: string
  exactPrice: number; discountPrice: number
  category: Category; subCategory: string; color: Color
  stock: number; deliveryInfo: string; images: string[]; createdAt: string
  country?: Country | string;
}

// ─── Helper to get country name from product ───────────────────────────────────
const getProductCountry = (product: Product): string => {
  if (!product.country) return "";
  if (typeof product.country === "string") return product.country.toLowerCase().trim();
  if (product.country.name) return product.country.name.toLowerCase().trim();
  return "";
};

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7000';
const imgSrc = (p: string) => `${BASE}${p}`
const pct = (e: number, d: number) => e > 0 ? Math.round(((e - d) / e) * 100) : 0
const PER_PAGE = 12

const COLOR_MAP: Record<string, string> = {
  pink: '#f9a8d4', red: '#f87171', white: '#f0ece6', blue: '#93c5fd',
  yellow: '#fde047', green: '#86efac', purple: '#c4b5fd', orange: '#fdba74',
  black: '#374151', peach: '#ffb997', lavender: '#d8b4fe', coral: '#ff7f7f',
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCart = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
)
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconChevLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const IconChevRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
)
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
)

// ─── Quick View Modal ─────────────────────────────────────────────────────────
function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const discount = pct(product.exactPrice, product.discountPrice)
  const colorHex = COLOR_MAP[product.color?.name?.toLowerCase()] ?? '#e5e7eb'
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-[400] bg-[rgba(20,14,10,0.58)] backdrop-blur-md flex items-center justify-center p-4"
      style={{ animation: 'fadein 0.2s ease' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ animation: 'slideup 0.28s cubic-bezier(0.34,1.3,0.64,1)' }}
        className="bg-white rounded-[18px] w-full max-w-[900px] max-h-[92vh] overflow-y-auto relative shadow-[0_36px_90px_rgba(20,14,10,0.26)]"
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full border border-[#e6ddd3] bg-white flex items-center justify-center cursor-pointer text-[#1e1610] shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:bg-[#1e1610] hover:text-[#f7f3ee] transition-all duration-200"
        >
          <IconClose />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery */}
          <div className="p-7 border-b md:border-b-0 md:border-r border-[#e6ddd3]">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#f0ebe3] mb-3">
              {product.images[activeImg] ? (
                <img src={imgSrc(product.images[activeImg])} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#f0ebe3]">
                  <svg viewBox="0 0 80 80" fill="none" width="80">
                    <rect width="80" height="80" rx="8" fill="#ede8e1" />
                    <path d="M18 55L30 38l10 12 10-14 12 19z" fill="#d4cdc4" />
                    <circle cx="26" cy="26" r="6" fill="#d4cdc4" />
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
                    className="absolute top-1/2 left-2.5 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-white/90 flex items-center justify-center cursor-pointer text-[#1e1610] shadow-[0_2px_10px_rgba(0,0,0,0.1)] hover:bg-[#1e1610] hover:text-[#f7f3ee] transition-all duration-200 border-none"
                    onClick={() => setActiveImg(i => (i - 1 + product.images.length) % product.images.length)}
                  >
                    <IconChevLeft />
                  </button>
                  <button
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-white/90 flex items-center justify-center cursor-pointer text-[#1e1610] shadow-[0_2px_10px_rgba(0,0,0,0.1)] hover:bg-[#1e1610] hover:text-[#f7f3ee] transition-all duration-200 border-none"
                    onClick={() => setActiveImg(i => (i + 1) % product.images.length)}
                  >
                    <IconChevRight />
                  </button>
                </>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {product.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-[9px] border-2 overflow-hidden cursor-pointer transition-all duration-200 p-0 bg-[#f0ebe3] flex-shrink-0 ${i === activeImg ? 'border-[#b5623b]' : 'border-transparent hover:border-[#1e1610]'}`}
                  >
                    <img src={imgSrc(src)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="text-[0.68rem] uppercase tracking-[0.13em] text-[#7a6b5e] font-bold">
                {product.category?.name}
              </span>
              {product.color?.name && (
                <span className="text-[0.7rem] px-2.5 py-[3px] rounded-full bg-[#f0ebe3] text-[#1e1610] font-medium flex items-center gap-1.5 border border-[#e6ddd3]">
                  <span className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0" style={{ background: colorHex }} />
                  {product.color.name}
                </span>
              )}
            </div>
            <h2 className="font-serif text-[clamp(1.35rem,2.4vw,1.8rem)] font-bold leading-tight mb-1.5">
              {product.name}
            </h2>
            {product.title !== product.name && (
              <p className="text-[0.84rem] text-[#7a6b5e] mb-4 leading-relaxed">{product.title}</p>
            )}
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
            {product.description && (
              <p className="text-[0.85rem] text-[#7a6b5e] leading-[1.75] mb-4 pb-4 border-b border-[#e6ddd3]">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${product.stock === 0 ? 'bg-red-500' : product.stock <= 5 ? 'bg-amber-500' : 'bg-green-500'}`} />
              <span className="text-[0.8rem] text-[#7a6b5e] font-medium">
                {product.stock === 0
                  ? 'Out of stock'
                  : product.stock <= 5
                  ? `Only ${product.stock} left — order soon`
                  : `In stock · ${product.stock} available`}
              </span>
            </div>
            {product.stock > 0 && (
              <div className="flex gap-2.5 items-center mb-2.5 flex-wrap">
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
                <button
                  onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 2200) }}
                  className={`flex-1 h-11 rounded-[9px] border-none font-semibold text-[0.88rem] cursor-pointer tracking-[0.05em] flex items-center justify-center gap-2 transition-all duration-200 ${added ? 'bg-[#3d8b5e] text-white' : 'bg-[#1e1610] text-[#f7f3ee] hover:bg-[#7a3e22]'}`}
                >
                  {added ? <><IconCheck /> Added to Cart!</> : <><IconCart size={16} /> Add to Cart</>}
                </button>
              </div>
            )}
            {product.deliveryInfo && (
              <p className="text-[0.75rem] text-[#b0a090] mt-3 pt-3 border-t border-[#e6ddd3]">
                🚚 {product.deliveryInfo}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onQuickView }: { product: Product; onQuickView: () => void }) {
  const router = useRouter()
  const [imgIdx, setImgIdx] = useState(0)
  const discount = pct(product.exactPrice, product.discountPrice)

  return (
    <article
      className="bg-white rounded-[13px] overflow-hidden shadow-[0_2px_18px_rgba(30,22,16,0.07)] transition-all duration-200 cursor-pointer border border-[#e6ddd3] hover:shadow-[0_16px_50px_rgba(30,22,16,0.16)] hover:-translate-y-1.5 group"
      onMouseEnter={() => product.images.length > 1 && setImgIdx(1)}
      onMouseLeave={() => setImgIdx(0)}
      onClick={() => router.push(`/product/${product._id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-[#f0ebe3]">
        {product.images[imgIdx] ? (
          <img
            src={imgSrc(product.images[imgIdx])}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#b0a090] text-sm">No Image</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-[#b5623b] text-white px-2.5 py-[3px] rounded-full text-[0.68rem] font-semibold">
            −{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-100 text-red-800 px-2.5 py-[3px] rounded-full text-[0.68rem] font-semibold">
            Sold Out
          </span>
        )}
        <div className="absolute inset-0 bg-[rgba(30,22,16,0.04)] flex flex-col items-end justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            className="px-3.5 py-1.5 bg-white/95 border-none rounded-[7px] text-[0.76rem] cursor-pointer font-semibold text-[#1e1610] shadow-[0_2px_10px_rgba(0,0,0,0.11)] whitespace-nowrap hover:bg-[#1e1610] hover:text-[#f7f3ee] transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); onQuickView() }}
          >
            Quick View
          </button>
        </div>
      </div>
      <div className="p-[15px]">
        <h3 className="font-serif text-[1.02rem] font-semibold leading-snug mb-[3px]">{product.name}</h3>
        <p className="text-[0.77rem] text-[#7a6b5e] mb-2.5 overflow-hidden text-ellipsis whitespace-nowrap">{product.title}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[0.98rem] font-semibold text-[#1e1610]">₹{product.discountPrice.toLocaleString()}</span>
          {discount > 0 && (
            <span className="text-[0.76rem] text-[#b0a090] line-through">₹{product.exactPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, onChange }: {
  page: number; total: number; perPage: number; onChange: (p: number) => void
}) {
  const pages = Math.ceil(total / perPage)
  if (pages <= 1) return null
  const nums: (number | '…')[] = []
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i)
  } else {
    nums.push(1)
    if (page > 3) nums.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i)
    if (page < pages - 2) nums.push('…')
    nums.push(pages)
  }
  const btn = 'min-w-[38px] h-[38px] px-2 rounded-[9px] border border-[#e6ddd3] bg-white text-[0.86rem] cursor-pointer flex items-center justify-center text-[#1e1610] transition-all duration-200 hover:border-[#1e1610] disabled:opacity-30 disabled:cursor-not-allowed'
  return (
    <nav className="flex gap-1.5 justify-center mt-14 flex-wrap" aria-label="Pagination">
      <button className={btn} disabled={page === 1} onClick={() => onChange(page - 1)}>
        <IconChevLeft />
      </button>
      {nums.map((n, i) =>
        n === '…'
          ? <span key={`e${i}`} className="flex items-center px-1 text-[#b0a090]">…</span>
          : <button key={n} className={`${btn} ${n === page ? '!bg-[#1e1610] !text-[#f7f3ee] !border-[#1e1610]' : ''}`} onClick={() => onChange(n as number)}>{n}</button>
      )}
      <button className={btn} disabled={page === pages} onClick={() => onChange(page + 1)}>
        <IconChevRight />
      </button>
    </nav>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  // The URL id can be a CATEGORY _id OR a SUBCATEGORY _id (both come from CategoryNav)
  const urlId = params?.id as string

  const [category, setCategory]       = useState<Category | null>(null)
  const [activeSub, setActiveSub]     = useState<string>('all')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [sort, setSort]               = useState('newest')
  const [page, setPage]               = useState(1)
  const [quickView, setQuickView]     = useState<Product | null>(null)

  useEffect(() => {
    if (!urlId) return
    setTimeout(() => {
      setLoading(true)
      setError('')
    }, 0)

    Promise.all([
      // Fetch ALL categories
      fetch(`${BASE}/api/categoryview`)
        .then(r => {
          if (!r.ok) throw new Error(`Failed to load categories (${r.status})`)
          return r.json()
        }),
      // Fetch ALL products
      fetch(`${BASE}/api/productview`)
        .then(r => {
          if (!r.ok) throw new Error(`Failed to load products (${r.status})`)
          return r.json()
        }),
    ])
      .then(([catData, prodData]) => {
        // Extract categories from response
        let categories: Category[] = [];
        if (catData.success && Array.isArray(catData.data)) {
          categories = catData.data;
        } else if (Array.isArray(catData)) {
          categories = catData;
        } else if (catData.categories) {
          categories = catData.categories;
        } else if (catData.data) {
          categories = catData.data;
        }

        // Extract products from response
        let allProductsData: Product[] = [];
        if (prodData.success && Array.isArray(prodData.data)) {
          allProductsData = prodData.data;
        } else if (Array.isArray(prodData)) {
          allProductsData = prodData;
        } else if (prodData.products) {
          allProductsData = prodData.products;
        } else if (prodData.data) {
          allProductsData = prodData.data;
        } else {
          allProductsData = prodData.result || [];
        }

        // Filter products to ONLY show INDIAN products
        // Default to India for the category page
        const indianProducts = allProductsData.filter(p => {
          const productCountry = getProductCountry(p);
          return productCountry === 'india';
        });

        console.log(`Total products: ${allProductsData.length}, Indian products: ${indianProducts.length}`);

        let matchedCategory: Category | null = null
        let matchedSubId = 'all'

        // 1. Try matching urlId as a top-level category _id
        const directCat = categories.find(c => c._id === urlId)
        if (directCat) {
          matchedCategory = directCat
          matchedSubId = 'all'
        } else {
          // 2. Try matching urlId as a subcategory _id inside any category
          for (const cat of categories) {
            const sub = cat.subCategories?.find(s => s._id === urlId)
            if (sub) {
              matchedCategory = cat
              matchedSubId = sub._id
              break
            }
          }
        }

        if (!matchedCategory) {
          throw new Error('Category not found. Please check the URL.')
        }

        // Only keep INDIAN products that belong to this category
        const categoryProducts = indianProducts.filter(
          p => p.category?._id === matchedCategory!._id
        )

        setCategory(matchedCategory)
        setActiveSub(matchedSubId)
        setAllProducts(categoryProducts)
      })
      .catch(e => {
        console.error("Error:", e);
        setError(e.message);
      })
      .finally(() => setLoading(false))
  }, [urlId])

  const handleSubChange = useCallback((subId: string) => {
    setActiveSub(subId)
    setPage(1)
  }, [])

  // Filter products by active subcategory tab
  const filtered = activeSub === 'all'
    ? allProducts
    : allProducts.filter(p => p.subCategory === activeSub)

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price-asc')  return a.discountPrice - b.discountPrice
    if (sort === 'price-desc') return b.discountPrice - a.discountPrice
    if (sort === 'name')       return a.name.localeCompare(b.name)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const activeSubName = activeSub !== 'all'
    ? category?.subCategories.find(s => s._id === activeSub)?.name
    : undefined

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap');
        body { font-family: 'Jost', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
        @keyframes rot    { to { transform: rotate(360deg) } }
        @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideup { from { opacity:0; transform: translateY(26px) scale(0.98) } to { opacity:1; transform:none } }
        @keyframes pageIn { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:none } }
        .spin-anim  { animation: rot 0.75s linear infinite; }
        .page-enter { animation: pageIn 0.3s ease; }
      `}</style>

      <div className="relative bg-[#f7f3ee] min-h-screen text-[#1e1610] pt-20">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <div className="spin-anim w-11 h-11 border-[3px] border-[#e6ddd3] border-t-[#b5623b] rounded-full" />
            <p className="text-[#7a6b5e] text-[0.9rem]">Loading products…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
            <div className="text-4xl">😕</div>
            <p className="font-serif text-xl font-semibold">Something went wrong</p>
            <p className="text-[0.86rem] text-[#7a6b5e] max-w-sm">{error}</p>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1e1610] text-[#f7f3ee] text-sm border-none cursor-pointer hover:bg-[#7a3e22] transition-all duration-200 mt-2"
            >
              <IconArrowLeft /> Go Back
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && category && (
          <div className="max-w-[1440px] mx-auto px-6 py-10 page-enter">

            {/* India Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1610] text-white text-[0.72rem] font-semibold tracking-wide">
                <span>🇮🇳</span>
                <span>India</span>
                <span className="opacity-50">·</span>
                <span>INR</span>
              </span>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[0.78rem] text-[#b0a090] mb-8 flex-wrap">
              <Link href="/" className="hover:text-[#b5623b] transition-colors">Home</Link>
              <span>/</span>
              <Link href="/allproduct" className="hover:text-[#b5623b] transition-colors">All Products</Link>
              <span>/</span>
              <button
                onClick={() => handleSubChange('all')}
                className="hover:text-[#b5623b] transition-colors bg-transparent border-none cursor-pointer text-[#b0a090] p-0 text-[0.78rem]"
              >
                {category.name}
              </button>
              {activeSubName && (
                <>
                  <span>/</span>
                  <span className="text-[#1e1610] font-medium">{activeSubName}</span>
                </>
              )}
            </nav>

            {/* Header */}
            <div className="mb-10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#b5623b] font-semibold mb-1.5">
                    Indian Collection
                  </p>
                  <h1 className="font-serif text-[clamp(2rem,5vw,3.2rem)] font-bold leading-none text-[#1e1610]">
                    {activeSubName ?? category.name}
                  </h1>
                  {activeSubName && (
                    <p className="text-[0.84rem] text-[#7a6b5e] mt-1.5">
                      in <span className="text-[#b5623b] font-medium">{category.name}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#e6ddd3] bg-white text-[0.8rem] cursor-pointer text-[#7a6b5e] hover:border-[#1e1610] hover:text-[#1e1610] transition-all duration-200 mt-1 flex-shrink-0"
                >
                  <IconArrowLeft /> Back
                </button>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <div className="h-px flex-1 bg-gradient-to-r from-[#b5623b]/30 to-transparent" />
                <span className="text-[#d4cdc4] text-lg">✦</span>
                <div className="h-px w-12 bg-[#e6ddd3]" />
              </div>
            </div>

            {/* Subcategory Tabs */}
            {category.subCategories && category.subCategories.length > 0 && (
              <div className="mb-8 overflow-x-auto -mx-1">
                <div className="flex gap-2 px-1 pb-1 min-w-max">
                  <button
                    onClick={() => handleSubChange('all')}
                    className={`px-5 py-2.5 rounded-full border text-[0.84rem] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
                      activeSub === 'all'
                        ? 'bg-[#1e1610] text-[#f7f3ee] border-[#1e1610] shadow-[0_4px_14px_rgba(30,22,16,0.2)]'
                        : 'border-[#e6ddd3] bg-white text-[#7a6b5e] hover:border-[#b5623b] hover:text-[#b5623b]'
                    }`}
                  >
                    All {category.name}
                    <span className={`ml-2 text-[0.72rem] px-1.5 py-0.5 rounded-full ${activeSub === 'all' ? 'bg-white/20' : 'bg-[#f0ebe3]'}`}>
                      {allProducts.length}
                    </span>
                  </button>
                  {category.subCategories.map(sub => {
                    const count = allProducts.filter(p => p.subCategory === sub._id).length
                    const isActive = activeSub === sub._id
                    return (
                      <button
                        key={sub._id}
                        onClick={() => handleSubChange(sub._id)}
                        className={`px-5 py-2.5 rounded-full border text-[0.84rem] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${
                          isActive
                            ? 'bg-[#1e1610] text-[#f7f3ee] border-[#1e1610] shadow-[0_4px_14px_rgba(30,22,16,0.2)]'
                            : 'border-[#e6ddd3] bg-white text-[#7a6b5e] hover:border-[#b5623b] hover:text-[#b5623b]'
                        }`}
                      >
                        {sub.name}
                        <span className={`ml-2 text-[0.72rem] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-[#f0ebe3]'}`}>
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
              <p className="text-[0.84rem] text-[#7a6b5e]">
                <strong className="text-[#1e1610] font-semibold">{filtered.length}</strong>{' '}
                Indian product{filtered.length !== 1 ? 's' : ''} found
              </p>
              <select
                className="px-3.5 py-2 border border-[#e6ddd3] rounded-lg text-sm bg-white text-[#1e1610] cursor-pointer outline-none focus:border-[#b5623b] transition-all duration-200"
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1) }}
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>

            {/* Grid */}
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[340px] gap-4 text-center">
                <div className="text-[3rem]">🌸</div>
                <p className="font-serif text-[1.15rem] font-semibold">No Indian products found</p>
                <p className="text-[0.84rem] text-[#7a6b5e]">
                  {activeSub !== 'all'
                    ? 'No Indian products in this subcategory yet.'
                    : 'This category has no Indian products yet.'}
                </p>
                {activeSub !== 'all' && (
                  <button
                    onClick={() => handleSubChange('all')}
                    className="mt-2 px-5 py-2.5 rounded-full bg-[#1e1610] text-[#f7f3ee] text-sm border-none cursor-pointer hover:bg-[#7a3e22] transition-all duration-200"
                  >
                    View All {category.name}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {paginated.map(p => (
                  <ProductCard key={p._id} product={p} onQuickView={() => setQuickView(p)} />
                ))}
              </div>
            )}

            <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
          </div>
        )}

        {/* Quick View */}
        {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
      </div>
    </>
  )
}