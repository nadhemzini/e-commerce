import { prisma } from '../app';
import { createError } from '../middlewares/errorHandler.middleware';
import { z } from 'zod';

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const productQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z
    .enum(['price_asc', 'price_desc', 'popular', 'newest', 'rating'])
    .optional()
    .default('newest'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(12),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  categoryId: z.string().cuid(),
  images: z.array(z.string().url()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
});

export const updateProductSchema = createProductSchema.partial();

// ─── Product Service ──────────────────────────────────────────────────────────

/**
 * Returns a paginated list of products with optional filters and sorting.
 */
export const getProducts = async (query: z.infer<typeof productQuerySchema>) => {
  const { q, category, minPrice, maxPrice, rating, inStock, sort, page, limit } = query;
  const skip = (page - 1) * limit;

  // Build dynamic where clause
  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (category) {
    where.category = { slug: category };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice }),
    };
  }
  if (rating) {
    where.averageRating = { gte: rating };
  }
  if (inStock) {
    where.stock = { gt: 0 };
  }

  // Sort mapping
  const orderBy: Record<string, unknown> =
    sort === 'price_asc'
      ? { price: 'asc' }
      : sort === 'price_desc'
      ? { price: 'desc' }
      : sort === 'popular'
      ? { soldCount: 'desc' }
      : sort === 'rating'
      ? { averageRating: 'desc' }
      : { createdAt: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { select: { id: true, sku: true, options: true, price: true, stock: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Returns autocomplete suggestions for a search query (top 5 matches).
 */
export const getAutocomplete = async (q: string) => {
  if (!q || q.length < 2) return [];

  return prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ],
    },
    select: { id: true, name: true, slug: true, images: true, price: true },
    take: 5,
    orderBy: { soldCount: 'desc' },
  });
};

/**
 * Returns the full detail of a single product.
 */
export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
      reviews: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product) throw createError('Product not found', 404);
  return product;
};

/**
 * Returns products similar to the given product (same category).
 */
export const getRelatedProducts = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { categoryId: true },
  });

  if (!product) throw createError('Product not found', 404);

  return prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: id } },
    take: 4,
    orderBy: { soldCount: 'desc' },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
};

/** Creates a new product. */
export const createProduct = async (data: z.infer<typeof createProductSchema>) => {
  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now();

  return prisma.product.create({
    data: { ...data, slug },
    include: { category: true },
  });
};

/** Updates a product. */
export const updateProduct = async (
  id: string,
  data: z.infer<typeof updateProductSchema>
) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw createError('Product not found', 404);

  return prisma.product.update({ where: { id }, data, include: { category: true } });
};

/** Deletes a product. */
export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw createError('Product not found', 404);

  return prisma.product.delete({ where: { id } });
};

/** Adds image URLs to a product. */
export const addProductImages = async (id: string, imageUrls: string[]) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw createError('Product not found', 404);

  return prisma.product.update({
    where: { id },
    data: { images: { push: imageUrls } },
  });
};
