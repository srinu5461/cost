/**
 * Convert a category name to a URL-friendly slug
 * Example: "Commercial Kitchen Machines & Dishwashers" -> "commercial-kitchen-machines-dishwashers"
 */
export function categoryToSlug(category: string): string {
  if (!category) return '';
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const KNOWN_SLUG_MAP: Record<string, string> = {
  'furniture': 'Furniture',
  'commercial-kitchen-machines': 'Commercial Kitchen Machines',
  'tableware-bar-supplies': 'Tableware & Bar Supplies',
  'tableware-and-bar-supplies': 'Tableware & Bar Supplies',
  'consumables': 'Consumables',
  'clothing': 'Clothing',
  'clothing-aprons-footwear': 'Clothing',
  'kitchenware': 'Kitchenware',
  'kitchenware-storage': 'Kitchenware & Storage',
  'cleaning-hygiene': 'Cleaning & Hygiene',
  'cleaning-and-hygiene': 'Cleaning & Hygiene',
  'refrigeration-ice-machines': 'Refrigeration & Ice Machines',
  'refrigeration-and-ice-machines': 'Refrigeration & Ice Machines',
  'refrigeration': 'Refrigeration & Ice Machines',
  'beverage-equipment': 'Beverage Equipment',
  'food-preparation-equipment': 'Food Preparation Equipment',
  'commercial-ovens': 'Commercial Ovens',
  'dining-chairs': 'Dining Chairs',
  'restaurant-tables': 'Restaurant Tables',
  'kitchen-furniture': 'Kitchen Furniture',
  'glassware': 'Glassware',
  'barware': 'Barware',
  'pots-and-pans': 'Pots & Pans',
  'gastronorm-pans': 'Gastronorm Containers',
  'dishwashers': 'Commercial Dishwashers',
  'chemicals': 'Sanitizers & Chemicals',
  'upright-fridges': 'Upright Fridges & Freezers',
  'ice-machines': 'Ice Machines',
};

/**
 * Convert a slug back to the original category format for database lookup
 * This is used to match against fullPath in the database
 */
export function slugToCategory(slug: string, categories: any[]): string | null {
  if (!slug) return null;
  const lowerSlug = slug.toLowerCase().trim();

  // 1. Recursive search in categories tree first to return the exact fullPath
  const findCategory = (nodes: any[]): string | null => {
    if (!Array.isArray(nodes)) return null;
    for (const category of nodes) {
      const fullPath = category.fullPath || category.path || category.name || '';
      const catName = category.name || '';
      const catCode = category.code || '';

      if (fullPath && categoryToSlug(fullPath) === lowerSlug) {
        return fullPath;
      }
      if (catName && categoryToSlug(catName) === lowerSlug) {
        return fullPath || catName;
      }
      if (catCode && categoryToSlug(catCode) === lowerSlug) {
        return fullPath || catName;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategory(category.children);
        if (found) return found;
      }
    }
    return null;
  };

  if (Array.isArray(categories) && categories.length > 0) {
    const matched = findCategory(categories);
    if (matched) return matched;
  }

  // 2. Known slug map fallback
  if (KNOWN_SLUG_MAP[lowerSlug]) {
    return KNOWN_SLUG_MAP[lowerSlug];
  }

  // 3. Fallback: Format slug into a clean Title Case category string
  return lowerSlug
    .split('-')
    .map(word => word === 'and' ? '&' : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
