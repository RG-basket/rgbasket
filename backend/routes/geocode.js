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

        // Make request to Nominatim API using https module
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

        // Helper function to make HTTPS request
        const makeRequest = (url) => {
            return new Promise((resolve, reject) => {
                const options = {
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': 'RG-Basket-App/1.0', // Required by Nominatim usage policy
                        'Referer': 'https://rgbasket.onrender.com' // Good practice
                    }
                };

                https.get(url, options, (response) => {
                    let data = '';

                    // A chunk of data has been received
                    response.on('data', (chunk) => {
                        data += chunk;
                    });

                    // The whole response has been received
                    response.on('end', () => {
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            try {
                                resolve(JSON.parse(data));
                            } catch (e) {
                                reject(new Error('Failed to parse response'));
                            }
                        } else {
                            // Handle non-200 responses (like 403 or 503) without crashing
                            reject(new Error(`Nominatim API error: ${response.statusCode} ${response.statusMessage}`));
                        }
                    });
                }).on('error', (err) => {
                    reject(err);
                });
            });
        };

        const data = await makeRequest(nominatimUrl);

        // Extract relevant address information
        const address = data.address || {};
        const locationData = {
            area: address.suburb || address.neighbourhood || address.hamlet || '',
            district: address.county || address.state_district || '',
            state: address.state || '',
            pincode: address.postcode || '',
            fullAddress: data.display_name || '',
            raw: data // Include raw data for debugging if needed
        };

        res.json({
            success: true,
            location: locationData
        });

    } catch (error) {
        console.error('Geocoding error:', error);
        // Fallback or friendly error
        res.status(500).json({
            success: false,
            message: 'Failed to geocode location',
            error: error.message
        });
    }
});

module.exports = router;
