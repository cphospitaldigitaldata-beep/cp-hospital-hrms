const express = require('express');
const router = express.Router();
const db = require('../config/db'); // आपके डेटाबेस का पाथ (सही पाथ जांच लें)

// 1. Get Live OPD Queue (डेटाबेस से लाइव क्यू लाना)
router.get('/queue', (req, res) => {
    db.all(`SELECT * FROM opd_tokens`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({
            success: true,
            message: 'OPD Queue fetched successfully from Database',
            queue: rows
        });
    });
}); // <--- यहाँ ब्रैकेट बंद होना जरूरी था!

// 2. Add New OPD Token Registration (डेटाबेस में नया टोकन सेव करना)
router.post('/register', (req, res) => {
    const { patient_name, doctor, department } = req.body;
    const token_no = Math.floor(100 + Math.random() * 900);
    const status = 'Waiting';

    const sql = `INSERT INTO opd_tokens (token_no, patient_name, doctor, department, status) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [token_no, patient_name, doctor, department, status], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        
        res.json({
            success: true,
            message: `✅ Token generated successfully for ${patient_name}!`,
            token_no: token_no
        });
    });
});

module.exports = router;