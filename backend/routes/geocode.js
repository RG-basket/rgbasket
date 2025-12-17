const express = require('express');
const https = require('https');
const router = express.Router();

// GET /api/geocode/reverse - Reverse geocode coordinates to address
router.get('/reverse', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        // Validate coordinates
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Coordinates out of range'
            });
        }

        const makeRequest = (url) => {
            return new Promise((resolve, reject) => {
                const options = {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'Mozilla/5.0 (compatible; RG-Basket-App/1.0; +https://rgbasket.onrender.com)',
                        'Referer': 'https://rgbasket.onrender.com'
                    },
                    family: 4, // <--- CRITICAL: Force IPv4 to avoid ENETUNREACH on Render
                    timeout: 5000
                };

                const req = https.get(url, options, (response) => {
                    let data = '';

                    response.on('data', (chunk) => {
                        data += chunk;
                    });

                    response.on('end', () => {
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            try {
                                resolve(JSON.parse(data));
                            } catch (e) {
                                reject(new Error('Failed to parse response'));
                            }
                        } else {
                            reject(new Error(`API Error: ${response.statusCode} ${response.statusMessage}`));
                        }
                    });
                });

                req.on('error', (err) => {
                    reject(err);
                });

                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });
            });
        };

        // Strategy: Try Nominatim first, fail gracefully?
        // Note: BigDataCloud free API doesn't require key for client side, but server side might be limited.
        // Let's stick to Nominatim with IPv4 forced first. 

        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

        try {
            const data = await makeRequest(nominatimUrl);

            // Extract relevant address information
            const address = data.address || {};
            const locationData = {
                area: address.suburb || address.neighbourhood || address.hamlet || '',
                district: address.county || address.state_district || '',
                state: address.state || '',
                pincode: address.postcode || '',
                fullAddress: data.display_name || '',
                raw: data
            };

            return res.json({
                success: true,
                location: locationData
            });

        } catch (nominatimError) {
            console.error('Nominatim failed, trying fallback source...', nominatimError.message);

            // Fallback: Using a different public OSM instance (Geocode.maps.co)
            // Note: This is a backup free tier
            const fallbackUrl = `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`;

            try {
                const fallbackData = await makeRequest(fallbackUrl);

                const addr = fallbackData.address || {};
                const locationData = {
                    area: addr.suburb || addr.neighbourhood || '',
                    district: addr.county || '',
                    state: addr.state || '',
                    pincode: addr.postcode || '',
                    fullAddress: fallbackData.display_name || '',
                    raw: fallbackData
                };

                return res.json({
                    success: true,
                    location: locationData,
                    source: 'fallback'
                });
            } catch (fallbackError) {
                console.error('Fallback failed too:', fallbackError.message);
                throw new Error('All geocoding services failed');
            }
        }

    } catch (error) {
        console.error('Geocoding final error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to geocode location',
            error: error.message
        });
    }
});

module.exports = router;
