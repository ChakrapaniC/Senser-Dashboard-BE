import pool from '../config/db.js';

export const getAlerts = async (queryParams) => {
  const { severity, deviceId, acknowledged, limit = 50 } = queryParams;
  
  let query = `
    SELECT a.*, d.device_id, d.name AS device_name
    FROM alerts a
    JOIN devices d ON a.device_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (severity) {
    query += ' AND a.severity = ?';
    params.push(severity);
  }

  if (deviceId) {
    query += ' AND d.device_id = ?';
    params.push(deviceId);
  }

  if (acknowledged !== undefined) {
    query += ' AND a.acknowledged = ?';
    params.push(acknowledged === 'true' ? 1 : 0);
  }

  query += ' ORDER BY a.ts DESC LIMIT ?';
  params.push(parseInt(limit));

  const [alerts] = await pool.query(query, params);
  return alerts;
};

export const ackAllAlerts = async (username) => {
  const [result] = await pool.query(
    `UPDATE alerts
     SET acknowledged = TRUE,
         acknowledged_by = ?,
         acknowledged_at = NOW()
     WHERE acknowledged = FALSE`,
    [username]
  );

  return result;
};

export const ackAlertById = async (alertId, username) => {
  const [result] = await pool.query(
    `UPDATE alerts
     SET acknowledged = TRUE,
         acknowledged_by = ?,
         acknowledged_at = NOW()
     WHERE id = ?`,
    [username, alertId]
  );

  return result;
};