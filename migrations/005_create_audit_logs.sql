-- Create Immutable WORM Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES staff(id),
    action_type VARCHAR(100) NOT NULL, -- e.g., 'STAFF_ONBOARDED', 'PATIENT_RECORD_UPDATED', 'EMERGENCY_TRIGGERED'
    target_entity VARCHAR(100) NOT NULL, -- e.g., 'staff', 'patients', 'clinical_records'
    target_id UUID,
    ip_address VARCHAR(45),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast audit tracking and security reviews
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- Security Rule: Prevent UPDATE or DELETE on audit_logs table (WORM Enforcement)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Alert: WORM compliance violation. Audit logs are immutable and cannot be updated or deleted.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_audit_worm
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();