import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getDevices,
  getDeviceById,
  getSensorReadings
} from '../controllers/device.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getDevices);
router.get('/:deviceId', getDeviceById);
router.get(
  '/:deviceId/sensors/:sensorType/readings',
  getSensorReadings
);

export default router;
