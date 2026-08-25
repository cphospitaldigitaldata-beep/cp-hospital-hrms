const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Middleware to record WORM Audit Logs automatically
function logAudit(actionType, targetEntity) {
  return async (req, res, next) => {
    // Capture original send to log after response is successful
    const originalJson = res.json.bind(res);

    res.json = async function (body) {
      try {
        const actorId = req.headers['x-actor-id'] || req.body?.actor_id || null;
        const targetId = req.params?.id || body?.data?.id || null;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        const metadata = { method: req.method, url: req.originalUrl, response_status: res.statusCode };

        const query = `
          INSERT INTO audit_logs (id, actor_id, action_type, target_entity, target_id, ip_address, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;

        const values = [uuidv4(), actorId, actionType, targetEntity, targetId, ipAddress, JSON.stringify(metadata)];
        await db.query(query, values);
      } catch (err) {
        console.error('CRITICAL: Failed to write WORM audit log:', err);
      }
      return originalJson(body);
    };

    next();
  };
}

// Fetch Audit Logs for Compliance Review (Read-Only)
async function getAuditLogs(req, res) {
  try {
    const query = `
      SELECT a.*, s.full_name as actor_name, s.designation as actor_designation 
      FROM audit_logs a
      LEFT JOIN staff s ON a.actor_id = s.id
      ORDER BY a.created_at DESC
      LIMIT 100;
    `;
    const result = await db.query(query);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve compliance audit logs.' });
  }
}

module.exports = { logAudit, getAuditLogs };