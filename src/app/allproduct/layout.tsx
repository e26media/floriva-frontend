import Header from '@/components/Header/Header'
import { ApplicationLayout } from '.././(shop)/application-layout'


// src\app\(shop)\application-layout.tsx
import Header2 from '@/components/Header/Header2';

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return <ApplicationLayout header={<Header2/>}>{children}</ApplicationLayout>
}
