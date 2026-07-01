import SectionHero2 from '@/components/SectionHero/SectionHero2'
import SectionPromo2 from '@/components/SectionPromo2'
import SectionSliderProductCard1 from '@/components/Sectionsliderproductcard1'
import SectionClientSay from '@/components/SectionClientSay'
import NewArrivals from '@/components/NewArrivals'
import BestSellers from '@/components/BestSellers'
import SectionCollectionSlider from '@/components/SectionCollectionSlider'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Ciseco is a modern and elegant template for Next.js, Tailwind CSS, and TypeScript. It is designed to be simple and easy to use, with a focus on performance and accessibility.',
  keywords: ['Next.js', 'Tailwind CSS', 'TypeScript', 'Ciseco', 'Headless UI', 'Fashion', 'E-commerce'],
}

async function PageHome() {
  return (
    <div className="nc-PageHome relative overflow-hidden">
      <SectionHero2 />
      <SectionCollectionSlider className="mt-6 lg:mt-32" />

      <div className="relative container my-24 flex flex-col gap-y-24 lg:my-32 lg:gap-y-32">
        {/* <SectionSliderProductCard 
        data={carouselProducts1} 
         /> */}
         <NewArrivals/>
        {/* <Divider /> */}
       <BestSellers/>
       {/* <BestSellerProduct/> */}
        {/* <SectionPromo1 /> */}
        {/* <div className="relative pt-24 pb-20 lg:pt-28">
          <BackgroundSection />
          <SectionGridMoreExplore groupCollections={groupCollections} />
        </div> */}
        {/* <SectionSliderProductCard 
        products={carouselProducts2} subHeading="New Sports equipment" 
        /> */}
        

        <SectionPromo2 />
        <SectionSliderProductCard1
        // products={carouselProducts3} subHeading="New Fashion items" 
        />
        
        {/* <SectionSliderLargeProduct products={carouselProducts3} /> */}
        {/* <SectionGridFeatureItems data={products} /> */}
        {/* <Divider /> */}
        {/* <SectionCollectionSlider2 collections={departmentCollections} />
        <Divider /> */}
        {/* <div>
          <Heading headingDim="From the Ciseco blog">The latest news</Heading>
          <SectionMagazine5 posts={blogPosts} />
          <div className="mt-20 flex justify-center">
            <Button href="/blog" outline>
              Show all blog articles
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div> */}

        {/* <Divider /> */}
        <SectionClientSay />
      </div>
    </div>
  )
}

export default PageHome
