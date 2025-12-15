import pool from '../config/db.js';

export const getThresholds = async () => {
  const [rows] = await pool.query('SELECT * FROM thresholds ORDER BY sensor_type');
  return rows;
};

export const updateThresholds = async (sensorType, warnThreshold, criticalThreshold) => {
  const [result] = await pool.query(
    `INSERT INTO thresholds (sensor_type, warn_threshold, critical_threshold, updated_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE 
       warn_threshold = VALUES(warn_threshold),
       critical_threshold = VALUES(critical_threshold),
       updated_at = NOW()`,
    [sensorType, warnThreshold, criticalThreshold]
  );
  
  return result;
};