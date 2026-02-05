const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * GET /sitemap.xml
 * Generates a dynamic sitemap for Google Search Console
 */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    let baseUrl = process.env.CLIENT_URL;
    if (!baseUrl || baseUrl.includes('localhost')) {
      baseUrl = 'https://rgbasket.vercel.app';
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    products.forEach(product => {
      xml += `
  <url>
    <loc>${baseUrl}/product/${product._id}</loc>
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
