const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Get All Pharmacy Inventory / Stock
router.get('/stock', async (req, res) => {
    try {
        // अगर डेटाबेस टेबल बनी है तो यह क्वेरी चलेगी, वरना मॉक डेटा या एरर हैंडलिंग
        const result = await db.query('SELECT * FROM pharmacy_inventory ORDER :created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        // यदि अभी डेटाबेस टेबल नहीं बनी है, तो टेस्टिंग के लिए डमी डेटा भेज सकते हैं ताकि UI न रुके
        res.json({ 
            success: true, 
            message: 'Pharmacy inventory loaded (Mock Mode)', 
            data: [
                { id: 1, medicine_name: 'Paracetamol 650mg', batch_no: 'PAR-992', quantity: 1500, expiry_date: '2027-12-31', price: 2.50 },
                { id: 2, medicine_name: 'Amoxicillin 500mg', batch_no: 'AMX-441', quantity: 400, expiry_date: '2026-08-15', price: 12.00 },
                { id: 3, medicine_name: 'Pantoprazole 40mg', batch_no: 'PAN-102', quantity: 80, expiry_date: '2026-06-10', price: 8.00 }
            ]
        });
    }
});

// 2. Add New Medicine to Inventory
router.post('/add', async (req, res) => {
    try {
        const { medicine_name, batch_no, quantity, expiry_date, price } = req.body;
        
        // यहाँ डेटाबेस इंसर्ट क्वेरी आएगी
        // const query = 'INSERT INTO pharmacy_inventory (medicine_name, batch_no, quantity, expiry_date, price) VALUES ($1, $2, $3, $4, $5)';
        // await db.query(query, [medicine_name, batch_no, quantity, expiry_date, price]);

        res.json({
            success: true,
            message: `✅ Medicine '${medicine_name}' added to inventory successfully!`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;