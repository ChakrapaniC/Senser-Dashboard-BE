import pool from '../config/db.js';
import { broadcast } from './websocket.service.js';

const readingsBuffer = [];
let thresholds = { warn: 75, critical: 85 }; // Default values

// Load thresholds from DB
async function loadThresholds() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM thresholds WHERE sensor_type = 'temp' LIMIT 1"
    );
    if (rows.length > 0) {
      thresholds = {
        warn: rows[0].warn_threshold,
        critical: rows[0].critical_threshold
      };
      console.log('Loaded thresholds:', thresholds);
    }
  } catch (err) {
    console.error('Failed to load thresholds:', err);
  }
}

export async function startSimulator() {
  console.log('Starting sensor simulator...');
  
  // Load initial thresholds
  await loadThresholds();
  
  // Reload thresholds every 30 seconds
  setInterval(loadThresholds, 30000);

  // Generate readings every 2 seconds
  setInterval(async () => {
    try {
      const [devices] = await pool.query('SELECT * FROM devices');

      for (const device of devices) {
        const temp = 20 + Math.random() * 70; // 20-90°C
        const ts = new Date();

        // Buffer for batch insert
        readingsBuffer.push({
          device_id: device.id,
          sensor_type: 'temp',
          value: temp,
          ts
        });

        // Determine status based on current thresholds
        let status = 'OK';
        let severity = null;
        let alertMsg = null;

        if (temp >= thresholds.critical) {
          status = 'CRITICAL';
          severity = 'CRITICAL';
          alertMsg = `Critical temperature: ${temp.toFixed(1)}°C (threshold: ${thresholds.critical}°C)`;
        } else if (temp >= thresholds.warn) {
          status = 'WARN';
          severity = 'WARN';
          alertMsg = `High temperature: ${temp.toFixed(1)}°C (threshold: ${thresholds.warn}°C)`;
        }

        // Update device status
        await pool.query(
          'UPDATE devices SET status = ?, last_seen = ? WHERE id = ?',
          [status, ts, device.id]
        );

        // Create alert if threshold exceeded
        if (severity) {
          const [result] = await pool.query(
            `INSERT INTO alerts (device_id, sensor_type, severity, message, value, ts)
             VALUES (?, 'temp', ?, ?, ?, ?)`,
            [device.id, severity, alertMsg, temp, ts]
          );

          broadcast({
            type: 'alert.created',
            alertId: result.insertId,
            deviceId: device.device_id,
            severity,
            message: alertMsg,
            ts: ts.toISOString()
          });
        }

        // Broadcast via WebSocket
        broadcast({
          type: 'sensor.reading',
          deviceId: device.device_id,
          sensorType: 'temp',
          value: parseFloat(temp.toFixed(2)),
          ts: ts.toISOString()
        });

        broadcast({
          type: 'device.update',
          deviceId: device.device_id,
          status,
          lastSeen: ts.toISOString()
        });
      }
    } catch (err) {
      console.error('Simulator error:', err);
    }
  }, 2000);

  // Batch insert readings every 5 seconds
  setInterval(async () => {
    if (readingsBuffer.length > 0) {
      try {
        const values = readingsBuffer.splice(0, readingsBuffer.length);
        if (values.length > 0) {
          const query = `
            INSERT INTO sensor_readings (device_id, sensor_type, value, ts)
            VALUES ?
          `;
          const data = values.map(r => [r.device_id, r.sensor_type, r.value, r.ts]);
          await pool.query(query, [data]);
        }
      } catch (err) {
        console.error('Batch insert error:', err);
      }
    }
  }, 5000);
}