const express = require('express');
const router = express.Router();

// Temporary In-Memory Attendance Vault
let attendanceLogs = [];

// Hospital GPS Coordinates (Example Center Location & Radius in Meters)
const HOSPITAL_LOCATION = {
    latitude: 26.9124,  // Example Latitude (Jaipur/Delhi etc.)
    longitude: 75.7873, // Example Longitude
    allowed_radius_meters: 100 // Staff must be within 100 meters
};

/**
 * Helper function to calculate distance between two GPS coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * @route   POST /api/v1/attendance/punch
 * @desc    Geofenced Punch-In / Punch-Out for hospital staff
 * @access  Private
 */
router.post('/punch', (req, res) => {
    try {
        const { staff_id, staff_name, latitude, longitude, punch_type } = req.body;

        if (!staff_id || !latitude || !longitude || !punch_type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields (staff_id, latitude, longitude, punch_type).'
            });
        }

        // Calculate distance from hospital premises
        const distance = calculateDistance(
            latitude,
            longitude,
            HOSPITAL_LOCATION.latitude,
            HOSPITAL_LOCATION.longitude
        );

        // Check geofence boundary
        if (distance > HOSPITAL_LOCATION.allowed_radius_meters) {
            return res.status(403).json({
                success: false,
                error: `Geofence restriction: You are ${Math.round(distance)}m away from CP Hospital. Punch-in allowed only within ${HOSPITAL_LOCATION.allowed_radius_meters}m.`
            });
        }

        const logEntry = {
            log_id: 'ATT-' + Date.now().toString().slice(-6),
            staff_id,
            staff_name: staff_name || 'Authorized Staff',
            punch_type, // 'IN' or 'OUT'
            timestamp: new Date(),
            location_coordinates: { latitude, longitude },
            distance_from_hospital: Math.round(distance) + ' meters',
            status: 'Verified & Recorded'
        };

        attendanceLogs.push(logEntry);

        return res.status(200).json({
            success: true,
            message: `Successfully punched ${punch_type} within hospital geofence bounds.`,
            data: logEntry
        });

    } catch (err) {
        console.error('Attendance Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error during attendance logging.'
        });
    }
});

/**
 * @route   GET /api/v1/attendance/logs
 * @desc    Fetch all attendance logs
 * @access  Private (Admin)
 */
router.get('/logs', (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            count: attendanceLogs.length,
            data: attendanceLogs
        });
    } catch (err) {
        console.error('Fetch Logs Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve attendance logs.'
        });
    }
});

module.exports = router;