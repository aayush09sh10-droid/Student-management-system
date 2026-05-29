import express from 'express';
import {
  getAttendanceByDate,
  saveAttendance,
  getDashboardStats,
  getStudentStats,
  exportAttendanceCSV
} from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/', getAttendanceByDate);
router.post('/save', saveAttendance);
router.get('/stats/overview', getDashboardStats);
router.get('/stats/student/:id', getStudentStats);
router.get('/export', exportAttendanceCSV);

export default router;
