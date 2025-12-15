import * as alertService from '../services/alert.service.js';

export const getAlerts = async (req, res) => {
  try {
    const alerts = await alertService.getAlerts(req.query);
    res.json({ alerts });
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const ackAllAlerts = async (req, res) => {
  try {
    const result = await alertService.ackAllAlerts();

    res.json({
      message: 'All alerts acknowledged',
      count: result.affectedRows
    });
  } catch (err) {
    console.error('Ack all alerts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const ackAlertById = async (req, res) => {
  try {
    const result = await alertService.ackAlertById(
      req.params.id,
      req.user.username
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Acknowledge alert error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
