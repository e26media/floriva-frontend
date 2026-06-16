import SocialsList1 from '@/shared/SocialsList1/SocialsList1'
import { FC } from 'react'

interface SocialsListProps {
  className?: string
  itemClass?: string
}

const SocialsList: FC<SocialsListProps> = ({ className }) => {
  return <SocialsList1 className={className} />
}

export default SocialsList
