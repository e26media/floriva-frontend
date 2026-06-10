import { getCollections } from '@/data/data'
import { getNavigation } from '@/data/navigation'
import { FC } from 'react'
import HeaderSpacer from './HeaderSpacer'
import StickyHeader from './StickyHeader'

export interface Props {
  hasBorder?: boolean
}

const Header2: FC<Props> = async ({ hasBorder = true }) => {
  const navigationMenu = await getNavigation()
  const allCollections = await getCollections()

  return (
    <>
      <HeaderSpacer />

      <StickyHeader
        hasBorder={hasBorder}
        navigationMenu={navigationMenu}
        featuredCollection={allCollections[10]}
      />
    </>
  )
}

export default Header2