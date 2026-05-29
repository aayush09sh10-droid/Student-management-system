import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check and root route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(), 
    message: 'Smart Attendance System API is running smoothly' 
  });
});

// Error handling middleware for express
app.use((err, req, res, next) => {
  console.error(`💥 Server Error Stack: ${err.stack}`);
  res.status(500).json({ 
    message: 'An internal server error occurred', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});
