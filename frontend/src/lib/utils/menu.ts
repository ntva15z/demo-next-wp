import { WPMenuItem, WPMenuItemWithChildren } from '@/lib/wordpress/types';

/**
 * Builds a nested menu tree from a flat list of menu items
 * Items with parentId are grouped under their parent
 * Requirements: 5.2
 * 
 * @param items - Flat array of menu items
 * @returns Array of root menu items with children nested
 */
export function buildMenuTree(items: WPMenuItem[]): WPMenuItemWithChildren[] {
  const itemMap = new Map<string, WPMenuItemWithChildren>();
  const roots: WPMenuItemWithChildren[] = [];

  // First pass: create all nodes with empty children arrays
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: build the tree structure
  items.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentId && itemMap.has(item.parentId)) {
      // Has a parent that exists in our list - add as child
      itemMap.get(item.parentId)!.children.push(node);
    } else {
      // No parent or parent not in list - this is a root item
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Checks if a path matches the current pathname for active state
 * Requirements: 5.3
 * 
 * @param itemPath - Menu item path to check
 * @param currentPath - Current pathname from router
 * @returns true if the item should be highlighted as active
 */
export function isActivePath(itemPath: string, currentPath: string): boolean {
  // Normalize paths by removing trailing slashes
  const normalizedItemPath = itemPath.replace(/\/$/, '') || '/';
  const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
  
  return normalizedItemPath === normalizedCurrentPath;
}
