type CategoryLike = {
  _id?: string;
  id?: string;
  name?: string;
  categoryName?: string;
  title?: string;
  subCategories?: { _id: string; name: string }[];
};

type ProductWithCategories = {
  category?: CategoryLike | string | null;
  categories?: Array<CategoryLike | string | null>;
};

function categoryId(item: CategoryLike | string | null | undefined): string {
  if (!item) return '';
  if (typeof item === 'object') return item._id || item.id || '';
  return String(item);
}

export function getProductCategoryIds(product: ProductWithCategories): string[] {
  const fromArray = (product.categories || [])
    .map(categoryId)
    .filter(Boolean);

  if (fromArray.length > 0) return fromArray;

  const single = categoryId(product.category ?? null);
  return single ? [single] : [];
}

export function productInCategory(product: ProductWithCategories, categoryIdValue: string): boolean {
  if (!categoryIdValue) return false;
  return getProductCategoryIds(product).includes(categoryIdValue);
}

type ProductWithSubCategories = {
  subCategory?: unknown;
  subCategories?: unknown[];
};

function subCategoryId(item: unknown): string {
  if (!item) return '';
  if (typeof item === 'object') {
    const record = item as { _id?: string; id?: string };
    return record._id || record.id || '';
  }
  return String(item);
}

/** All sub-category ids assigned to a product (supports multi sub-category). */
export function getProductSubCategoryIds(product: ProductWithSubCategories): string[] {
  const fromArray = (product.subCategories || [])
    .map(subCategoryId)
    .filter(Boolean);

  if (fromArray.length > 0) return fromArray;

  const single = subCategoryId(product.subCategory);
  return single ? [single] : [];
}

export function productInSubCategory(product: ProductWithSubCategories, subCategoryIdValue: string): boolean {
  if (!subCategoryIdValue) return false;
  return getProductSubCategoryIds(product).includes(subCategoryIdValue);
}

type ProductWithFeatured = ProductWithCategories & {
  FeaturedProduct?: unknown;
  featuredProduct?: unknown;
  featured_product?: unknown;
};

function normalizeLabel(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

function categoryNameOf(cat?: CategoryLike | null): string {
  return normalizeLabel(cat?.name || cat?.categoryName || cat?.title);
}

function featuredName(item: unknown): string {
  if (!item) return '';
  if (typeof item === 'string') return normalizeLabel(item);
  if (typeof item === 'object') {
    const record = item as { name?: string; title?: string; label?: string };
    return normalizeLabel(record.name || record.title || record.label);
  }
  return '';
}

export function productHasFeaturedLabel(product: ProductWithFeatured, label: string): boolean {
  const raw =
    product.FeaturedProduct ??
    product.featuredProduct ??
    product.featured_product ??
    null;
  const expected = normalizeLabel(label);

  if (Array.isArray(raw)) {
    return raw.some(item => featuredName(item) === expected);
  }

  return featuredName(raw) === expected;
}

export function productMatchesCategoryListing(
  product: ProductWithFeatured,
  listingCategory: CategoryLike
): boolean {
  if (productInCategory(product, categoryId(listingCategory))) return true;

  if (categoryNameOf(listingCategory) === 'best seller') {
    return productHasFeaturedLabel(product, 'Best Seller');
  }

  return false;
}

export function collectCategoriesFromProducts(products: ProductWithCategories[]): CategoryLike[] {
  const categoryMap = new Map<string, CategoryLike>();

  for (const product of products) {
    const populated = (product.categories || []).filter(
      (item): item is CategoryLike => !!item && typeof item === 'object'
    );

    if (populated.length > 0) {
      for (const cat of populated) {
        const id = categoryId(cat);
        if (id && !categoryMap.has(id)) categoryMap.set(id, cat);
      }
      continue;
    }

    if (product.category && typeof product.category === 'object') {
      const id = categoryId(product.category);
      if (id && !categoryMap.has(id)) categoryMap.set(id, product.category);
    }
  }

  return Array.from(categoryMap.values());
}
