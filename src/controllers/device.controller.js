import * as deviceService from '../services/device.service.js';

export const getDevices = async (req, res) => {
  try {
    const data = await deviceService.getDevices(req.query);

    res.json({
      devices: data.devices,
      stats: data.stats,
      activeAlerts: data.activeAlerts
    });
  } catch (err) {
    console.error('Get devices error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDeviceById = async (req, res) => {
  try {
    const deviceData = await deviceService.getDeviceById(req.params.deviceId);

    if (!deviceData) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(deviceData);
  } catch (err) {
    console.error('Get device error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getSensorReadings = async (req, res) => {
  try {
    const readings = await deviceService.getSensorReadings(
      req.params.deviceId,
      req.params.sensorType,
      req.query
    );

    if (!readings) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ readings });
  } catch (err) {
    console.error('Get readings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
