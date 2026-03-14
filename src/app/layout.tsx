import Aside from '@/components/aside'
import '@/styles/tailwind.css'
import { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import GlobalClient from './GlobalClient'

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    template: '%s - Floriva Gift',
    default: 'Floriva',
  },
  description:
    'Floriva Flowers is a modern and elegant flower shop website built with Next.js, Tailwind CSS, and TypeScript. It is designed for online flower ordering, bouquet showcases, and seamless e-commerce experiences with high performance and accessibility.',
  keywords: [    'Floriva Flowers',
  'Flower Shop',
  'Online Flower Store',
  'Bouquets',
  'Floral Arrangements',
  'Floriva Gift',
  'Florist Website',
  'E-commerce Flowers'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
        lang="en"
        className={poppins.className}
        data-google-analytics-opt-out="" // keep attribute on server side to match client
        suppressHydrationWarning={true}
      >
      <body className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200">
        <Aside.Provider>
          {children}

          {/* Client component: Toaster, ... */}
          <GlobalClient />

        </Aside.Provider>
      </body>
    </html>
  )
}
