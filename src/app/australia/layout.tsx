import Header5 from '@/components/Header/Header5'
import { ApplicationLayout } from '../(shop)/application-layout'

export default function AustraliaLayout({ children }: { children: React.ReactNode }) {
  return <ApplicationLayout header={<Header5 />}>{children}</ApplicationLayout>
}
