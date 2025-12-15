# Sensor Dashboard - Backend

A Node.js backend service providing REST APIs and WebSocket real-time communication for the sensor monitoring dashboard.

## Tech Stack

- Node.js with Express
- WebSocket (ws library)
- MySQL for persistent storage
- JWT for authentication
- bcrypt for password hashing

## Features

- **REST APIs**: Device management, alerts, authentication, admin controls
- **WebSocket Server**: Real-time sensor data broadcasting
- **Authentication**: JWT-based authentication with role-based access control
- **Data Simulator**: Generates realistic sensor data for testing
- **Alert System**: Automatic threshold-based alerts with severity levels

## Prerequisites

- Node.js 16.x or higher
- MySQL 8.0 or higher
- npm or yarn

## Installation

### 1. Database Setup

Create a MySQL database and user:

```sql
CREATE DATABASE sensor_dashboard;
CREATE USER 'sensor_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON sensor_dashboard.* TO 'sensor_user'@'localhost';
FLUSH PRIVILEGES;
```

Run the database schema:

```bash
mysql -u sensor_user -p sensor_dashboard < schema.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
PORT=3001
DB_HOST=localhost
DB_USER=sensor_user
DB_PASSWORD=your_password
DB_NAME=sensor_dashboard
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will be available at:
- REST API: http://localhost:3001
- WebSocket: ws://localhost:3001/ws

## Default Users

The system comes with demo accounts for testing:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| engineer | engineer123 | engineer |
| operator | operator123 | operator |

## API Documentation

### Authentication

**POST** `/api/v1/auth/login`

Request:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Devices

**GET** `/api/v1/devices`

Query Parameters:
- `status` - Filter by device status (OK, WARNING, CRITICAL, OFFLINE)
- `search` - Search by device ID or name

**GET** `/api/v1/devices/:deviceId`

Get device details including current sensor readings.

**GET** `/api/v1/devices/:deviceId/sensors/:sensorType/readings`

Query Parameters:
- `timeRange` - Time range for readings (1h, 24h, 7d, 30d)
- `limit` - Maximum number of readings to return

### Alerts

**GET** `/api/v1/alerts`

Query Parameters:
- `status` - Filter by status (ACTIVE, ACKNOWLEDGED, RESOLVED)
- `severity` - Filter by severity (INFO, WARNING, CRITICAL)
- `deviceId` - Filter by device ID
- `limit` - Maximum number of alerts to return

**POST** `/api/v1/alerts/:id/ack`

Acknowledge a specific alert. Requires engineer or admin role.

**POST** `/api/v1/alerts/ack-all`

Acknowledge all active alerts. Requires engineer or admin role.

### Admin (Admin only)

**GET** `/api/v1/admin/thresholds`

Get current alert thresholds.

**POST** `/api/v1/admin/thresholds`

Update alert thresholds.

Request:
```json
{
  "sensorType": "temp",
  "warningMin": 0,
  "warningMax": 70,
  "criticalMin": -10,
  "criticalMax": 85
}
```

## WebSocket Protocol

### Connection

Connect to `ws://localhost:3001/ws` with JWT token as query parameter:
```
ws://localhost:3001/ws?token=your_jwt_token
```

### Server → Client Events

**Welcome Message:**
```json
{
  "type": "welcome",
  "serverTime": "2025-12-15T10:00:00.000Z",
  "clientId": "unique-id"
}
```

**Sensor Reading:**
```json
{
  "type": "sensor.reading",
  "deviceId": "WGN-1",
  "sensorType": "temp",
  "value": 42.5,
  "ts": "2025-12-15T10:00:00.000Z"
}
```

**Device Update:**
```json
{
  "type": "device.update",
  "deviceId": "WGN-1",
  "status": "OK",
  "lastSeen": "2025-12-15T10:00:00.000Z"
}
```

**Alert Created:**
```json
{
  "type": "alert.created",
  "alertId": 123,
  "deviceId": "WGN-1",
  "severity": "CRITICAL",
  "message": "Critical temperature: 87.3°C",
  "ts": "2025-12-15T10:00:00.000Z"
}
```

### Client → Server Events

**Subscribe to Devices:**
```json
{
  "type": "subscribe",
  "devices": ["WGN-1", "WGN-2"],
  "sensorTypes": ["temp"]
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection configuration
│   ├── controllers/
│   │   ├── auth.controller.js # Authentication endpoints
│   │   ├── device.controller.js # Device management endpoints
│   │   ├── alert.controller.js # Alert management endpoints
│   │   └── admin.controller.js # Admin configuration endpoints
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.route.js      # Authentication routes
│   │   ├── devices.route.js   # Device routes
│   │   ├── alerts.route.js    # Alert routes
│   │   └── admin.route.js     # Admin routes
│   └── services/
│       ├── auth.service.js    # Authentication business logic
│       ├── device.service.js  # Device business logic
│       ├── alert.service.js   # Alert business logic
│       ├── admin.service.js   # Admin business logic
│       ├── websocket.service.js # WebSocket management
│       └── simulator.service.js # Data simulation for testing
├── schema.sql                 # Database schema
├── server.js                  # Application entry point
├── .env                       # Environment variables
└── package.json               # Dependencies and scripts
```

## Testing

Run tests:
```bash
npm test
```

## Performance Considerations

- **Batch Inserts**: Sensor readings are batch-inserted every 5 seconds to reduce database load
- **Connection Pooling**: MySQL connection pool configured for optimal performance
- **Database Indexes**: Optimized indexes on timestamp columns for fast time-series queries
- **WebSocket Filtering**: Clients can subscribe to specific devices to reduce bandwidth

## Security Features

- JWT tokens expire after 8 hours
- Passwords hashed using bcrypt with salt rounds
- SQL injection prevention through parameterized queries
- Role-based access control on sensitive endpoints
- WebSocket authentication required for connections

## Troubleshooting

### Database Connection Errors

1. Verify MySQL is running: `sudo service mysql status`
2. Check credentials in `.env` file
3. Ensure database exists: `SHOW DATABASES;`
4. Verify user permissions: `SHOW GRANTS FOR 'sensor_user'@'localhost';`

### WebSocket Issues

1. Check if port 3001 is available
2. Verify JWT token is valid and not expired
3. Check server logs for connection errors

### High Memory Usage

The simulator generates data every 2 seconds. Consider:
- Adjusting `SIMULATOR_INTERVAL` in simulator.service.js
- Implementing data archiving for old readings
- Using time-series optimized database

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| DB_HOST | MySQL host | localhost |
| DB_USER | MySQL username | sensor_user |
| DB_PASSWORD | MySQL password | - |
| DB_NAME | Database name | sensor_dashboard |
| JWT_SECRET | Secret for JWT signing | - |
