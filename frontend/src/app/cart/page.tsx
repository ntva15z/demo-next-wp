'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Shopping Cart Page
 * Based on Globex theme
 */

interface CartItem {
  id: string;
  name: string;
  brand: string;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  size: string;
  color: string;
}

// Mock cart data
const initialCartItems: CartItem[] = [
  {
    id: '1',
    name: 'Womens Denim Jacket (Blue)',
    brand: 'Brand Name',
    slug: 'womens-denim-jacket-blue',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
    price: 700,
    originalPrice: 1000,
    quantity: 1,
    size: 'M',
    color: 'Blue',
  },
  {
    id: '2',
    name: 'Womens Black Tshirt',
    brand: 'Brand Name',
    slug: 'womens-black-tshirt',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80',
    price: 100,
    originalPrice: 150,
    quantity: 2,
    size: 'S',
    color: 'Black',
  },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <svg
            className="w-24 h-24 text-gray-300 mx-auto mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-3 bg-[#0d4f4f] text-white font-semibold rounded-lg hover:bg-[#0a3d3d] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-[#0d4f4f]">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Shopping Cart</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Shopping Cart
          <span className="text-gray-500 font-normal text-lg ml-2">
            ({cartItems.length} items)
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 md:p-6"
              >
                <div className="flex gap-4 md:gap-6">
                  {/* Product Image */}
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-semibold text-gray-900 hover:text-[#0d4f4f] line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <p className="text-gray-500 text-sm">{item.brand}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Size: {item.size} | Color: {item.color}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Price & Quantity */}
                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          Rs. {item.price.toLocaleString()}
                        </span>
                        {item.originalPrice && (
                          <span className="text-gray-400 text-sm line-through">
                            Rs. {item.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-gray-900 font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {shipping === 0 ? 'Free' : `Rs. ${shipping}`}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-green-600 text-xs">
                    You qualify for free shipping!
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="mt-6">
                <label className="text-sm text-gray-600 block mb-2">
                  Have a coupon code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0d4f4f]"
                  />
                  <button className="px-4 py-2 border border-[#0d4f4f] text-[#0d4f4f] text-sm font-medium rounded-lg hover:bg-[#0d4f4f] hover:text-white transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="block w-full mt-6 py-3 bg-[#0d4f4f] text-white text-center font-semibold rounded-lg hover:bg-[#0a3d3d] transition-colors"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/shop"
                className="block w-full mt-3 py-3 border border-gray-300 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
