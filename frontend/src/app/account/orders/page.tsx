'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * My Orders Page - Order History
 * Based on Figma design - Globex theme
 */

interface Order {
  id: string;
  orderNumber: string;
  product: {
    name: string;
    brand: string;
    image: string;
    price: number;
  };
  orderDate: string;
  shipTo: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '#124-5660-9008',
    product: {
      name: 'Womens Black Tshirt',
      brand: 'Brand Name',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80',
      price: 100,
    },
    orderDate: '3 October 2020',
    shipTo: 'Anna Kathy',
    status: 'delivered',
  },
  {
    id: '2',
    orderNumber: '#124-5660-9008',
    product: {
      name: 'Womens White Skirt',
      brand: 'Brand Name',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
      price: 100,
    },
    orderDate: '3 October 2020',
    shipTo: 'Anna Kathy',
    status: 'processing',
  },
];

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Product Image */}
        <div className="relative w-full md:w-32 h-40 md:h-32 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          <Image
            src={order.product.image}
            alt={order.product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 128px"
          />
        </div>

        {/* Order Details */}
        <div className="flex-1 flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-lg">
              {order.product.name}
            </h3>
            <p className="text-gray-500 text-sm">{order.product.brand}</p>
            <p className="font-semibold text-gray-900">${order.product.price}</p>
            
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <span className="text-gray-500">Order Placed on :</span>{' '}
                <span className="text-gray-900">{order.orderDate}</span>
              </p>
              <p className="text-gray-600">
                <span className="text-gray-500">Ship To :</span>{' '}
                <span className="text-gray-900">{order.shipTo}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2">
              <button className="px-4 py-2 bg-[#0d4f4f] text-white text-sm font-medium rounded hover:bg-[#0a3d3d] transition-colors">
                Add to cart
              </button>
              <button className="text-[#0d4f4f] text-sm font-medium hover:underline">
                Cancel
              </button>
            </div>
          </div>

          {/* Order Number & View Details */}
          <div className="text-right space-y-2">
            <p className="text-sm">
              <span className="text-gray-500">Order Number :</span>{' '}
              <span className="text-gray-900 font-medium">{order.orderNumber}</span>
            </p>
            <Link
              href={`/account/orders/${order.id}`}
              className="text-[#0d4f4f] text-sm font-medium hover:underline inline-block"
            >
              View Order Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const totalItems = mockOrders.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            My <span className="text-[#0d4f4f]">Orders</span>
            <span className="text-gray-500 font-normal text-lg ml-2">
              ({totalItems} Items)
            </span>
          </h1>
        </div>

        {/* Orders List */}
        {mockOrders.length > 0 ? (
          <div className="space-y-4">
            {mockOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">
              Looks like you haven&apos;t placed any orders yet.
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-[#0d4f4f] text-white font-medium rounded-lg hover:bg-[#0a3d3d] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
