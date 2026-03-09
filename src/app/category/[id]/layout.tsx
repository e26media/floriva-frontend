import Header from '@/components/Header/Header'
import { ApplicationLayout } from '../../(shop)/application-layout'


import Header2 from '@/components/Header/Header2';
import Header3 from '@/components/Header/Header3';

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return <ApplicationLayout header={<Header2/>}>{children}</ApplicationLayout>
}
