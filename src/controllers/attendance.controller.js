const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Hospital GPS Coordinates & Allowed Radius (e.g., CP Hospital premises)
const HOSPITAL_LAT = 28.6139; // Example Latitude (Delhi)
const HOSPITAL_LNG = 77.2090; // Example Longitude (Delhi)
const ALLOWED_RADIUS_METERS = 300; // 300 meters geofence perimeter

// Haversine formula to calculate distance in meters between two lat/long points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Punch In with Geofencing Check
async function punchIn(req, res) {
  try {
    const { employee_id, latitude, longitude } = req.body;

    // Validate Geofence Perimeter
    const distance = calculateDistance(latitude, longitude, HOSPITAL_LAT, HOSPITAL_LNG);
    const isWithinGeofence = distance <= ALLOWED_RADIUS_METERS;

    if (!isWithinGeofence) {
      return res.status(400).json({
        success: false,
        error: `Geofence Violation: You are outside CP Hospital premises (${Math.round(distance)}m away). Punch-in rejected.`
      });
    }

    const query = `
      INSERT INTO attendance_logs (id, employee_id, punch_in_time, latitude, longitude, is_within_geofence, status)
      VALUES ($1, $2, NOW(), $3, $4, TRUE, 'PRESENT')
      RETURNING *;
    `;

    const values = [uuidv4(), employee_id, latitude, longitude];
    const result = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Geofenced punch-in recorded successfully.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error during punch-in:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error / Attendance system failure.' });
  }
}

// Punch Out
async function punchOut(req, res) {
  try {
    const { attendance_id } = req.params;

    const query = `
      UPDATE attendance_logs 
      SET punch_out_time = NOW()
      WHERE id = $1
      RETURNING *;
    `;

    const result = await db.query(query, [attendance_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attendance log not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Punch-out recorded successfully.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error during punch-out:', error);
    res.status(500).json({ success: false, error: 'Failed to record punch-out.' });
  }
}

module.exports = { punchIn, punchOut };