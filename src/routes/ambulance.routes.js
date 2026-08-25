const express = require('express');
const router = express.Router();

// 1. Get Live Ambulance Fleet Status
router.get('/fleet', (req, res) => {
    res.json({
        success: true,
        message: 'Ambulance fleet status fetched successfully',
        fleet: [
            { ambulance_no: 'RJ-14-EA-1008', driver_name: 'Ramesh Singh', phone: '9876543210', location: 'Sector 4, Main Hospital Gate', status: 'Available' },
            { ambulance_no: 'RJ-14-EA-2022', driver_name: 'Mukesh Sharma', phone: '9123456789', location: 'Highway Bypass Zone', status: 'Dispatched' },
            { ambulance_no: 'RJ-14-EA-3055', driver_name: 'Suresh Kumar', phone: '9988776655', location: 'Emergency Trauma Center', status: 'Available' }
        ]
    });
});

// 2. Dispatch Ambulance for Emergency SOS
router.post('/dispatch', (req, res) => {
    const { emergency_location, patient_condition, contact_number } = req.body;
    const assigned_ambulance = 'RJ-14-EA-1008';
    
    res.json({
        success: true,
        message: `🚨 Ambulance (${assigned_ambulance}) dispatched successfully to your location!`,
        dispatch_id: 'DSP-' + Math.floor(1000 + Math.random() * 9000)
    });
});

module.exports = router;