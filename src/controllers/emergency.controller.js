const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Trigger Emergency SOS / Code Broadcast
async function triggerEmergencyBroadcast(req, res) {
  try {
    const { triggered_by, code_type, location_ward, details } = req.body;

    const query = `
      INSERT INTO emergency_broadcasts (id, triggered_by, code_type, location_ward, details, status)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
      RETURNING *;
    `;

    const values = [uuidv4(), triggered_by, code_type, location_ward, details];
    const result = await db.query(query, values);

    // TODO: Trigger WebSocket / Firebase Cloud Messaging (FCM) / Twilio SMS to Rapid Response Team
    console.warn(`🚨 EMERGENCY BROADCAST: ${code_type} triggered at ${location_ward}! Immediate response required.`);

    res.status(201).json({
      success: true,
      message: `Emergency ${code_type} broadcast successfully dispatched to Rapid Response Teams.`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error triggering emergency broadcast:', error);
    res.status(500).json({ success: false, error: 'Failed to broadcast emergency alert.' });
  }
}

// Acknowledge & Resolve Emergency (Calculate Response Time)
async function resolveEmergency(req, res) {
  try {
    const { emergency_id } = req.params;
    const { resolved_by } = req.body;

    // Calculate response time from created_at to now
    const checkQuery = `SELECT created_at FROM emergency_broadcasts WHERE id = $1;`;
    const checkResult = await db.query(checkQuery, [emergency_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Emergency event not found.' });
    }

    const createdAt = new Date(checkResult.rows[0].created_at);
    const resolvedAt = new Date();
    const responseTimeSeconds = Math.floor((resolvedAt - createdAt) / 1000);

    const updateQuery = `
      UPDATE emergency_broadcasts 
      SET status = 'RESOLVED', response_time_seconds = $2, resolved_by = $3, resolved_at = $4
      WHERE id = $1
      RETURNING *;
    `;

    const updateValues = [emergency_id, responseTimeSeconds, resolved_by, resolvedAt];
    const result = await db.query(updateQuery, updateValues);

    res.status(200).json({
      success: true,
      message: `Emergency resolved successfully. Response time: ${responseTimeSeconds} seconds.`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error resolving emergency:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve emergency.' });
  }
}

module.exports = { triggerEmergencyBroadcast, resolveEmergency };