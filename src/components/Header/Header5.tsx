import { getCollections } from '@/data/data'
import { getNavigation } from '@/data/navigation'
import { FC } from 'react'
import HeaderSpacer from './HeaderSpacer'
import StickyHeader5 from './StickyHeader5'

export interface Props {
  hasBorder?: boolean
}

const Header5: FC<Props> = async ({ hasBorder = true }) => {
  const navigationMenu = await getNavigation()
  const allCollections = await getCollections()

  return (
    <>
      <HeaderSpacer />

      <StickyHeader5
        hasBorder={hasBorder}
        navigationMenu={navigationMenu}
        featuredCollection={allCollections[10]}
      />
    </>
  )
}

export default Header5