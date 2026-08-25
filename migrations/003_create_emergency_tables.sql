-- Create Emergency Code Type ENUM
CREATE TYPE emergency_code_type AS ENUM ('CODE_BLUE', 'CODE_RED', 'CODE_PINK', 'CODE_TRAUMA', 'GENERAL_SOS');

-- Create Emergency Status ENUM
CREATE TYPE emergency_status AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- Create Emergency Broadcasts Table
CREATE TABLE IF NOT EXISTS emergency_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    triggered_by UUID REFERENCES staff(id),
    code_type emergency_code_type NOT NULL,
    location_ward VARCHAR(150) NOT NULL,
    details TEXT,
    status emergency_status DEFAULT 'ACTIVE',
    response_time_seconds INT, -- Track response duration for NABH compliance
    resolved_by UUID REFERENCES staff(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Index for real-time tracking
CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_broadcasts(status);