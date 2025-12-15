import Link from 'next/link';
import { fetchGraphQL } from '@/lib/wordpress/client';
import { GET_MENU } from '@/lib/wordpress/queries';
import { MenuResponse, WPMenuItem } from '@/lib/wordpress/types';
import Navigation from './Navigation';

/**
 * Header component that fetches menu from WordPress and renders navigation
 * Server component that fetches menu data at build/request time
 * Requirements: 5.1
 */
export default async function Header() {
  let menuItems: WPMenuItem[] = [];

  try {
    const data = await fetchGraphQL<MenuResponse>(
      GET_MENU,
      { location: 'PRIMARY' },
      { tags: ['menu'], revalidate: 60 }
    );
    menuItems = data.menuItems?.nodes || [];
  } catch (error) {
    // Log error but don't crash - render header without menu
    console.error('Failed to fetch menu:', error);
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Logo
          </Link>
          <Navigation items={menuItems} />
        </div>
      </div>
    </header>
  );
}
