-- Create Attendance Status ENUM
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'LATE', 'OVERTIME', 'ABSENT', 'HALF_DAY');

-- Create Attendance Logs Table with Geofencing Coordinates
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    punch_in_time TIMESTAMP WITH TIME ZONE,
    punch_out_time TIMESTAMP WITH TIME ZONE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_within_geofence BOOLEAN DEFAULT FALSE,
    status attendance_status DEFAULT 'PRESENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Shift Rosters Table
CREATE TABLE IF NOT EXISTS shift_rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL, -- e.g., 'MORNING', 'EVENING', 'NIGHT', 'EMERGENCY_ON_CALL'
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_roster_date ON shift_rosters(shift_date);