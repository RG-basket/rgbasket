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
 * Maps website categories to Google Product Categories
 */
function getGoogleCategory(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('meat') || cat.includes('chicken') || cat.includes('mutton') || cat.includes('fish')) {
        return 'Food, Beverages & Tobacco > Food Items > Meat, Seafood & Eggs > Meat';
    }
    if (cat.includes('vegetable') || cat.includes('fruit')) {
        return 'Food, Beverages & Tobacco > Food Items > Fruits & Vegetables';
    }
    if (cat.includes('dairy') || cat.includes('milk') || cat.includes('egg')) {
        return 'Food, Beverages & Tobacco > Food Items > Dairy Products';
    }
    if (cat.includes('grocery') || cat.includes('staple')) {
        return 'Food, Beverages & Tobacco > Food Items';
    }
    return 'Food, Beverages & Tobacco > Food Items'; // Default
}

/**
 * GET /api/feeds/google
 * Generates Google Merchant Center Product Feed (XML)
 */
router.get('/google', async (req, res) => {
    try {
        const products = await Product.find({ active: true });

        // CRITICAL: Ensure we don't send 'localhost' URLs to Google Merchant Center
        let baseUrl = process.env.CLIENT_URL;
        if (!baseUrl || baseUrl.includes('localhost')) {
            baseUrl = 'https://rgbasket.vercel.app'; // Your official production domain
        }
        // Remove trailing slash if present
        baseUrl = baseUrl.replace(/\/$/, '');

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>RG Basket Products</title>
    <link>${baseUrl}</link>
    <description>Fresh groceries and daily essentials from RG Basket</description>`;

        products.forEach(product => {
            // Process each weight variant as a separate item if they have different prices
            // or just the default variant. Google Shopping likes distinct items for variants.
            if (!product.weights || product.weights.length === 0) return;

            product.weights.forEach((variant, index) => {
                const title = escapeXml(`${product.name} (${variant.weight} ${variant.unit})`);
                const description = escapeXml(Array.isArray(product.description) ? product.description.join(' ') : product.description);
                const link = `${baseUrl}/product/${product._id}`;

                let imageLink = product.images && product.images.length > 0 ? product.images[0] : '';
                // Ensure image link is absolute (Google requires http/https)
                if (imageLink && !imageLink.startsWith('http')) {
                    imageLink = `${baseUrl}${imageLink.startsWith('/') ? '' : '/'}${imageLink}`;
                }

                const price = `${variant.price} INR`;
                const hasSale = variant.offerPrice && variant.offerPrice < variant.price;
                const salePrice = hasSale ? `${variant.offerPrice} INR` : '';

                const availability = (product.inStock && variant.inStock !== false && (variant.stock > 0 || product.stock > 0)) ? 'in_stock' : 'out_of_stock';
                const sku = `${product.sku || product._id}_${index}`;
                const googleCategory = getGoogleCategory(product.category);

                xml += `
    <item>
      <g:id>${sku}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>${hasSale ? `
      <g:sale_price>${salePrice}</g:sale_price>` : ''}
      <g:brand>RG Basket</g:brand>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 INR</g:price>
      </g:shipping>
    </item>`;
            });
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
