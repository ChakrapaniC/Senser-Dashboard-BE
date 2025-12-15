import pool from '../config/db.js';

export const getDevices = async (queryParams) => {
  const { status, tag, q, limit = 100, offset = 0 } = queryParams;

  let query = 'SELECT * FROM devices WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }

  if (q) {
    query += ' AND (device_id LIKE ? OR name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  query += ' ORDER BY device_id LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const [devices] = await pool.query(query, params);

  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status != 'OFFLINE' THEN 1 ELSE 0 END) as online,
      SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) as offline
    FROM devices
  `);

  const [alertCount] = await pool.query(`
    SELECT COUNT(*) as count 
    FROM alerts 
    WHERE acknowledged = FALSE 
    AND ts >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `);

  return {
    devices,
    stats: stats[0],
    activeAlerts: alertCount[0].count
  };
};

export const getDeviceById = async (deviceId) => {
  const [devices] = await pool.query(
    'SELECT * FROM devices WHERE device_id = ?',
    [deviceId]
  );

  if (devices.length === 0) {
    return null;
  }

  const device = devices[0];

  const [readings] = await pool.query(
    `
    SELECT * FROM sensor_readings
    WHERE device_id = ? AND sensor_type = 'temp'
    ORDER BY ts DESC
    LIMIT 1
    `,
    [device.id]
  );

  return {
    ...device,
    latestReading: readings[0] || null
  };
};

export const getSensorReadings = async (
  deviceId,
  sensorType,
  queryParams
) => {
  const { from, to, limit = 100 } = queryParams;

  const [devices] = await pool.query(
    'SELECT id FROM devices WHERE device_id = ?',
    [deviceId]
  );

  if (devices.length === 0) {
    return null;
  }

  let query = `
    SELECT * FROM sensor_readings
    WHERE device_id = ? AND sensor_type = ?
  `;
  const params = [devices[0].id, sensorType];

  if (from) {
    query += ' AND ts >= ?';
    params.push(new Date(from));
  }

  if (to) {
    query += ' AND ts <= ?';
    params.push(new Date(to));
  }

  query += ' ORDER BY ts DESC LIMIT ?';
  params.push(parseInt(limit));

  const [readings] = await pool.query(query, params);

  return readings.reverse();
};
