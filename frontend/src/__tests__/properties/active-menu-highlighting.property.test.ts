import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isActivePath } from '@/lib/utils/menu';

/**
 * **Feature: nextjs-wordpress-app, Property 9: Active menu highlighting**
 * **Validates: Requirements 5.3**
 *
 * For any current pathname, the navigation component should correctly identify
 * and highlight the menu item whose path matches the current pathname.
 */
describe('Property: Active menu highlighting', () => {
  // Arbitrary for generating valid URL paths
  const pathArb = fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/')), { minLength: 1, maxLength: 5 })
    .map(segments => '/' + segments.join('/'));

  it('should return true when paths are exactly equal', () => {
    fc.assert(
      fc.property(pathArb, (path) => {
        expect(isActivePath(path, path)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should return true when paths differ only by trailing slash', () => {
    fc.assert(
      fc.property(pathArb, (path) => {
        const pathWithSlash = path.endsWith('/') ? path : path + '/';
        const pathWithoutSlash = path.replace(/\/$/, '');
        
        // Path with trailing slash should match path without
        expect(isActivePath(pathWithSlash, pathWithoutSlash)).toBe(true);
        expect(isActivePath(pathWithoutSlash, pathWithSlash)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should return false when paths are different', () => {
    fc.assert(
      fc.property(pathArb, pathArb, (path1, path2) => {
        // Normalize both paths for comparison
        const normalized1 = path1.replace(/\/$/, '') || '/';
        const normalized2 = path2.replace(/\/$/, '') || '/';
        
        // Only test when paths are actually different
        if (normalized1 !== normalized2) {
          expect(isActivePath(path1, path2)).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle root path correctly', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/', '/about')).toBe(false);
    expect(isActivePath('/about', '/')).toBe(false);
  });

  it('should be case-sensitive for paths', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.toLowerCase() !== s.toUpperCase() && !s.includes('/')),
        (segment) => {
          const lowerPath = `/${segment.toLowerCase()}`;
          const upperPath = `/${segment.toUpperCase()}`;
          
          // Different cases should not match (URLs are case-sensitive)
          if (lowerPath !== upperPath) {
            expect(isActivePath(lowerPath, upperPath)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not match partial paths', () => {
    fc.assert(
      fc.property(pathArb, (basePath) => {
        const extendedPath = basePath + '/extra';
        
        // A path should not match its parent or child paths
        expect(isActivePath(basePath, extendedPath)).toBe(false);
        expect(isActivePath(extendedPath, basePath)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
