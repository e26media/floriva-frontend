import Image from 'next/image'
import Link from 'next/link'
import FaqAccordion from './FaqAccordion'
import FloatingWhatsApp from './FloatingWhatsApp'
import StickyCtaBar from './StickyCtaBar'
import { CATEGORIES, LINKS } from './seo'

const WHY_POINTS = [
  {
    title: 'Fresh flowers sourced daily',
    text: 'We prioritise petal quality and stem strength so every Melbourne delivery arrives looking vibrant.',
  },
  {
    title: 'Premium quality finishes',
    text: 'From bloom selection to wrapping, Floriva bouquets are designed to feel considered and gift-ready.',
  },
  {
    title: 'Professional florists',
    text: 'Experienced florists handcraft arrangements with balance, colour harmony, and lasting presentation.',
  },
  {
    title: 'Affordable pricing',
    text: 'Enjoy accessible luxury — beautiful bouquets without unnecessary markups or complicated bundles.',
  },
  {
    title: 'Secure online ordering',
    text: 'Checkout securely on florivagifts.com, then track your order details with peace of mind.',
  },
  {
    title: 'Same-day delivery',
    text: 'Eligible Melbourne suburbs can receive flowers the same day when you order before cutoff.',
  },
  {
    title: 'Freshness guarantee',
    text: 'We prepare bouquets close to dispatch and pack them carefully for safe transit across the city.',
  },
  {
    title: 'Helpful customer support',
    text: 'Need delivery notes, hospital details, or date advice? Our team is ready to help Melbourne customers.',
  },
]

const OCCASIONS = [
  { name: 'Birthday', href: LINKS.birthday },
  { name: 'Anniversary', href: LINKS.anniversary },
  { name: 'Wedding', href: LINKS.customBouquets },
  { name: 'Graduation', href: LINKS.congratulations },
  { name: 'Congratulations', href: LINKS.congratulations },
  { name: "Mother's Day", href: LINKS.occasionFlowers },
  { name: "Valentine's Day", href: LINKS.romance },
  { name: 'New Baby', href: LINKS.occasionFlowers },
  { name: 'Sympathy', href: LINKS.occasionFlowers },
  { name: 'Thank You', href: LINKS.bouquets },
  { name: 'Corporate Gifts', href: LINKS.arrangements },
]

const STEPS = [
  {
    step: '01',
    title: 'Choose Bouquet',
    text: 'Browse birthday, anniversary, rose, luxury, and mixed flower collections tailored for Melbourne gifting.',
  },
  {
    step: '02',
    title: 'Add Personal Message',
    text: 'Include a heartfelt note so your recipient knows exactly why the flowers arrived at their door.',
  },
  {
    step: '03',
    title: 'Select Delivery Date',
    text: 'Pick same-day where available, or schedule the exact date for celebrations across Melbourne.',
  },
  {
    step: '04',
    title: 'Secure Checkout',
    text: 'Confirm the address, suburb, and any courier notes through our secure online ordering flow.',
  },
  {
    step: '05',
    title: 'Delivered Across Melbourne',
    text: 'Your handcrafted bouquet is prepared, packaged, and delivered with care across metro Melbourne.',
  },
]

const REVIEWS = [
  {
    name: 'Amelia R.',
    suburb: 'South Yarra',
    quote:
      'I ordered anniversary flowers for my partner in South Yarra and they arrived looking incredibly fresh. The wrapping was beautiful and the gift message was printed perfectly.',
  },
  {
    name: 'Daniel K.',
    suburb: 'Carlton',
    quote:
      'Needed same-day bouquet delivery to Carlton for a birthday lunch. Ordered mid-morning and the flowers made it on time. Easy checkout and clear updates.',
  },
  {
    name: 'Priya S.',
    suburb: 'Doncaster',
    quote:
      'Sent a rose bouquet to my mum in Doncaster. She said it was one of the loveliest arrangements she has received — soft, fragrant, and thoughtfully designed.',
  },
  {
    name: 'James L.',
    suburb: 'St Kilda',
    quote:
      'Floriva handled a sympathy bouquet to St Kilda with real care. The tones were gentle and appropriate, and delivery was reliable even on a busy weekday.',
  },
]

const AREAS = [
  'Melbourne CBD',
  'Southbank',
  'Docklands',
  'Richmond',
  'Carlton',
  'St Kilda',
  'Brunswick',
  'Footscray',
  'South Yarra',
  'Toorak',
  'Hawthorn',
  'Kew',
  'Fitzroy',
  'North Melbourne',
  'West Melbourne',
  'East Melbourne',
  'Point Cook',
  'Werribee',
  'Glen Waverley',
  'Doncaster',
  'Sunshine',
]

const TRUST = [
  'Fresh daily blooms',
  'Same-day eligible',
  'Secure checkout',
  'Gift messages included',
  'Melbourne-wide coverage',
  'Handcrafted by florists',
]

export default function MelbourneBouquetContent() {
  return (
    <div className="mlb-page">
      {/* HERO */}
      <section className="mlb-hero" aria-label="Bouquet Delivery Melbourne">
        <div className="mlb-hero-media">
          <Image
            src="https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=2000&q=80"
            alt="Premium handcrafted flower bouquet delivery across Melbourne"
            fill
            priority
            sizes="100vw"
            className="mlb-hero-img"
          />
          <div className="mlb-hero-scrim" />
        </div>

        <div className="mlb-hero-content container">
          <nav className="mlb-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href={LINKS.australiaHome}>Australia</Link>
              </li>
              <li>
                <span>Melbourne</span>
              </li>
              <li aria-current="page">
                <span>Bouquet Delivery</span>
              </li>
            </ol>
          </nav>

          <p className="mlb-brand">Floriva Gifts</p>
          <h1>Bouquet Delivery Melbourne</h1>
          <p className="mlb-hero-sub">
            Premium handcrafted flower bouquets delivered across Melbourne with same-day delivery
            available on eligible orders.
          </p>

          <div className="mlb-hero-ctas">
            <Link href={LINKS.bouquets} className="mlb-btn mlb-btn-primary">
              Shop Bouquets
            </Link>
            <Link href={LINKS.bestSellers} className="mlb-btn mlb-btn-secondary">
              Order Today
            </Link>
            <Link href="#same-day-delivery" className="mlb-btn mlb-btn-outline">
              Same Day Delivery
            </Link>
          </div>

          <ul className="mlb-trust-row" aria-label="Trust signals">
            {TRUST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* WHY */}
      <section className="mlb-section" id="why-floriva">
        <div className="container mlb-narrow">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">Why Floriva Gifts</p>
            <h2>Melbourne’s online florist for fresh, handcrafted bouquets</h2>
            <p>
              When you want bouquet delivery Melbourne residents can trust, the details matter: stem
              quality, colour balance, packaging, and a courier who understands apartment lobbies as
              well as leafy suburban streets. Floriva Gifts brings together professional floristry and
              a simple online ordering experience so sending flowers feels calm, not complicated.
            </p>
          </header>

          <div className="mlb-why-grid">
            {WHY_POINTS.map((item) => (
              <article key={item.title} className="mlb-why-item">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mlb-prose">
            <p>
              Fresh flower bouquets Melbourne shoppers order online should arrive looking as intentional
              as they did on the design bench. That is why we source blooms daily, assemble arrangements
              close to dispatch, and finish each gift with protective wrapping. Whether you are sending
              birthday bouquets Melbourne friends will remember, or a quiet thank-you for a colleague in
              the CBD, the standard stays the same: premium flowers, clear communication, and reliable
              flower delivery Melbourne schedules support.
            </p>
            <p>
              Affordable pricing does not mean compromising on design. Floriva’s collections span
              everyday mixed bouquets through luxury flower bouquets Melbourne customers choose for
              milestone moments. Secure checkout, a freshness-focused approach, and responsive support
              make it easier to order with confidence — even when you are organising a surprise for
              someone across town.
            </p>
            <p>
              Local context shapes better gifts. A compact luxury bouquet may suit a Docklands apartment
              foyer, while a fuller mixed design can fill a Hawthorn living room with colour. Native
              Australian accents add texture that feels at home in Melbourne, and classic rose bouquets
              remain a timeless choice for romance, apologies, and celebrations. Online bouquet delivery
              Melbourne shoppers can compare styles quickly, then check out without phone tag or
              guesswork about availability.
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mlb-section mlb-section-soft" id="bouquet-categories">
        <div className="container">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">Shop by style</p>
            <h2>Bouquet categories for every Melbourne moment</h2>
            <p>
              Explore curated collections designed for real occasions — from rose bouquets Melbourne
              romantics love, to bright congratulations flowers and gentle sympathy designs.
            </p>
          </header>

          <div className="mlb-category-grid">
            {CATEGORIES.map((cat) => (
              <Link key={cat.name} href={cat.href} className="mlb-category-card">
                <div className="mlb-category-media">
                  <Image
                    src={cat.image}
                    alt={cat.alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="mlb-category-body">
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                  <span className="mlb-category-link">Shop collection →</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mlb-internal-links">
            <p className="mlb-eyebrow">Popular Melbourne collections</p>
            <div className="mlb-chip-row">
              <Link href={LINKS.birthday}>Birthday Flowers</Link>
              <Link href={LINKS.roses}>Rose Collection</Link>
              <Link href={LINKS.anniversary}>Anniversary Flowers</Link>
              <Link href={LINKS.giftHampers}>Gift Hampers</Link>
              <Link href={LINKS.cakeDelivery}>Cake Delivery</Link>
              <Link href={LINKS.australiaHome}>Flower Delivery Australia</Link>
              <Link href={LINKS.bouquets}>All Melbourne Bouquets</Link>
              <Link href={LINKS.occasionFlowers}>Occasion Flowers</Link>
            </div>
          </div>
        </div>
      </section>

      {/* SAME DAY */}
      <section className="mlb-section" id="same-day-delivery">
        <div className="container mlb-split">
          <div>
            <p className="mlb-eyebrow">Same day delivery</p>
            <h2>Same-day bouquet delivery Melbourne can rely on</h2>
            <p className="mlb-lead">
              Last-minute does not have to look last-minute. When timing is tight, Floriva helps you
              send fresh flower bouquets Melbourne recipients will open with a smile — often on the
              same day you order.
            </p>

            <div className="mlb-prose">
              <h3>How the delivery process works</h3>
              <p>
                After checkout, your order is confirmed and assigned for preparation. Florists craft
                the bouquet, hydrate the stems, and package the arrangement for safe travel. Couriers
                then deliver across metro Melbourne with attention to building access, office receptions,
                and residential addresses.
              </p>

              <h3>Order cutoff time</h3>
              <p>
                Same day flower delivery Melbourne availability depends on your suburb and the time you
                place the order. The checkout experience shows the latest cutoff for eligible postcodes.
                Fridays, weekends, and peak occasions such as Valentine’s Day and Mother’s Day fill
                quickly, so earlier orders secure better time windows.
              </p>

              <h3>Delivery areas, tracking &amp; charges</h3>
              <p>
                We deliver throughout greater Melbourne and surrounding suburbs. Delivery charges vary
                by distance and selected service level, and are displayed before you pay. Order updates
                help you stay informed, while gift messages travel with the bouquet so the unboxing
                feels personal. Safe delivery practices protect both the flowers and the recipient’s
                address details.
              </p>
            </div>
          </div>

          <aside className="mlb-aside-panel" aria-label="Same-day delivery highlights">
            <h3>Same-day checklist</h3>
            <ul>
              <li>Confirm your Melbourne suburb is eligible</li>
              <li>Order before the daily cutoff shown at checkout</li>
              <li>Add clear delivery notes for apartments or offices</li>
              <li>Include a gift message for a personal touch</li>
              <li>Choose popular designs early on busy days</li>
            </ul>
            <Link href={LINKS.bouquets} className="mlb-btn mlb-btn-primary mlb-btn-block">
              Order Same-Day Bouquets
            </Link>
          </aside>
        </div>
      </section>

      {/* AREAS */}
      <section className="mlb-section mlb-section-soft" id="melbourne-delivery-areas">
        <div className="container mlb-narrow">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">Delivery coverage</p>
            <h2>Melbourne delivery areas we serve</h2>
            <p>
              From laneway apartments to leafy family homes, online bouquet delivery Melbourne coverage
              stretches across the inner city and out to key growth corridors.
            </p>
          </header>

          <div className="mlb-prose">
            <p>
              Send bouquets to Melbourne CBD offices, waterfront apartments in Southbank and Docklands,
              and character-filled streets in Richmond, Fitzroy, and Carlton. Inner south favourites
              like South Yarra, Toorak, and St Kilda are popular for romantic and anniversary flowers,
              while Hawthorn, Kew, and Brunswick are frequent destinations for birthday and thank-you
              gifts. We also deliver to Footscray, North Melbourne, West Melbourne, East Melbourne,
              Point Cook, Werribee, Glen Waverley, Doncaster, Sunshine, and surrounding suburbs.
            </p>
            <p>
              Greater Melbourne is wide, and delivery planning accounts for that. Morning drops work well
              for workplace surprises in the city fringe; afternoon windows often suit residential
              streets further out. If your recipient lives near a busy retail strip or a secure building,
              a short note for the courier — buzzer code, reception name, or preferred safe place —
              helps keep flowers upright and on time.
            </p>
            <p>
              Not sure about a nearby postcode? Enter the delivery address at checkout to confirm
              availability for florist Melbourne services, including scheduled and same-day options where
              offered. If you are organising corporate gifts or hospital deliveries, include reception
              or ward details so couriers can complete the drop-off smoothly. Send bouquets to Melbourne
              loved ones from interstate or overseas just as easily — the online flow is built for
              distance gifting.
            </p>
          </div>

          <ul className="mlb-area-grid">
            {AREAS.map((area) => (
              <li key={area}>{area}</li>
            ))}
            <li>Surrounding suburbs</li>
          </ul>
        </div>
      </section>

      {/* OCCASIONS */}
      <section className="mlb-section" id="occasions">
        <div className="container">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">Shop by occasion</p>
            <h2>Occasions that deserve beautiful blooms</h2>
            <p>
              Flowers mark life’s turning points. Choose an occasion below to explore arrangements
              designed for celebration, gratitude, romance, and remembrance.
            </p>
          </header>

          <div className="mlb-occasion-grid">
            {OCCASIONS.map((item) => (
              <Link key={item.name} href={item.href} className="mlb-occasion-link">
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mlb-prose mlb-narrow-block">
            <p>
              Birthday bouquets Melbourne families order often lean bright and cheerful, while
              anniversary bouquets Melbourne couples prefer tend toward roses, soft palettes, and
              refined wrapping. Wedding parties and corporate teams can explore custom and arrangement
              options. For Mother’s Day and Valentine’s Day, order early to lock in preferred designs.
              New baby, graduation, congratulations, sympathy, and thank-you flowers each have their own
              visual language — and Floriva’s collections make those choices simple.
            </p>
          </div>
        </div>
      </section>

      {/* WHY CUSTOMERS */}
      <section className="mlb-section mlb-section-soft" id="why-customers">
        <div className="container mlb-narrow">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">Customer favourites</p>
            <h2>Why customers choose Floriva Gifts</h2>
          </header>

          <div className="mlb-prose">
            <p>
              Melbourne shoppers return to Floriva because premium flowers and handcrafted bouquets are
              paired with practical delivery reliability. Secure checkout protects your payment details.
              Beautiful packaging presents every gift at its best. Fresh flowers sourced daily keep
              arrangements looking alive on arrival. Excellent customer service helps when you need
              suburb advice, timing guidance, or a last-minute change to a gift note.
            </p>
            <p>
              Affordable luxury is the goal: designs that feel elevated without forcing you into
              oversized, overcomplicated bundles. Whether you are browsing luxury flower bouquets
              Melbourne collections or a simple mixed arrangement for a neighbour in Kew, you get the
              same care in floristry and fulfilment.
            </p>
          </div>

          <ul className="mlb-feature-list">
            <li>Premium flowers with thoughtful colour design</li>
            <li>Handcrafted bouquets finished for gifting</li>
            <li>Secure checkout and clear order confirmation</li>
            <li>Reliable delivery across metro Melbourne</li>
            <li>Excellent customer service when you need help</li>
            <li>Fresh flowers sourced daily for quality</li>
            <li>Beautiful packaging that travels well</li>
            <li>Affordable luxury for everyday and milestone gifting</li>
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mlb-section" id="how-ordering-works">
        <div className="container">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">Simple steps</p>
            <h2>How ordering works</h2>
            <p>Five clear steps from inspiration to doorstep — built for busy Melbourne schedules.</p>
          </header>

          <ol className="mlb-steps">
            {STEPS.map((step) => (
              <li key={step.step}>
                <span className="mlb-step-num">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mlb-section mlb-section-soft" id="customer-reviews">
        <div className="container">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">Reviews</p>
            <h2>What Melbourne customers say</h2>
            <p>Real delivery experiences from suburbs across the city.</p>
          </header>

          <div className="mlb-review-grid">
            {REVIEWS.map((review) => (
              <figure key={review.name} className="mlb-review">
                <blockquote>“{review.quote}”</blockquote>
                <figcaption>
                  <strong>{review.name}</strong>
                  <span>{review.suburb}, Melbourne</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mlb-section" id="faq">
        <div className="container mlb-narrow">
          <header className="mlb-section-head">
            <p className="mlb-eyebrow">FAQ</p>
            <h2>Bouquet delivery Melbourne — frequently asked questions</h2>
            <p>
              Answers to common questions about timing, suburbs, packaging, hospitals, and scheduling.
            </p>
          </header>
          <FaqAccordion />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mlb-final-cta" id="order-now">
        <div className="container">
          <p className="mlb-brand mlb-brand-light">Floriva Gifts</p>
          <h2>Ready to Surprise Someone?</h2>
          <p>
            Order beautiful handcrafted bouquets online today with Floriva Gifts — fresh flower
            bouquets Melbourne friends and family love to receive.
          </p>
          <div className="mlb-hero-ctas">
            <Link href={LINKS.bouquets} className="mlb-btn mlb-btn-primary">
              Shop Bouquets
            </Link>
            <Link href={LINKS.allProducts} className="mlb-btn mlb-btn-secondary">
              Order Now
            </Link>
            <Link href="#same-day-delivery" className="mlb-btn mlb-btn-outline-light">
              Same Day Delivery
            </Link>
          </div>
        </div>
      </section>

      <StickyCtaBar />
      <FloatingWhatsApp />
    </div>
  )
}
