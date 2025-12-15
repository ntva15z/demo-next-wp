'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { WPMenuItem } from '@/lib/wordpress/types';
import { buildMenuTree, isActivePath } from '@/lib/utils/menu';

// Re-export for backwards compatibility
export { buildMenuTree, isActivePath } from '@/lib/utils/menu';

interface NavigationProps {
  items: WPMenuItem[];
}


/**
 * Navigation component with desktop and mobile responsive layouts
 * Supports nested menu items with dropdown on desktop and expandable on mobile
 * Requirements: 5.2, 5.4
 */
export default function Navigation({ items }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuTree = buildMenuTree(items);

  return (
    <nav>
      {/* Desktop Menu */}
      <div className="hidden md:flex space-x-6">
        {menuTree.map((item) => (
          <div key={item.id} className="relative group">
            <Link
              href={item.path}
              className={`py-2 text-sm font-medium transition-colors ${
                isActivePath(item.path, pathname)
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {item.label}
            </Link>
            {item.children.length > 0 && (
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-gray-100">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.path}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActivePath(child.path, pathname)
                        ? 'text-blue-600 bg-blue-50 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50">
          <div className="container mx-auto px-4 py-4">
            {menuTree.map((item) => (
              <div key={item.id} className="py-1">
                <Link
                  href={item.path}
                  className={`block py-2 text-sm font-medium transition-colors ${
                    isActivePath(item.path, pathname)
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.path}
                    className={`block py-2 pl-4 text-sm transition-colors ${
                      isActivePath(child.path, pathname)
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
