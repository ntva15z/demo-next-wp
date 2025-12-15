import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildMenuTree } from '@/lib/utils/menu';
import { WPMenuItem, WPMenuItemWithChildren } from '@/lib/wordpress/types';

/**
 * **Feature: nextjs-wordpress-app, Property 8: Menu tree building**
 * **Validates: Requirements 5.2**
 */
describe('Property: Menu tree building', () => {
  const createMenuItem = (
    id: string,
    parentId: string | null,
    label: string = 'Menu Item'
  ): WPMenuItem => ({
    id,
    label,
    url: `https://example.com/${label.toLowerCase().replace(/\s+/g, '-')}`,
    path: `/${label.toLowerCase().replace(/\s+/g, '-')}`,
    parentId,
    cssClasses: [],
  });

  const menuIdArb = fc.uuid();

  const menuItemsArb: fc.Arbitrary<WPMenuItem[]> = fc
    .array(menuIdArb, { minLength: 0, maxLength: 10 })
    .chain((ids) => {
      if (ids.length === 0) {
        return fc.constant([] as WPMenuItem[]);
      }
      const itemArbitraries = ids.map((id, index) => {
        const possibleParents = ids.slice(0, index);
        const parentArb =
          possibleParents.length > 0
            ? fc.oneof(
                fc.constant(null as string | null),
                fc.constantFrom(...possibleParents)
              )
            : fc.constant(null as string | null);
        return fc.tuple(
          fc.constant(id),
          parentArb,
          fc.string({ minLength: 1, maxLength: 20 })
        );
      });
      return fc.tuple(...itemArbitraries).map((tuples) =>
        tuples.map(([id, parentId, label]) => createMenuItem(id, parentId, label))
      );
    });

  function countTreeItems(nodes: WPMenuItemWithChildren[]): number {
    return nodes.reduce((sum, node) => sum + 1 + countTreeItems(node.children), 0);
  }

  function collectTreeIds(nodes: WPMenuItemWithChildren[]): Set<string> {
    const ids = new Set<string>();
    function traverse(items: WPMenuItemWithChildren[]) {
      items.forEach((item) => {
        ids.add(item.id);
        traverse(item.children);
      });
    }
    traverse(nodes);
    return ids;
  }

  it('should preserve all items when building tree', () => {
    fc.assert(
      fc.property(menuItemsArb, (items) => {
        const tree = buildMenuTree(items);
        expect(countTreeItems(tree)).toBe(items.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all item IDs when building tree', () => {
    fc.assert(
      fc.property(menuItemsArb, (items) => {
        const tree = buildMenuTree(items);
        const inputIds = new Set(items.map((i) => i.id));
        const treeIds = collectTreeIds(tree);
        inputIds.forEach((id) => expect(treeIds.has(id)).toBe(true));
        expect(treeIds.size).toBe(inputIds.size);
      }),
      { numRuns: 100 }
    );
  });

  it('should place root items at top level', () => {
    fc.assert(
      fc.property(menuItemsArb, (items) => {
        const tree = buildMenuTree(items);
        const itemIds = new Set(items.map((i) => i.id));
        tree.forEach((root) => {
          expect(root.parentId === null || !itemIds.has(root.parentId)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty input gracefully', () => {
    expect(buildMenuTree([])).toEqual([]);
  });

  it('should handle items with no parent relationships', () => {
    fc.assert(
      fc.property(fc.array(menuIdArb, { minLength: 1, maxLength: 10 }), (ids) => {
        const items = ids.map((id) => createMenuItem(id, null, `Item-${id.slice(0, 8)}`));
        const tree = buildMenuTree(items);
        expect(tree.length).toBe(items.length);
        tree.forEach((item) => expect(item.children).toEqual([]));
      }),
      { numRuns: 100 }
    );
  });
});
