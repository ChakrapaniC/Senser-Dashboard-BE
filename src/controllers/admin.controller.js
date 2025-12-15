import * as adminService from '../services/admin.service.js';


export const getThresholds = async (req, res) => {
  try {
    const thresholds = await adminService.getThresholds();
    res.json({ thresholds });
  } catch (err) {
    console.error('Get thresholds error:', err);
    res.status(500).json({ error: 'Failed to fetch thresholds' });
  }
};

export const updateThresholds = async (req, res) => {
  try {
    const { sensor_type, warn_threshold, critical_threshold } = req.body;

    if (
      !sensor_type ||
      warn_threshold === undefined ||
      critical_threshold === undefined
    ) {
      return res.status(400).json({
        error: 'Missing required fields: sensor_type, warn_threshold, critical_threshold',
      });
    }

    if (critical_threshold <= warn_threshold) {
      return res.status(400).json({
        error: 'Critical threshold must be greater than warning threshold',
      });
    }

    await adminService.updateThresholds(
      sensor_type,
      warn_threshold,
      critical_threshold
    );

    res.json({
      message: 'Thresholds updated successfully',
      thresholds: { sensor_type, warn_threshold, critical_threshold },
    });
  } catch (err) {
    console.error('Update thresholds error:', err);
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
};
