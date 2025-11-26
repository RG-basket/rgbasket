const express = require('express');
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

        // Make request to Nominatim API
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

        const response = await fetch(nominatimUrl, {
            headers: {
                'Accept-Language': 'en',
                'User-Agent': 'RG-Basket-App/1.0' // Required by Nominatim usage policy
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

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
        res.status(500).json({
            success: false,
            message: 'Failed to geocode location',
            error: error.message
        });
    }
});

module.exports = router;
