import Image from 'next/image'
import Link from 'next/link'
import type { LandingProduct } from './products'

function ProductCard({ product }: { product: LandingProduct }) {
  return (
    <Link href={product.href} className="mlb-product-card">
      <div className="mlb-product-media">
        <Image
          src={product.image}
          alt={`${product.name} — Floriva bouquet delivery Melbourne`}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="mlb-product-img"
        />
        {product.discountPercent > 0 ? (
          <span className="mlb-product-badge">−{product.discountPercent}%</span>
        ) : null}
        {product.stock === 0 ? (
          <span className="mlb-product-badge mlb-product-badge-sold">Sold out</span>
        ) : null}
      </div>
      <div className="mlb-product-body">
        <p className="mlb-product-cat">{product.categoryName}</p>
        <h3>{product.name}</h3>
        <p className="mlb-product-title">{product.title}</p>
        <div className="mlb-product-price">
          <span>{product.priceLabel}</span>
          {product.compareAtLabel ? <s>{product.compareAtLabel}</s> : null}
        </div>
      </div>
    </Link>
  )
}

function ProductSection({
  id,
  eyebrow,
  title,
  description,
  products,
  viewAllHref,
  viewAllLabel,
  soft = true,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  products: LandingProduct[]
  viewAllHref: string
  viewAllLabel: string
  soft?: boolean
}) {
  if (!products.length) return null

  return (
    <section className={`mlb-section${soft ? ' mlb-section-soft' : ''}`} id={id}>
      <div className="container">
        <header className="mlb-section-head mlb-section-head-row">
          <div>
            <p className="mlb-eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <Link href={viewAllHref} className="mlb-btn mlb-btn-ghost mlb-btn-sm mlb-view-all">
            {viewAllLabel}
          </Link>
        </header>

        <div className="mlb-product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ProductSections({
  bestsellers,
  bouquets,
  roses,
  bestsellersHref,
  bouquetsHref,
  rosesHref,
}: {
  bestsellers: LandingProduct[]
  bouquets: LandingProduct[]
  roses: LandingProduct[]
  bestsellersHref: string
  bouquetsHref: string
  rosesHref: string
}) {
  return (
    <>
      <ProductSection
        id="shop-bouquets"
        eyebrow="Shop Floriva bouquets"
        title="Handcrafted bouquets available for Melbourne delivery"
        description="These are real Floriva Gifts products from our Australia collection — order online and send fresh flowers across Melbourne."
        products={bouquets}
        viewAllHref={bouquetsHref}
        viewAllLabel="View all bouquets"
        soft
      />

      <ProductSection
        id="best-sellers"
        eyebrow="Customer favourites"
        title="Best sellers Melburnians love"
        description="Popular Floriva picks with the designs and pricing you already see across florivagifts.com."
        products={bestsellers}
        viewAllHref={bestsellersHref}
        viewAllLabel="Shop best sellers"
        soft={false}
      />

      {roses.length > 0 ? (
        <ProductSection
          id="rose-bouquets"
          eyebrow="Roses collection"
          title="Rose bouquets for Melbourne gifting"
          description="Classic and luxury rose arrangements from Floriva’s Australia rose collection."
          products={roses}
          viewAllHref={rosesHref}
          viewAllLabel="Shop roses"
          soft
        />
      ) : null}
    </>
  )
}

