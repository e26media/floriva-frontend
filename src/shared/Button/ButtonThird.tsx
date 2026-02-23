import React from 'react'
import { Button, type ButtonProps } from './Button'

const ButtonThird: React.FC<ButtonProps> = ({ color, outline, ...props }) => {
  return <Button {...props} plain />
}

export default ButtonThird
