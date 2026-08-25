const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../hospital.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database opening error: ', err.message);
    } else {
        console.log('📦 Connected to SQLite Database successfully!');
    }
});

db.run(`CREATE TABLE IF NOT EXISTS staff_directory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT,
    full_name TEXT,
    designation TEXT,
    department TEXT,
    email TEXT,
    phone TEXT,
    pan TEXT,
    council_reg TEXT,
    bank_details TEXT,
    
    -- अलग-अलग डॉक्यूमेंट्स के पाथ (File Paths)
    rmc_nc_cert_path TEXT,          -- RMC / RNC / Pharmacy Council Certificate
    degree_diploma_path TEXT,       -- UG / PG Degree or Diploma
    experience_cert_path TEXT,      -- Experience Certificate
    photo_id_path TEXT,             -- Photo ID (Voter ID / Aadhar / Passport)
    pan_photo_path TEXT,            -- PAN Card / Signature Photo
    bank_proof_path TEXT,           -- Passbook or Cancelled Cheque
    
    metadata TEXT,
    status TEXT,
    appointment_letter_path TEXT
)`);

module.exports = db;