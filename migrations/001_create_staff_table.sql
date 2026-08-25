-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Designation ENUM Type
CREATE TYPE staff_designation AS ENUM (
    'DOCTOR', 
    'NURSE', 
    'PHARMACY', 
    'BIOMEDICAL', 
    'ADMIN', 
    'SUPPORT'
);

-- Create Staff Status ENUM Type
CREATE TYPE staff_status AS ENUM (
    'ACTIVE', 
    'SUSPENDED', 
    'TERMINATED', 
    'PENDING_VERIFICATION'
);

-- Create Staff Master Table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    designation staff_designation NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores license numbers, insurance expiry, document S3 URLs, etc.
    status staff_status DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Index for Faster Employee Code & Email Lookups
CREATE INDEX IF NOT EXISTS idx_staff_employee_code ON staff(employee_code);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- Trigger function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_modtime
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();