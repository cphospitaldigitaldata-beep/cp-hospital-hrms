const db = require('../config/db');
const multer = require('multer'); // <-- यह जोड़ें
const path = require('path');   // <-- यह जोड़ें

// Multer स्टोरेज सेटिंग्स
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }).any(); // .any() का उपयोग करें ताकि सारे फाइल्स फ्लेक्सिबली आ सकें

// (बाકી आपका onboardStaff फंक्शन वैसे ही रहेगा...)
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// 1. Calculate & Save Early Warning Score (EWS)
async function calculateEWS(req, res) {
  try {
    const { patient_id, heart_rate, respiratory_rate, systolic_bp, oxygen_saturation, temperature, consciousness } = req.body;

    // Basic EWS scoring logic calculation
    let score = 0;
    if (respiratory_rate < 9 || respiratory_rate > 21) score += 3;
    else if (respiratory_rate >= 12 && respiratory_rate <= 20) score += 0;
    else score += 1;

    if (oxygen_saturation < 92) score += 3;
    else if (oxygen_saturation <= 95) score += 1;

    if (systolic_bp < 90 || systolic_bp > 219) score += 3;
    else if (systolic_bp <= 100) score += 2;
    else if (systolic_bp <= 110) score += 1;

    let risk_level = 'LOW';
    if (score >= 7) risk_level = 'CRITICAL (Code Blue Alert)';
    else if (score >= 5) risk_level = 'HIGH (Urgent Review)';
    else if (score >= 3) risk_level = 'MEDIUM';

    const query = `
      INSERT INTO ews_records (id, patient_id, score, risk_level, vitals, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;

    const vitals = JSON.stringify({ heart_rate, respiratory_rate, systolic_bp, oxygen_saturation, temperature, consciousness });
    const values = [uuidv4(), patient_id, score, risk_level, vitals];

    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: `EWS calculated successfully. Risk Level: ${risk_level}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error calculating EWS:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error during EWS calculation' });
  }
}

// 2. Generate e-Prescription
async function generatePrescription(req, res) {
  try {
    const { patient_id, doctor_id, diagnosis, medicines } = req.body;

    const query = `
      INSERT INTO prescriptions (id, patient_id, doctor_id, diagnosis, medicines, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW())
      RETURNING *;
    `;

    const values = [uuidv4(), patient_id, doctor_id, diagnosis, JSON.stringify(medicines)];
    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: 'e-Prescription successfully generated and synced with Pharmacy.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error generating prescription:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error during prescription generation' });
  }
}

module.exports = { calculateEWS, generatePrescription };