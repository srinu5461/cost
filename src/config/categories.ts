/**
 * STATIC CATEGORY CONFIGURATION (COLORFUL MATCHING ICONS)
 */

export const staticCategories = [
  {
    name: 'Furniture',
    slug: 'furniture',
    path: '/products?category=Furniture',
    iconName: 'Armchair',
    iconColor: '#E31837',
    iconBg: '#FFF1F2',
    enabled: true,
    children: [
      { name: 'Chairs & Bar Stools', path: '/products?category=Dining Chairs', items: ['Restaurant Chairs', 'Outdoor Chairs', 'Bar Stools'] },
      { name: 'Tables', path: '/products?category=Restaurant Tables', items: ['Table Tops', 'Table Bases', 'Outdoor Tables'] },
      { name: 'Kitchen Furniture', path: '/products?category=Kitchen Furniture', items: ['Warewashing Tables', 'Wall Shelves', 'Kitchen Sinks'] }
    ]
  },
  {
    name: 'Commercial Kitchen Machines',
    slug: 'commercial-kitchen-machines',
    path: '/products?category=Commercial Kitchen Machines',
    iconName: 'ChefHat',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    enabled: true,
    children: [
      { name: 'Food Preparation Equipment', path: '/products?category=Food Preparation Equipment', items: ['Processors', 'Slicers', 'Mixers'] },
      { name: 'Commercial Ovens & Cooking', path: '/products?category=Commercial Ovens', items: ['Convection Ovens', 'Fryers', 'Ranges'] }
    ]
  },
  {
    name: 'Tableware & Bar Supplies',
    slug: 'tableware-bar-supplies',
    path: '/products?category=Beverage Equipment',
    iconName: 'Wine',
    iconColor: '#0284C7',
    iconBg: '#F0F9FF',
    enabled: true,
    children: [
      { name: 'Glassware', path: '/products?category=Glassware', items: ['Wine Glasses', 'Beer Glasses', 'Tumblers'] },
      { name: 'Barware & Cocktail', path: '/products?category=Barware', items: ['Cocktail Shakers', 'Ice Buckets', 'Pourers'] }
    ]
  },
  {
    name: 'Consumables',
    slug: 'consumables',
    path: '/products?category=Consumables',
    iconName: 'Package',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    enabled: true,
    children: [
      { name: 'Food Packaging', path: '/products?category=Consumables', items: ['Takeaway Containers', 'Cups & Lids', 'Napkins'] },
      { name: 'Beverage Consumables', path: '/products?category=Consumables', items: ['Coffee Beans', 'Syrups', 'Tea Bags'] }
    ]
  },
  {
    name: 'Clothing, Aprons & Footwear',
    slug: 'clothing-aprons-footwear',
    path: '/products?category=Clothing',
    iconName: 'Shirt',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    enabled: true,
    children: [
      { name: 'Chef Jackets & Trousers', path: '/products?category=Clothing', items: ['Chef Jackets', 'Chef Pants', 'Aprons'] },
      { name: 'Safety Footwear', path: '/products?category=Clothing', items: ['Kitchen Shoes', 'Safety Boots'] }
    ]
  },
  {
    name: 'Kitchenware & Storage',
    slug: 'kitchenware-storage',
    path: '/products?category=Kitchenware',
    iconName: 'Utensils',
    iconColor: '#7C3AED',
    iconBg: '#F3E8FF',
    enabled: true,
    children: [
      { name: 'Pots & Pans', path: '/products?category=Pots & Pans', items: ['Stock Pots', 'Frying Pans', 'Saucepans'] },
      { name: 'Gastronorm Containers', path: '/products?category=Gastronorm Pans', items: ['Stainless Steel GN Pans', 'Polycarbonate Containers'] }
    ]
  },
  {
    name: 'Cleaning & Hygiene',
    slug: 'cleaning-hygiene',
    path: '/products?category=Cleaning & Hygiene',
    iconName: 'Sparkles',
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
    enabled: true,
    children: [
      { name: 'Commercial Dishwashers', path: '/products?category=Dishwashers', items: ['Undercounter Dishwashers', 'Pass-Through Dishwashers'] },
      { name: 'Sanitizers & Chemicals', path: '/products?category=Chemicals', items: ['Surface Sanitizers', 'Dishwashing Detergents'] }
    ]
  },
  {
    name: 'Refrigeration & Ice Machines',
    slug: 'refrigeration-ice-machines',
    path: '/products?category=Refrigeration & Ice Machines',
    iconName: 'Snowflake',
    iconColor: '#0D9488',
    iconBg: '#CCFBF1',
    enabled: true,
    children: [
      { name: 'Upright Fridges & Freezers', path: '/products?category=Upright Fridges', items: ['1-Door Upright Fridge', '2-Door Upright Freezer'] },
      { name: 'Ice Machines', path: '/products?category=Ice Machines', items: ['Cube Ice Makers', 'Flake Ice Machines'] }
    ]
  },
  {
    name: 'Clearance And Special Offers',
    slug: 'clearance-special-offers',
    path: '/products?multibuy=true',
    iconName: 'Tag',
    iconColor: '#DC2626',
    iconBg: '#FEF2F2',
    enabled: true,
    children: [
      { name: 'Multi-Buy Deals & Packages', path: '/products?multibuy=true', items: ['Bulk Discounts', 'Package Deals', 'Wholesale Bundles'] },
      { name: 'Clearance Equipment', path: '/products?sort=priceLow', items: ['Ex-Demo Equipment', 'Stock Clearance', 'Special Offers'] }
    ]
  },
  {
    name: 'Simco Equipment',
    slug: 'simco-equipment',
    path: '/products?category=Simco Equipment',
    iconName: 'ChefHat',
    iconColor: '#E31837',
    iconBg: '#FFF1F2',
    enabled: true,
    children: [
      { name: 'Simco Cooking Equipment', path: '/products?category=Simco Cooking Equipment', items: ['Simco Fryers', 'Simco Griddles', 'Simco Ranges'] },
      { name: 'Simco Refrigeration', path: '/products?category=Simco Refrigeration', items: ['Simco Upright Fridges', 'Simco Freezers', 'Simco Prep Tables'] }
    ]
  }
];
