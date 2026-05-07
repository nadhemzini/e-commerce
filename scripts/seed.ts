/**
 * Database Seed Script
 * Populates the database with:
 * - 5 categories
 * - 50 products (with variants and images)
 * - 2 users (admin + regular)
 * - 20 reviews
 *
 * Run: npx ts-node scripts/seed.ts
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

// ─── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Clothing', slug: 'clothing' },
  { name: 'Books', slug: 'books' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Sports', slug: 'sports' },
];

// ─── Product templates per category ──────────────────────────────────────────
const PRODUCTS_BY_CATEGORY: Record<string, Array<{
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isFeatured?: boolean;
}>> = {
  electronics: [
    { name: 'Wireless Noise-Cancelling Headphones', description: 'Premium over-ear headphones with ANC technology, 30h battery life and hi-res audio support.', price: 199.99, compareAtPrice: 279.99, stock: 50, isFeatured: true },
    { name: 'Smart 4K UHD TV 55"', description: 'Ultra HD display with HDR10+, built-in streaming apps and voice control.', price: 549.99, compareAtPrice: 699.99, stock: 20, isFeatured: true },
    { name: 'Mechanical Gaming Keyboard', description: 'RGB backlit mechanical keyboard with Cherry MX switches and programmable macros.', price: 89.99, stock: 100 },
    { name: 'Portable Bluetooth Speaker', description: 'Waterproof IPX7 speaker, 360° sound, 24h playback, USB-C charging.', price: 59.99, compareAtPrice: 79.99, stock: 150 },
    { name: 'USB-C Hub 7-in-1', description: 'Multiport adapter with HDMI 4K, 100W PD, USB 3.0 × 3, SD/MicroSD reader.', price: 39.99, stock: 200 },
    { name: 'Smartwatch Pro', description: 'GPS, heart rate, SpO2 monitor, 5-day battery, swim-proof.', price: 249.99, compareAtPrice: 299.99, stock: 60, isFeatured: true },
    { name: 'Wireless Charging Pad', description: '15W fast wireless charger compatible with Qi devices, non-slip base.', price: 24.99, stock: 300 },
    { name: 'True Wireless Earbuds', description: 'ANC, transparency mode, 28h total battery, IPX4, multipoint connection.', price: 129.99, compareAtPrice: 169.99, stock: 80 },
    { name: 'Action Camera 4K', description: '4K/60fps, wide-angle lens, waterproof to 30m, included mounting kit.', price: 179.99, stock: 45 },
    { name: 'Laptop Stand Adjustable', description: 'Ergonomic aluminium stand, 6 height levels, foldable and portable.', price: 34.99, stock: 250 },
  ],
  clothing: [
    { name: 'Premium Cotton T-Shirt', description: 'Heavyweight 220g/m² organic cotton tee, pre-shrunk, GOTS certified.', price: 29.99, stock: 500, isFeatured: true },
    { name: 'Slim Fit Chino Trousers', description: 'Stretch cotton blend chinos, mid-rise, available in 8 colours.', price: 59.99, compareAtPrice: 79.99, stock: 200 },
    { name: 'Hooded Sweatshirt', description: '80% cotton fleece hoodie with kangaroo pocket and flat-lock seams.', price: 49.99, compareAtPrice: 64.99, stock: 300, isFeatured: true },
    { name: 'Running Jacket Windbreaker', description: 'Lightweight packable jacket, wind and water resistant, reflective details.', price: 89.99, stock: 100 },
    { name: 'Classic White Sneakers', description: 'Genuine leather upper, cushioned insole, vulcanised rubber sole.', price: 79.99, compareAtPrice: 99.99, stock: 150 },
    { name: 'Wool Blend Overcoat', description: 'Tailored fit double-breasted coat, 60% wool, dry-clean only.', price: 199.99, compareAtPrice: 279.99, stock: 50, isFeatured: true },
    { name: 'Technical Hiking Socks (3-pack)', description: 'Merino wool blend, cushioned foot-bed, moisture-wicking.', price: 19.99, stock: 600 },
    { name: 'Linen Summer Shorts', description: 'Relaxed fit linen shorts with elasticated waist and two side pockets.', price: 34.99, stock: 250 },
    { name: 'Cashmere Beanie', description: '100% pure cashmere knit beanie, one size fits most.', price: 44.99, compareAtPrice: 59.99, stock: 180 },
    { name: 'Performance Polo Shirt', description: 'Moisture-wicking UPF 50+ polo with flat-knit collar.', price: 39.99, stock: 350 },
  ],
  books: [
    { name: 'Clean Code: A Handbook of Agile Software Craftsmanship', description: 'Robert C. Martin\'s essential guide to writing maintainable, readable code.', price: 34.99, stock: 200, isFeatured: true },
    { name: 'Designing Data-Intensive Applications', description: 'Deep dive into the principles of scalable, reliable distributed systems.', price: 44.99, stock: 150, isFeatured: true },
    { name: 'The Pragmatic Programmer', description: 'Timeless advice from two experienced software engineers.', price: 39.99, compareAtPrice: 49.99, stock: 180 },
    { name: 'Atomic Habits', description: 'James Clear\'s proven framework for building good habits and breaking bad ones.', price: 16.99, stock: 500 },
    { name: 'Deep Work', description: 'Cal Newport on the value of focused, distraction-free professional work.', price: 14.99, compareAtPrice: 18.99, stock: 400 },
    { name: 'System Design Interview Vol. 1', description: 'Step-by-step guide to answering system design interview questions.', price: 29.99, stock: 250 },
    { name: 'JavaScript: The Good Parts', description: 'Douglas Crockford distils the best of JavaScript into a concise guide.', price: 22.99, stock: 300 },
    { name: 'The Manager\'s Path', description: 'Camille Fournier\'s guide for tech leads navigating engineering management.', price: 32.99, stock: 220 },
    { name: 'Refactoring: Improving the Design of Existing Code', description: 'Fowler\'s catalogue of refactoring techniques with worked examples.', price: 37.99, compareAtPrice: 44.99, stock: 190 },
    { name: 'The Phoenix Project', description: 'A novel about IT, DevOps, and helping your business win.', price: 18.99, stock: 450 },
  ],
  'home-kitchen': [
    { name: 'Stainless Steel French Press', description: '1L double-wall insulated French press, keeps coffee hot for 4h.', price: 39.99, stock: 200, isFeatured: true },
    { name: 'Cast Iron Skillet 26cm', description: 'Pre-seasoned cast iron pan, oven-safe to 260°C, induction compatible.', price: 49.99, compareAtPrice: 64.99, stock: 150 },
    { name: 'Bamboo Cutting Board Set (3pc)', description: 'Eco-friendly bamboo boards in 3 sizes with juice groove and handle.', price: 29.99, stock: 300 },
    { name: 'Programmable Coffee Maker', description: '12-cup programmable drip coffee machine with thermal carafe and auto keep-warm.', price: 79.99, compareAtPrice: 99.99, stock: 100 },
    { name: 'Knife Set 8-piece', description: 'High-carbon German steel knives with ergonomic handles and wooden block.', price: 119.99, stock: 80, isFeatured: true },
    { name: 'Vacuum Food Storage Set (10pc)', description: 'BPA-free containers with vacuum pump lid, microwave and freezer safe.', price: 34.99, stock: 250 },
    { name: 'Ceramic Non-Stick Pan 28cm', description: 'PFAS-free ceramic coating, induction ready, dishwasher safe.', price: 44.99, compareAtPrice: 59.99, stock: 175 },
    { name: 'Smart Kitchen Scale', description: 'Bluetooth kitchen scale with nutritional tracking app, 5kg max, 1g precision.', price: 29.99, stock: 300 },
    { name: 'Stainless Steel Water Bottle 750ml', description: 'Triple-insulated, leakproof lid, keeps drinks cold 24h / hot 12h.', price: 24.99, stock: 500 },
    { name: 'Herb Garden Starter Kit', description: 'Self-watering planter kit with basil, mint, parsley and rosemary seeds.', price: 19.99, stock: 400 },
  ],
  sports: [
    { name: 'Yoga Mat Premium 6mm', description: 'Non-slip TPE yoga mat with alignment lines, carrying strap included.', price: 39.99, compareAtPrice: 54.99, stock: 300, isFeatured: true },
    { name: 'Adjustable Dumbbell Set (2×20kg)', description: 'Quick-lock dial system, 15 weight settings from 2–20 kg per dumbbell.', price: 189.99, compareAtPrice: 239.99, stock: 60, isFeatured: true },
    { name: 'Foam Roller Deep Tissue', description: 'High-density EPP foam roller 90cm, grid texture for trigger point release.', price: 24.99, stock: 400 },
    { name: 'Resistance Bands Set (5 levels)', description: 'Latex-free fabric resistance bands for strength training and mobility.', price: 19.99, stock: 500 },
    { name: 'Running Hydration Vest 5L', description: 'Lightweight trail running vest, two 500ml soft flasks included.', price: 69.99, compareAtPrice: 89.99, stock: 120 },
    { name: 'Cycling Helmet MIPS', description: 'MIPS-equipped road cycling helmet, 18 vents, adjustable fit dial.', price: 89.99, stock: 90 },
    { name: 'Jump Rope Speed Cable', description: 'Ball-bearing speed rope, adjustable cable, ergonomic foam handles.', price: 14.99, stock: 600 },
    { name: 'Pull-Up Bar Doorframe', description: 'No-drill doorframe pull-up bar, 150kg capacity, foam grip handles.', price: 34.99, compareAtPrice: 44.99, stock: 200 },
    { name: 'Whey Protein Powder 1kg', description: 'Grass-fed whey isolate, 25g protein per serving, chocolate flavour.', price: 44.99, stock: 350 },
    { name: 'Gym Bag 40L', description: 'Durable polyester gym bag with wet compartment and shoe pocket.', price: 39.99, stock: 250 },
  ],
};

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CLOTHING_COLORS = ['Black', 'White', 'Navy', 'Grey'];

// ─── Seed Function ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (order matters for FK constraints)
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Existing data cleared');

  // ── Create Users ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', BCRYPT_ROUNDS);

  const [adminUser, regularUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'ShopVault',
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        role: Role.USER,
      },
    }),
  ]);

  console.log('✅ Users created:', adminUser.email, regularUser.email);

  // Create carts for users
  await Promise.all([
    prisma.cart.create({ data: { userId: adminUser.id } }),
    prisma.cart.create({ data: { userId: regularUser.id } }),
  ]);

  // ── Create Categories ─────────────────────────────────────────────────────
  const categories = await Promise.all(
    CATEGORIES.map((cat) => prisma.category.create({ data: cat }))
  );

  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c]));
  console.log('✅ Categories created:', categories.map((c) => c.name).join(', '));

  // ── Create Products ───────────────────────────────────────────────────────
  const createdProducts: any[] = [];

  for (const [categorySlug, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const category = categoryMap[categorySlug];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const seed = Math.floor(Math.random() * 100);
      const imageSeed2 = Math.floor(Math.random() * 100) + 100;

      const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}-${i}`;

      const product = await prisma.product.create({
        data: {
          name: p.name,
          slug,
          description: p.description,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          stock: p.stock,
          categoryId: category.id,
          isFeatured: p.isFeatured ?? false,
          images: [
            `https://picsum.photos/seed/${seed}/600/600`,
            `https://picsum.photos/seed/${imageSeed2}/600/600`,
          ],
        },
      });

      // Add variants for clothing products
      if (categorySlug === 'clothing') {
        await Promise.all(
          CLOTHING_SIZES.slice(0, 4).map((size, idx) =>
            prisma.productVariant.create({
              data: {
                productId: product.id,
                sku: `SKU-${categorySlug.toUpperCase().slice(0, 4)}-${i.toString().padStart(3, '0')}-${idx}-${size}`,
                options: { size, color: CLOTHING_COLORS[idx % CLOTHING_COLORS.length] },
                price: p.price + (size === 'XL' || size === 'XXL' ? 5 : 0),
                stock: Math.floor(p.stock / 4),
              },
            })
          )
        );
      }

      createdProducts.push(product);
    }
  }

  console.log(`✅ ${createdProducts.length} products created`);

  // ── Create Reviews ────────────────────────────────────────────────────────
  const reviewComments = [
    'Excellent product, highly recommended!',
    'Great quality for the price.',
    'Fast shipping, product as described.',
    'Very happy with my purchase.',
    'Good but could be better packaged.',
    'Works perfectly, solid build quality.',
    'Five stars without hesitation.',
    'Meets all my expectations.',
    'Will definitely buy again.',
    'Superb quality, very satisfied.',
    'Average product, nothing special.',
    'Better than expected!',
    'Good value for money.',
    'Arrived quickly, well packaged.',
    'Exactly what I needed.',
    'Impressive quality for this price point.',
    'The product works as advertised.',
    'Solid purchase overall.',
    'Good but not exceptional.',
    'Would recommend to friends.',
  ];

  const reviewsToCreate = 20;
  const usedPairs = new Set<string>();

  for (let i = 0; i < reviewsToCreate; i++) {
    const product = createdProducts[i % createdProducts.length];
    const user = i % 3 === 0 ? adminUser : regularUser;
    const pairKey = `${user.id}-${product.id}`;

    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars mostly

    await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating,
        comment: reviewComments[i % reviewComments.length],
      },
    });

    // Update product average rating
    const stats = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
        reviewCount: stats._count.rating,
      },
    });
  }

  console.log('✅ 20 reviews created');

  // ── Add sample address for regular user ──────────────────────────────────
  await prisma.address.create({
    data: {
      userId: regularUser.id,
      label: 'Home',
      firstName: 'Jane',
      lastName: 'Doe',
      line1: '12 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      isDefault: true,
    },
  });

  console.log('✅ Sample address created');
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('─────────────────────────────────────');
  console.log('  Admin: admin@example.com / Password123!');
  console.log('  User:  user@example.com  / Password123!');
  console.log('─────────────────────────────────────');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
