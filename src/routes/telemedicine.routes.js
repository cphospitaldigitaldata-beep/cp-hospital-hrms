const express = require('express');
const router = express.Router();

// 1. Get Video Consultation Appointments
router.get('/appointments', (req, res) => {
    res.json({
        success: true,
        message: 'Telemedicine appointments fetched successfully',
        appointments: [
            { id: 1, patient_name: 'Sunita Sharma', doctor: 'Dr. Alok Rastogi', time_slot: '10:30 AM', status: 'Scheduled' }
        ]
    });
});

// 2. Book Video Consultation & Generate e-Prescription
router.post('/book', (req, res) => {
    const { patient_name, doctor, symptoms } = req.body;
    res.json({
        success: true,
        message: `✅ Video consultation booked for ${patient_name} with ${doctor}!`,
        consultation_id: 'TEL-' + Math.floor(1000 + Math.random() * 9000)
    });
});

module.exports = router;