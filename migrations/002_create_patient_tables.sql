-- Create Patient Acuity ENUM
CREATE TYPE acuity_score_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- Create Admission Status ENUM
CREATE TYPE admission_status AS ENUM ('ADMITTED', 'DISCHARGED', 'ICU', 'EMERGENCY', 'TRANSFERRED');

-- Create Patients Master Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20),
    admission_status admission_status DEFAULT 'ADMITTED',
    bed_number VARCHAR(20) NOT NULL,
    acuity_score acuity_score_level DEFAULT 'MODERATE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Clinical EHR / SOAP Notes Table
CREATE TABLE IF NOT EXISTS clinical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES staff(id),
    soap_subjective TEXT, -- Patient complaints & symptoms
    soap_objective TEXT,  -- Vitals, lab results, measurements
    soap_assessment TEXT, -- Diagnosis
    soap_plan TEXT,       -- Treatment plan & instructions
    prescriptions JSONB DEFAULT '[]'::jsonb, -- Array of medicines, dosage, frequency
    surgical_checklist_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_clinical_patient_id ON clinical_records(patient_id);