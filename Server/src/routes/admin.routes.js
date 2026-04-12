import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import {
    getPlatformStats,
    getPendingNGOs,
    updateNGOStatus,
    getAllEscrows,
    manageEscrow,
    getAllUsers
} from '../controllers/admin.controller.js';

const router = express.Router();

// All routes here are restricted to Admin
router.use(protect);
router.use(authorize('admin'));

// Stats
router.get('/stats', getPlatformStats);

// NGOs
router.get('/ngos/pending', getPendingNGOs);
router.put('/ngos/:id/status', updateNGOStatus);

// Escrow
router.get('/escrows', getAllEscrows);
router.put('/escrows/:id/manage', manageEscrow);

// Users
router.get('/users', getAllUsers);

export default router;
