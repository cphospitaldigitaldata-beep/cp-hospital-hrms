-- 1. Staff Table (HR Onboarding)
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    council_registration_no VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    pan_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Attendance Table (Geofenced Attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    punch_type VARCHAR(10) NOT NULL, -- IN / OUT
    status VARCHAR(20) DEFAULT 'On-Time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clinical EWS Table
CREATE TABLE IF NOT EXISTS ews_records (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Clinical Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Emergency SOS Table
CREATE TABLE IF NOT EXISTS emergencies (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    location_ward VARCHAR(100) NOT NULL,
    triggered_by VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Billing & Discharge Table
CREATE TABLE IF NOT EXISTS billings (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    discharge_notes TEXT,
    status VARCHAR(20) DEFAULT 'Cleared',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);