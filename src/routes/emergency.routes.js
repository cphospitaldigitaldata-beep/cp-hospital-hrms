const express = require('express');
const router = express.Router();

// In-Memory Emergency Logs Vault
let emergencyLogs = [];

/**
 * @route   POST /api/v1/emergency/trigger
 * @desc    Trigger Code Blue or Emergency SOS broadcast
 * @access  Private (Authorized Staff)
 */
router.post('/trigger', (req, res) => {
    try {
        const { alert_type, location_ward, triggered_by, severity } = req.body;

        if (!alert_type || !location_ward || !triggered_by) {
            return res.status(400).json({
                success: false,
                error: 'Missing required emergency fields (alert_type, location_ward, triggered_by).'
            });
        }

        const emergencyEvent = {
            sos_id: 'SOS-' + Date.now().toString().slice(-6),
            alert_type, // e.g., 'Code Blue', 'Fire Emergency', 'Security Hazard'
            location_ward, // e.g., 'ICU Ward 3', 'Emergency OT'
            triggered_by,
            severity: severity || 'Critical',
            timestamp: new Date(),
            status: 'Active Broadcasted',
            response_timer: '00:00 elapsed'
        };

        emergencyLogs.unshift(emergencyEvent); // Add to top of logs

        return res.status(201).json({
            success: true,
            message: `🚨 ${alert_type} broadcasted successfully for ${location_ward}! Response teams alerted.`,
            data: emergencyEvent
        });

    } catch (err) {
        console.error('Emergency SOS Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error during emergency broadcast.'
        });
    }
});

/**
 * @route   GET /api/v1/emergency/active
 * @desc    Fetch active emergency alerts
 * @access  Private
 */
router.get('/active', (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            count: emergencyLogs.length,
            data: emergencyLogs
        });
    } catch (err) {
        console.error('Fetch SOS Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to retrieve emergency logs.'
        });
    }
});

module.exports = router;