import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    default: 'Present'
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

// Compound unique index so a student can only have one attendance record per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
