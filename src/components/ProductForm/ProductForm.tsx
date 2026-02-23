'use client'

import { NotifyAddToCart } from '@/components/AddToCardButton'
import { TProductDetail } from '@/data/data'
import Form from 'next/form'
import React from 'react'
import toast from 'react-hot-toast'

const ProductForm = ({
  children,
  className,
  product,
}: {
  children?: React.ReactNode
  className?: string
  product: TProductDetail
}) => {
  const { featuredImage, title, price } = product

  const notifyAddTocart = (quantity: number, size: string, color: string) => {
    toast.custom(
      (t) => (
        <NotifyAddToCart
          show={t.visible}
          imageUrl={featuredImage?.src || ''}
          quantity={quantity}
          size={size}
          color={color}
          title={title!}
          price={price!}
        />
      ),
      { position: 'top-right', id: 'nc-product-notify', duration: 4000 }
    )
  }

  const onFormSubmit = async (formData: FormData) => {
    const formObjectEntries = Object.fromEntries(formData.entries())
    const quantity = formData.get('quantity') ? Number(formData.get('quantity')) : 1
    const size = formData.get('size') ? String(formData.get('size')) : ''
    const color = formData.get('color') ? String(formData.get('color')) : ''

    notifyAddTocart(quantity, size, color)
    // Here you can handle the form submission, such as adding the product to the cart
    // For example, you might call an API endpoint to add the product to the cart

    console.log('Form submitted with data:', {
      productId: product.id,
      quantity,
      size,
      color,
      formObjectEntries,
    })
  }

  return (
    <Form action={onFormSubmit} className={className}>
      {children}
    </Form>
  )
}

export default ProductForm
