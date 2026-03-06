"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────────────── */
interface SubCategory { _id: string; name: string }
interface Category    { _id: string; name: string; subCategories: SubCategory[] }
interface Color       { _id: string; name: string }
interface Product {
  _id: string; name: string; title: string; description: string
  exactPrice: number; discountPrice: number
  category: Category; subCategory: string; color: Color
  stock: number; deliveryInfo: string; images: string[]; createdAt: string
}

/* ─── Constants ──────────────────────────────────────────────────── */
const BASE     = "http://localhost:7000";
const toSrc    = (p: string) => !p ? "" : p.startsWith("http") ? p : `${BASE}${p}`;
const calcDisc = (e: number, d: number) => e > 0 ? Math.round(((e - d) / e) * 100) : 0;

const COLORS: Record<string, string> = {
  pink:"#f9a8d4",red:"#f87171",white:"#f0ece6",blue:"#93c5fd",
  yellow:"#fde047",green:"#86efac",purple:"#c4b5fd",orange:"#fdba74",
  black:"#374151",peach:"#ffb997",lavender:"#d8b4fe",coral:"#ff7f7f",
};

/* ─── Icons ──────────────────────────────────────────────────────── */
const IcoCart  = ({s=18}:{s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
const IcoCheck = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
const IcoPrev  = ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
const IcoNext  = ()=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const IcoBack  = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
const IcoTruck = ()=><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
const IcoShield= ()=><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoReturn= ()=><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
const IcoShare = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>

/* ─── Skeleton Loader ────────────────────────────────────────────── */
function Skeleton() {
  const box = (w:string, h:string, extra?:React.CSSProperties) => (
    <div style={{width:w,height:h,borderRadius:"10px",background:"#ede8e1",animation:"pulse 1.5s ease-in-out infinite",...extra}}/>
  );
  return (
    <div style={{maxWidth:"1100px",margin:"0 auto",padding:"40px 24px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"60px"}}>
        <div>
          <div style={{aspectRatio:"1/1",borderRadius:"16px",background:"#ede8e1",animation:"pulse 1.5s ease-in-out infinite",marginBottom:"12px"}}/>
          <div style={{display:"flex",gap:"8px"}}>
            {[1,2,3].map(i=><div key={i} style={{width:"64px",height:"64px",borderRadius:"8px",background:"#ede8e1",animation:"pulse 1.5s ease-in-out infinite"}}/>)}
          </div>
        </div>
        <div style={{paddingTop:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
          {box("120px","16px")} {box("70%","32px")} {box("50%","22px")}
          {box("140px","38px")} {box("100%","80px")} {box("100%","48px")} {box("100%","44px")}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function ProductDetailPage() {
  // ── useParams() gives { id: "69a68f833beebd168d8812ec" } ──
  const params = useParams();
  const router = useRouter();

  // Safe extraction – handles string or string[]
  const rawId = params?.id;
  const id    = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [imgIdx,  setImgIdx]  = useState(0);
  const [qty,     setQty]     = useState(1);
  const [added,   setAdded]   = useState(false);
  const [wished,  setWished]  = useState(false);
  const [shared,  setShared]  = useState(false);
  const [zoom,    setZoom]    = useState(false);
  const [zPos,    setZPos]    = useState({ x:50, y:50 });
  const imgRef = useRef<HTMLDivElement>(null);

  /* ── Fetch product ── */
  useEffect(() => {
    if (!id) {
      setError("No product ID in URL");
      setLoading(false);
      return;
    }

    console.log("Fetching product id:", id);

    setLoading(true);
    setError("");
    setProduct(null);

    const url = `${BASE}/api/productview/${id}`;
    console.log("Fetch URL:", url);

    fetch(url)
      .then(async r => {
        const text = await r.text();
        console.log("Raw response:", text.slice(0, 300));
        if (!r.ok) throw new Error(`Server ${r.status}: ${text.slice(0,120)}`);
        return JSON.parse(text);
      })
      .then(d => {
        console.log("Parsed data keys:", Object.keys(d));
        // Try every common response shape
        const p: Product =
          (d && d._id)         ? d          :   // { _id, name, ... }
          (d && d.product?._id)? d.product  :   // { product: { _id, ... } }
          (d && d.data?._id)   ? d.data     :   // { data: { _id, ... } }
          (d && d.result?._id) ? d.result   :   // { result: { _id, ... } }
          (Array.isArray(d) && d[0]?._id) ? d[0] : // [ { _id, ... } ]
          null as any;

        if (!p || !p._id) {
          console.error("Could not find product in response:", d);
          throw new Error("Product not found in server response");
        }
        console.log("Product loaded:", p.name);
        setProduct(p);
      })
      .catch(e => {
        console.error("Fetch error:", e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => { setAdded(true); setTimeout(() => setAdded(false), 2500); };
  const handleShare = () => {
    try { navigator.clipboard.writeText(window.location.href); } catch {}
    setShared(true); setTimeout(() => setShared(false), 2000);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const r = imgRef.current.getBoundingClientRect();
    setZPos({ x:((e.clientX-r.left)/r.width)*100, y:((e.clientY-r.top)/r.height)*100 });
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{minHeight:"100vh",background:"#f7f3ee",fontFamily:"'Jost',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        body{font-family:'Jost',sans-serif!important;background:#f7f3ee}
      `}</style>
      <div style={{background:"#fff",borderBottom:"1px solid #e6ddd3",padding:"14px 24px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto",display:"flex",justifyContent:"space-between"}}>
          <div style={{width:"120px",height:"16px",borderRadius:"6px",background:"#ede8e1",animation:"pulse 1.5s infinite"}}/>
          <div style={{width:"200px",height:"14px",borderRadius:"6px",background:"#ede8e1",animation:"pulse 1.5s infinite"}}/>
        </div>
      </div>
      <Skeleton/>
    </div>
  );

  /* ── Error ── */
  if (error || !product) return (
    <div style={{minHeight:"100vh",background:"#f7f3ee",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Jost',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
        body{font-family:'Jost',sans-serif!important;background:#f7f3ee}
      `}</style>
      <div style={{textAlign:"center",padding:"24px"}}>
        <div style={{fontSize:"48px",marginBottom:"16px"}}>🌸</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",marginBottom:"8px",color:"#1e1610"}}>Product Not Found</h2>
        <p style={{color:"#7a6b5e",fontSize:"0.9rem",marginBottom:"6px"}}>{error || "This item may no longer be available."}</p>
        <p style={{color:"#b0a090",fontSize:"0.75rem",marginBottom:"24px"}}>ID: {id}</p>
        <button
          onClick={() => window.history.back()}
          style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"10px 24px",
                  background:"#1e1610",color:"#f7f3ee",border:"none",borderRadius:"10px",
                  fontSize:"0.9rem",fontWeight:600,cursor:"pointer",fontFamily:"'Jost',sans-serif"}}
          onMouseEnter={e=>(e.currentTarget.style.background="#b5623b")}
          onMouseLeave={e=>(e.currentTarget.style.background="#1e1610")}
        >
          <IcoBack/> Go Back
        </button>
      </div>
    </div>
  );

  /* ── Derived values ── */
  const disc   = calcDisc(product.exactPrice, product.discountPrice);
  const hexCol = COLORS[product.color?.name?.toLowerCase()] ?? "#e5e7eb";
  const imgs   = product.images ?? [];

  /* ── Render ── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Jost',sans-serif!important;background:#f7f3ee;color:#1e1610;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        .detail-body{animation:fadeUp .4s ease forwards}
        .thumb-btn:hover{border-color:#1e1610!important}
        .tag-row span{transition:all .2s}
        .tag-row span:hover{border-color:#b5623b!important;color:#b5623b!important}
      `}</style>

      <div style={{minHeight:"100vh",background:"#f7f3ee",color:"#1e1610"}}>

        {/* ── Sticky navbar ── */}
        <nav style={{background:"#fff",borderBottom:"1px solid #e6ddd3",position:"sticky",top:0,zIndex:50,
                     boxShadow:"0 1px 12px rgba(30,22,16,.06)"}}>
          <div style={{maxWidth:"1100px",margin:"0 auto",padding:"13px 20px",
                       display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"}}>

            {/* Back button */}
            <button
              onClick={() => window.history.back()}
              style={{display:"flex",alignItems:"center",gap:"8px",background:"none",border:"none",
                      color:"#7a6b5e",fontSize:"0.875rem",fontWeight:500,cursor:"pointer",
                      fontFamily:"'Jost',sans-serif",flexShrink:0,transition:"color .2s"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#1e1610")}
              onMouseLeave={e=>(e.currentTarget.style.color="#7a6b5e")}
            >
              <IcoBack/>
              <span>Back</span>
            </button>

            {/* Breadcrumb */}
            <div style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"0.72rem",
                         color:"#b0a090",overflow:"hidden",letterSpacing:"0.04em"}}>
              <span style={{cursor:"pointer",whiteSpace:"nowrap",transition:"color .2s"}}
                onMouseEnter={e=>(e.currentTarget.style.color="#b5623b")}
                onMouseLeave={e=>(e.currentTarget.style.color="#b0a090")}
                onClick={()=>window.history.back()}>All Products</span>
              {product.category?.name && <>
                <span>/</span>
                <span style={{color:"#7a6b5e",whiteSpace:"nowrap"}}>{product.category.name}</span>
              </>}
              <span>/</span>
              <span style={{color:"#1e1610",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"160px"}}>
                {product.name}
              </span>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"none",
                      color:"#7a6b5e",fontSize:"0.84rem",cursor:"pointer",flexShrink:0,
                      fontFamily:"'Jost',sans-serif",transition:"color .2s"}}
              onMouseEnter={e=>(e.currentTarget.style.color="#1e1610")}
              onMouseLeave={e=>(e.currentTarget.style.color="#7a6b5e")}
            >
              <IcoShare/>
              <span>{shared ? "Copied!" : "Share"}</span>
            </button>
          </div>
        </nav>

        {/* ── Body ── */}
        <div className="detail-body" style={{maxWidth:"1100px",margin:"0 auto",padding:"36px 20px 60px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"56px",alignItems:"start"}}
               className="detail-grid">

            {/* ══ LEFT: Gallery ══ */}
            <div style={{position:"sticky",top:"72px"}}>

              {/* Main image */}
              <div
                ref={imgRef}
                onMouseEnter={()=>setZoom(true)}
                onMouseLeave={()=>setZoom(false)}
                onMouseMove={handleMouseMove}
                style={{position:"relative",aspectRatio:"1/1",borderRadius:"18px",overflow:"hidden",
                        background:"#f0ebe3",marginBottom:"12px",cursor:zoom?"zoom-out":"zoom-in",userSelect:"none"}}
              >
                {imgs[imgIdx] ? (
                  <img
                    src={toSrc(imgs[imgIdx])}
                    alt={product.name}
                    draggable={false}
                    style={{width:"100%",height:"100%",objectFit:"cover",
                            transition:"transform .2s ease",
                            transformOrigin:zoom?`${zPos.x}% ${zPos.y}%`:"center",
                            transform:zoom?"scale(1.9)":"scale(1)"}}
                  />
                ) : (
                  <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",
                               alignItems:"center",justifyContent:"center",color:"#b0a090",gap:"8px"}}>
                    <svg viewBox="0 0 80 80" fill="none" width="80">
                      <rect width="80" height="80" rx="8" fill="#ede8e1"/>
                      <path d="M18 55L30 38l10 12 10-14 12 19z" fill="#d4cdc4"/>
                      <circle cx="26" cy="26" r="6" fill="#d4cdc4"/>
                    </svg>
                    <span style={{fontSize:"13px"}}>No Image</span>
                  </div>
                )}

                {/* Discount badge */}
                {disc > 0 && (
                  <span style={{position:"absolute",top:"14px",left:"14px",background:"#b5623b",
                                color:"#fff",padding:"4px 12px",borderRadius:"20px",
                                fontSize:"0.72rem",fontWeight:600,letterSpacing:"0.04em"}}>
                    −{disc}% OFF
                  </span>
                )}

                {/* Out of stock overlay */}
                {product.stock === 0 && (
                  <div style={{position:"absolute",inset:0,background:"rgba(255,255,255,.58)",
                               backdropFilter:"blur(2px)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{background:"#fff",color:"#7a6b5e",padding:"8px 22px",borderRadius:"30px",
                                  fontSize:"0.9rem",fontWeight:600,boxShadow:"0 2px 14px rgba(0,0,0,.1)",
                                  border:"1px solid #e6ddd3"}}>Out of Stock</span>
                  </div>
                )}

                {/* Arrows */}
                {imgs.length > 1 && <>
                  <button
                    onClick={()=>setImgIdx(i=>(i-1+imgs.length)%imgs.length)}
                    style={{position:"absolute",top:"50%",left:"12px",transform:"translateY(-50%)",
                            width:"36px",height:"36px",borderRadius:"50%",border:"none",
                            background:"rgba(255,255,255,.9)",cursor:"pointer",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            boxShadow:"0 2px 12px rgba(0,0,0,.12)",transition:"all .2s"}}
                    onMouseEnter={e=>{(e.currentTarget.style.background="#1e1610");(e.currentTarget.style.color="#fff")}}
                    onMouseLeave={e=>{(e.currentTarget.style.background="rgba(255,255,255,.9)");(e.currentTarget.style.color="#1e1610")}}
                  ><IcoPrev/></button>
                  <button
                    onClick={()=>setImgIdx(i=>(i+1)%imgs.length)}
                    style={{position:"absolute",top:"50%",right:"12px",transform:"translateY(-50%)",
                            width:"36px",height:"36px",borderRadius:"50%",border:"none",
                            background:"rgba(255,255,255,.9)",cursor:"pointer",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            boxShadow:"0 2px 12px rgba(0,0,0,.12)",transition:"all .2s"}}
                    onMouseEnter={e=>{(e.currentTarget.style.background="#1e1610");(e.currentTarget.style.color="#fff")}}
                    onMouseLeave={e=>{(e.currentTarget.style.background="rgba(255,255,255,.9)");(e.currentTarget.style.color="#1e1610")}}
                  ><IcoNext/></button>
                </>}

                {/* Dots */}
                {imgs.length > 1 && (
                  <div style={{position:"absolute",bottom:"12px",left:"50%",transform:"translateX(-50%)",display:"flex",gap:"6px"}}>
                    {imgs.map((_,i)=>(
                      <button key={i} onClick={()=>setImgIdx(i)}
                        style={{borderRadius:"20px",border:"none",cursor:"pointer",transition:"all .2s",
                                width:i===imgIdx?"18px":"6px",height:"6px",
                                background:i===imgIdx?"#fff":"rgba(255,255,255,.5)"}}/>
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {imgs.length > 1 && (
                <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                  {imgs.map((src,i)=>(
                    <button key={i} onClick={()=>setImgIdx(i)} className="thumb-btn"
                      style={{width:"70px",height:"70px",borderRadius:"12px",overflow:"hidden",
                              padding:0,cursor:"pointer",flexShrink:0,background:"#f0ebe3",
                              border:`2px solid ${i===imgIdx?"#b5623b":"transparent"}`,
                              boxShadow:i===imgIdx?"0 0 0 3px rgba(181,98,59,.15)":"none",
                              transition:"all .2s"}}>
                      <img src={toSrc(src)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ══ RIGHT: Details ══ */}
            <div>

              {/* Tags row */}
              <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
                {product.category?.name && (
                  <span style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.14em",
                                color:"#b5623b",fontWeight:700,background:"#fdf0eb",
                                padding:"3px 11px",borderRadius:"20px",border:"1px solid #f5d5c5"}}>
                    {product.category.name}
                  </span>
                )}
                {product.color?.name && (
                  <span style={{fontSize:"0.7rem",padding:"3px 11px",borderRadius:"20px",
                                background:"#f0ebe3",color:"#1e1610",fontWeight:500,
                                display:"flex",alignItems:"center",gap:"6px",border:"1px solid #e6ddd3"}}>
                    <span style={{width:"11px",height:"11px",borderRadius:"50%",
                                  background:hexCol,border:"1px solid rgba(0,0,0,.1)",flexShrink:0}}/>
                    {product.color.name}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 style={{fontFamily:"'Playfair Display',serif",
                          fontSize:"clamp(1.7rem,3.5vw,2.5rem)",
                          fontWeight:700,lineHeight:1.15,color:"#1e1610",marginBottom:"8px"}}>
                {product.name}
              </h1>

              {/* Subtitle */}
              {product.title && product.title !== product.name && (
                <p style={{color:"#7a6b5e",fontSize:"0.9rem",lineHeight:1.6,marginBottom:"16px"}}>
                  {product.title}
                </p>
              )}

              {/* Accent line */}
              <div style={{width:"48px",height:"3px",borderRadius:"4px",background:"#b5623b",marginBottom:"20px"}}/>

              {/* Pricing */}
              <div style={{display:"flex",alignItems:"flex-end",gap:"12px",flexWrap:"wrap",marginBottom:"20px"}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:"2.1rem",
                              fontWeight:700,color:"#1e1610",lineHeight:1}}>
                  ₹{product.discountPrice?.toLocaleString()}
                </span>
                {disc > 0 && <>
                  <span style={{fontSize:"1rem",color:"#b0a090",textDecoration:"line-through",lineHeight:1,paddingBottom:"3px"}}>
                    ₹{product.exactPrice?.toLocaleString()}
                  </span>
                  <span style={{fontSize:"0.74rem",background:"#dcfce7",color:"#3d8b5e",
                                padding:"4px 11px",borderRadius:"20px",fontWeight:700,lineHeight:1}}>
                    Save ₹{((product.exactPrice??0)-(product.discountPrice??0)).toLocaleString()} ({disc}%)
                  </span>
                </>}
              </div>

              {/* Description */}
              {product.description && (
                <div style={{background:"#faf7f3",borderRadius:"12px",padding:"16px",
                             marginBottom:"20px",border:"1px solid #ede7df"}}>
                  <p style={{fontSize:"0.875rem",color:"#5c4f43",lineHeight:1.8}}>{product.description}</p>
                </div>
              )}

              {/* Stock pill */}
              <div style={{display:"inline-flex",alignItems:"center",gap:"8px",marginBottom:"20px",
                           padding:"8px 14px",background:"#fff",borderRadius:"10px",border:"1px solid #e6ddd3"}}>
                <span style={{width:"8px",height:"8px",borderRadius:"50%",flexShrink:0,
                              background:product.stock===0?"#ef4444":product.stock<=5?"#f59e0b":"#22c55e",
                              boxShadow:product.stock>0?(product.stock<=5?"0 0 0 3px rgba(245,158,11,.2)":"0 0 0 3px rgba(34,197,94,.2)"):"none"}}/>
                <span style={{fontSize:"0.82rem",fontWeight:500,color:"#5c4f43"}}>
                  {product.stock===0?"Out of stock"
                    :product.stock<=5?`Only ${product.stock} left — order soon!`
                    :`In stock · ${product.stock} units available`}
                </span>
              </div>

              {/* Qty + Add to Cart */}
              {product.stock > 0 && (
                <div style={{display:"flex",gap:"12px",marginBottom:"12px",flexWrap:"wrap"}}>
                  {/* Stepper */}
                  <div style={{display:"flex",alignItems:"center",border:"1px solid #e6ddd3",
                               borderRadius:"12px",overflow:"hidden",background:"#fff",flexShrink:0}}>
                    <button onClick={()=>setQty(q=>Math.max(1,q-1))}
                      style={{width:"44px",height:"48px",border:"none",background:"transparent",
                              fontSize:"1.3rem",cursor:"pointer",color:"#1e1610",transition:"background .15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.background="#f0ebe3")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>−</button>
                    <span style={{width:"46px",textAlign:"center",fontSize:"1rem",fontWeight:700,
                                  borderLeft:"1px solid #e6ddd3",borderRight:"1px solid #e6ddd3",
                                  height:"48px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {qty}
                    </span>
                    <button onClick={()=>setQty(q=>Math.min(product.stock,q+1))}
                      style={{width:"44px",height:"48px",border:"none",background:"transparent",
                              fontSize:"1.3rem",cursor:"pointer",color:"#1e1610",transition:"background .15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.background="#f0ebe3")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>+</button>
                  </div>

                  {/* Add to cart */}
                  <button onClick={handleAdd}
                    style={{flex:1,minWidth:"160px",height:"48px",borderRadius:"12px",border:"none",
                            fontFamily:"'Jost',sans-serif",fontWeight:600,fontSize:"0.9rem",
                            cursor:"pointer",letterSpacing:"0.05em",
                            display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
                            background:added?"#3d8b5e":"#1e1610",color:"#f7f3ee",
                            boxShadow:added?"0 4px 20px rgba(61,139,94,.3)":"0 2px 12px rgba(30,22,16,.15)",
                            transition:"all .2s"}}
                    onMouseEnter={e=>{ if(!added)(e.currentTarget.style.background="#b5623b"); }}
                    onMouseLeave={e=>{ if(!added)(e.currentTarget.style.background="#1e1610"); }}
                  >
                    {added?<><IcoCheck/> Added to Cart!</>:<><IcoCart s={18}/> Add to Cart</>}
                  </button>
                </div>
              )}

              {/* Wishlist */}
              <button onClick={()=>setWished(w=>!w)}
                style={{width:"100%",height:"44px",borderRadius:"12px",
                        border:`1px solid ${wished?"#b5623b":"#e6ddd3"}`,
                        background:wished?"#fff5f2":"#fff",
                        color:wished?"#b5623b":"#7a6b5e",
                        fontFamily:"'Jost',sans-serif",fontWeight:500,fontSize:"0.875rem",
                        cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                        gap:"8px",marginBottom:"24px",transition:"all .2s"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={wished?"currentColor":"none"} stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wished?"Saved to Wishlist ♥":"Add to Wishlist"}
              </button>

              {/* Trust badges */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"24px"}}>
                {[
                  {icon:<IcoTruck/>, label:"Free Delivery",   sub:product.deliveryInfo||"On all orders"},
                  {icon:<IcoShield/>,label:"Secure Payment",  sub:"100% protected"},
                  {icon:<IcoReturn/>,label:"Easy Returns",    sub:"7-day policy"},
                ].map((b,i)=>(
                  <div key={i} style={{background:"#fff",border:"1px solid #e6ddd3",borderRadius:"12px",
                                       padding:"12px 8px",display:"flex",flexDirection:"column",
                                       alignItems:"center",textAlign:"center",gap:"6px"}}>
                    <span style={{color:"#b5623b"}}>{b.icon}</span>
                    <span style={{fontSize:"0.7rem",fontWeight:600,color:"#1e1610",lineHeight:1.2}}>{b.label}</span>
                    <span style={{fontSize:"0.63rem",color:"#b0a090"}}>{b.sub}</span>
                  </div>
                ))}
              </div>

              {/* Details table */}
              <div style={{background:"#fff",border:"1px solid #e6ddd3",borderRadius:"12px",overflow:"hidden",marginBottom:"16px"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid #e6ddd3",background:"#faf7f3"}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"0.95rem",fontWeight:600}}>Product Details</h3>
                </div>
                {[
                  {label:"Category", value:product.category?.name},
                  {label:"Color",    value:product.color?.name, swatch:true},
                  {label:"Stock",    value:product.stock!==undefined?`${product.stock} units`:undefined},
                  {label:"Delivery", value:product.deliveryInfo||"Standard Delivery"},
                ].filter(r=>r.value).map((row,i,arr)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",padding:"11px 16px",gap:"16px",
                                       borderBottom:i<arr.length-1?"1px solid #f0ebe3":"none"}}>
                    <span style={{fontSize:"0.7rem",color:"#b0a090",textTransform:"uppercase",
                                  letterSpacing:"0.08em",fontWeight:600,width:"76px",flexShrink:0}}>
                      {row.label}
                    </span>
                    <span style={{fontSize:"0.84rem",color:"#1e1610",fontWeight:500,
                                  display:"flex",alignItems:"center",gap:"8px"}}>
                      {row.swatch && (
                        <span style={{width:"13px",height:"13px",borderRadius:"50%",
                                      background:hexCol,border:"1px solid rgba(0,0,0,.1)",flexShrink:0}}/>
                      )}
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Sub-categories */}
              {(product.category?.subCategories?.length??0) > 0 && (
                <div style={{background:"#fff",border:"1px solid #e6ddd3",borderRadius:"12px",padding:"16px"}}>
                  <p style={{fontSize:"0.68rem",color:"#b0a090",textTransform:"uppercase",
                             letterSpacing:"0.1em",marginBottom:"10px",fontWeight:600}}>
                    Also available in
                  </p>
                  <div className="tag-row" style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                    {product.category.subCategories.map(s=>(
                      <span key={s._id}
                        style={{padding:"6px 14px",borderRadius:"20px",background:"#f0ebe3",
                                color:"#7a6b5e",fontSize:"0.76rem",fontWeight:500,
                                border:"1px solid #e6ddd3",cursor:"pointer"}}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div style={{borderTop:"1px solid #e6ddd3",padding:"20px",textAlign:"center",
                     fontSize:"0.74rem",color:"#b0a090",background:"#fff"}}>
          Handcrafted with love · Free delivery on all orders · 7-day returns
        </div>
      </div>

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .detail-grid > div:first-child { position: static !important; }
        }
      `}</style>
    </>
  );
}