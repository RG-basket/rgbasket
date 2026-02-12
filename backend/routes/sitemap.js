const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * GET /sitemap.xml
 * Generates a dynamic sitemap for Google Search Console
 */
router.get('/', async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ active: true }),
      Category.find()
    ]);

    let baseUrl = process.env.CLIENT_URL;
    if (!baseUrl || baseUrl.includes('localhost')) {
      baseUrl = 'https://rgbasket.vercel.app';
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products/all</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact-us</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    // Add Categories
    categories.forEach(cat => {
      const slug = cat.name.toLowerCase().replace(/\s+/g, '-');
      xml += `
  <url>
    <loc>${baseUrl}/products/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add Products
    products.forEach(product => {
      const category = product.category ? product.category.toLowerCase().replace(/\s+/g, '-') : 'all';
      xml += `
  <url>
    <loc>${baseUrl}/products/${category}/${product._id}</loc>
    <lastmod>${new Date(product.updatedAt || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating Sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
