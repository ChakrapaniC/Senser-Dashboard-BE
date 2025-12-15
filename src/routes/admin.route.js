import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/thresholds', adminController.getThresholds);
router.post('/thresholds', adminController.updateThresholds);

export default router;
