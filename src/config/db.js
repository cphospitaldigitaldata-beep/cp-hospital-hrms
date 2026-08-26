const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err) => {
    if (err) {
        console.error('❌ Database connection error: ', err.message);
    } else {
        console.log('📦 Connected to PostgreSQL Database successfully!');
    }
});

// Create tables if they don't exist
pool.query(`CREATE TABLE IF NOT EXISTS staff_directory (
    id SERIAL PRIMARY KEY,
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
    photo_id_path TEXT,             -- Photo ID
    pan_photo_path TEXT,            -- PAN Card / Signature Photo
    bank_proof_path TEXT,           -- Passbook or Cancelled Cheque
    
    metadata TEXT,
    status TEXT,
    appointment_letter_path TEXT
)`, (err) => {
    if (err) {
        console.error('❌ Error creating table:', err.message);
    } else {
        console.log('📋 staff_directory table ready!');
    }
});

module.exports = pool;