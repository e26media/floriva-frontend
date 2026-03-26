import Header from '@/components/Header/Header'
import { ApplicationLayout } from '../application-layout'
import Header2 from '@/components/Header/Header2';
import Header5 from '@/components/Header/Header5';

export default function Layout({ children, params }: { children: React.ReactNode; params: any }) {
  return <ApplicationLayout header={<Header5/>}>{children}</ApplicationLayout>
}
