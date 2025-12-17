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

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ success: false, message: 'Invalid coordinates' });
        }

        // Generic Helper for HTTPS requests
        const makeRequest = (url) => {
            return new Promise((resolve, reject) => {
                const options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; RG-Basket-App/1.0)',
                        'Referer': 'https://rgbasket.onrender.com'
                    },
                    family: 4, // Force IPv4 to avoid ENETUNREACH
                    timeout: 5000
                };

                const req = https.get(url, options, (response) => {
                    let data = '';
                    response.on('data', (chunk) => data += chunk);
                    response.on('end', () => {
                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            try {
                                resolve(JSON.parse(data));
                            } catch (e) {
                                reject(new Error('Failed to parse response'));
                            }
                        } else {
                            reject(new Error(`API Error: ${response.statusCode}`));
                        }
                    });
                });

                req.on('error', (err) => reject(err));
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });
            });
        };

        // --- SOURCE 1: BigDataCloud (Reliable, no blocks) ---
        try {
            const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
            const data = await makeRequest(bdcUrl);

            if (data.postcode) {
                // If we got a pincode, this is a WIN
                return res.json({
                    success: true,
                    location: {
                        area: data.locality || '',
                        district: data.city || data.principalSubdivision || '',
                        state: data.principalSubdivision || '',
                        pincode: data.postcode, // We have it!
                        fullAddress: `${data.locality ? data.locality + ', ' : ''}${data.city ? data.city + ', ' : ''}${data.principalSubdivision || ''}, ${data.countryName || ''}`,
                        raw: data
                    },
                    source: 'bigdatacloud'
                });
            }
            console.log('BigDataCloud success but missing pincode. Trying next source...');
        } catch (e) {
            console.error('BigDataCloud failed:', e.message);
        }

        // --- SOURCE 2: Photon / Komoot (OSM data, usually not blocked) ---
        try {
            const photonUrl = `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`;
            const data = await makeRequest(photonUrl);

            if (data.features && data.features.length > 0) {
                const props = data.features[0].properties;

                // Construct location object
                const locationData = {
                    area: props.district || props.city || props.name || '',
                    district: props.county || props.city || '',
                    state: props.state || '',
                    pincode: props.postcode || '', // Photon usually has this!
                    fullAddress: `${props.name || ''}, ${props.city || ''}, ${props.state || ''}, ${props.postcode || ''}`,
                    raw: data
                };

                // If Photon gave us a pincode, return perfectly
                if (locationData.pincode) {
                    return res.json({
                        success: true,
                        location: locationData,
                        source: 'photon'
                    });
                }
            }
            console.log('Photon success but missing pincode. Trying next source...');
        } catch (e) {
            console.error('Photon failed:', e.message);
        }

        // --- SOURCE 3: Nominatim (Original, blocked often, but last resort) ---
        try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
            const data = await makeRequest(nominatimUrl);
            const address = data.address || {};

            return res.json({
                success: true,
                location: {
                    area: address.suburb || address.neighbourhood || '',
                    district: address.county || address.state_district || '',
                    state: address.state || '',
                    pincode: address.postcode || '',
                    fullAddress: data.display_name || '',
                    raw: data
                },
                source: 'nominatim'
            });
        } catch (e) {
            console.error('Nominatim failed:', e.message);

            // If ALL failed, return whatever partial data we might have had? 
            // Better to fail so frontend knows.
            throw new Error('All geocoding services failed or returned incomplete data');
        }

    } catch (error) {
        console.error('Final Geocode Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to geocode location',
            error: error.message
        });
    }
});

module.exports = router;
