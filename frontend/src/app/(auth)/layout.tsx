"use client";

import Link from "next/link";

/**
 * Auth layout - minimal layout for login/register pages
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            Globex
          </Link>
          <p className="mt-2 text-gray-600">Chào mừng bạn đến với cửa hàng</p>
        </div>
        {children}
      </div>
    </div>
  );
}
