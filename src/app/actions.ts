'use server'

export async function addToCart(formData: FormData) {
  // Handle form submission logic here
  const formObjectEntries = Object.fromEntries(formData.entries())
  console.log('Add to cart submitted:', formObjectEntries)
  // You can add your cart logic here, such as updating the cart state or making an API call
}
