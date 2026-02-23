import React from 'react'
import { Button, type ButtonProps } from './Button'

const ButtonPrimary: React.FC<ButtonProps> = ({ plain, outline, ...props }) => {
  return <Button color="dark/white" {...props} />
}

export default ButtonPrimary
