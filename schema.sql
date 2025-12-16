CREATE DATABASE IF NOT EXISTS sensor_dashboard;
USE sensor_dashboard;

-- devices
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128),
  tags VARCHAR(255),
  last_seen DATETIME,
  status ENUM('OK','WARN','CRITICAL','OFFLINE') DEFAULT 'OFFLINE',
  meta JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_id (device_id),
  INDEX idx_status (status)
);

-- sensors
CREATE TABLE IF NOT EXISTS sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  sensor_type VARCHAR(64),
  sensor_label VARCHAR(128),
  unit VARCHAR(16),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_sensor (device_id, sensor_type)
);

-- sensor_readings (time-series)
CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  sensor_type VARCHAR(64) NOT NULL,
  value DOUBLE NOT NULL,
  ts DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_sensor_ts (device_id, sensor_type, ts)
);

-- alerts
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  sensor_type VARCHAR(64),
  severity ENUM('INFO','WARN','CRITICAL') DEFAULT 'INFO',
  message TEXT,
  value DOUBLE,
  ts DATETIME NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(128),
  acknowledged_at DATETIME,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  INDEX idx_device_alert (device_id, acknowledged, ts)
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(128) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('operator','engineer','admin') DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--threshold
CREATE TABLE IF NOT EXISTS thresholds (
  sensor_type VARCHAR(64) PRIMARY KEY,
  warn_threshold DOUBLE NOT NULL,
  critical_threshold DOUBLE NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);


-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$rZ5vE4qYqYqYqYqYqYqYqOZJ5J5J5J5J5J5J5J5J5J5J5J5J5J5J5K', 'admin'),
('engineer', '$2b$10$rZ5vE4qYqYqYqYqYqYqYqOZJ5J5J5J5J5J5J5J5J5J5J5J5J5J5J5K', 'engineer')
ON DUPLICATE KEY UPDATE username=username;

-- Insert sample devices
INSERT INTO devices (device_id, name, tags, status) VALUES 
('WGN-1', 'Wagon 1', 'train-a,cargo', 'OFFLINE'),
('WGN-2', 'Wagon 2', 'train-a,cargo', 'OFFLINE'),
('WGN-3', 'Wagon 3', 'train-b,passenger', 'OFFLINE'),
('WGN-4', 'Wagon 4', 'train-b,passenger', 'OFFLINE'),
('WGN-5', 'Wagon 5', 'train-c,cargo', 'OFFLINE')
ON DUPLICATE KEY UPDATE device_id=device_id;

-- Insert sensors for each device
INSERT INTO sensors (device_id, sensor_type, sensor_label, unit)
SELECT id, 'temp', 'Temperature Sensor', '°C'
FROM devices
WHERE NOT EXISTS (
  SELECT 1 FROM sensors WHERE device_id = devices.id AND sensor_type = 'temp'
);

INSERT INTO thresholds (sensor_type, warn_threshold, critical_threshold)
VALUES ('temp', 75, 85)
ON DUPLICATE KEY UPDATE
  warn_threshold = VALUES(warn_threshold),
  critical_threshold = VALUES(critical_threshold);

