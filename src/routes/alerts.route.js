import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAlerts,
  ackAllAlerts,
  ackAlertById
} from '../controllers/alert.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAlerts);
router.post('/ack-all', authorize('engineer', 'admin') , ackAllAlerts);
router.post('/:id/ack', authorize('engineer', 'admin') ,ackAlertById);

export default router;
