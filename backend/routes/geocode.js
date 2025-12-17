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
                    family: 4, // Force IPv4 to avoid ENETUNREACH on cloud platforms
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

        // Strategy: Use BigDataCloud's FREE Client API as PRIMARY
        // It is much more lenient with cloud IPs (Render) and doesn't require an API key.
        const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

        try {
            const data = await makeRequest(bdcUrl);

            // Map BigDataCloud response to our schema
            const locationData = {
                area: data.locality || '',
                district: data.city || data.principalSubdivision || '',
                state: data.principalSubdivision || '',
                pincode: data.postcode || '',
                fullAddress: `${data.locality ? data.locality + ', ' : ''}${data.city ? data.city + ', ' : ''}${data.principalSubdivision || ''}, ${data.countryName || ''}`,
                raw: data
            };

            // Enhance with administrative data if available
            if (data.localityInfo && data.localityInfo.administrative) {
                const admin = data.localityInfo.administrative;
                const district = admin.find(a => a.order === 6 || a.order === 7)?.name;
                const state = admin.find(a => a.order === 4)?.name;

                if (district) locationData.district = district;
                if (state) locationData.state = state;
            }

            return res.json({
                success: true,
                location: locationData,
                source: 'bigdatacloud'
            });

        } catch (bdcError) {
            console.error('BigDataCloud failed, trying Nominatim fallback...', bdcError.message);

            // FALLBACK: Nominatim (might be blocked, but worth a try)
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

            try {
                const osmData = await makeRequest(nominatimUrl);
                const address = osmData.address || {};

                return res.json({
                    success: true,
                    location: {
                        area: address.suburb || address.neighbourhood || '',
                        district: address.county || '',
                        state: address.state || '',
                        pincode: address.postcode || '',
                        fullAddress: osmData.display_name || '',
                        raw: osmData
                    },
                    source: 'nominatim'
                });
            } catch (finalError) {
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
