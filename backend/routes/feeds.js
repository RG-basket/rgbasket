const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * Escapes special characters for XML
 */
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * GET /api/feeds/google
 * Generates Google Merchant Center Product Feed (XML)
 */
router.get('/google', async (req, res) => {
    try {
        const products = await Product.find({ active: true });
        const baseUrl = process.env.CLIENT_URL || 'https://rgbasket.com';

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>RG Basket Products</title>
    <link>${baseUrl}</link>
    <description>Fresh groceries and daily essentials from RG Basket</description>`;

        products.forEach(product => {
            // Pick the first weight as the primary variant
            const defaultVariant = product.weights && product.weights.length > 0
                ? product.weights[0]
                : null;

            if (!defaultVariant) return;

            const title = escapeXml(product.name);
            const description = escapeXml(Array.isArray(product.description) ? product.description.join(' ') : product.description);
            const link = `${baseUrl}/product/${product._id}`;
            const imageLink = product.images && product.images.length > 0 ? product.images[0] : '';
            const price = `${defaultVariant.offerPrice || defaultVariant.price} INR`;
            const availability = product.inStock ? 'in_stock' : 'out_of_stock';
            const sku = product.sku || product._id;
            const category = escapeXml(product.category);

            xml += `
    <item>
      <g:id>${sku}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>RG Basket</g:brand>
      <g:google_product_category>${category}</g:google_product_category>
    </item>`;
        });

        xml += `
  </channel>
</rss>`;

        res.header('Content-Type', 'application/rss+xml');
        res.send(xml);
    } catch (error) {
        console.error('Error generating Google Feed:', error);
        res.status(500).send('Error generating feed');
    }
});

module.exports = router;
