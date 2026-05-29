import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

// Helper to normalize any date string to a UTC Date object at 00:00:00
const getNormalizedDate = (dateString) => {
  const d = dateString ? new Date(dateString) : new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

// GET attendance list for a specific classSection and date
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, classSection } = req.query;

    if (!classSection) {
      return res.status(400).json({ message: 'classSection query parameter is required' });
    }

    const targetDate = getNormalizedDate(date);

    // Fetch active students in the class
    const students = await Student.find({ classSection, status: 'Active' }).sort({ name: 1 });

    if (students.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch existing attendance records for these students on this date
    const studentIds = students.map(s => s._id);
    const records = await Attendance.find({
      date: targetDate,
      student: { $in: studentIds }
    });

    // Merge students with their attendance status
    const mergedList = students.map(student => {
      const record = records.find(r => r.student.toString() === student._id.toString());
      return {
        student: {
          _id: student._id,
          studentId: student.studentId,
          name: student.name,
          rollNumber: student.rollNumber,
          classSection: student.classSection
        },
        status: record ? record.status : 'Present', // Default to present if no record exists yet
        remarks: record ? record.remarks : '',
        hasRecord: !!record
      };
    });

    res.status(200).json(mergedList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
};

// SAVE / UPDATE attendance in bulk for a specific classSection and date
export const saveAttendance = async (req, res) => {
  try {
    const { date, classSection, records } = req.body;

    if (!classSection || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'classSection and records array are required' });
    }

    const targetDate = getNormalizedDate(date);

    // Create bulk operations for upserting records
    const bulkOps = records.map(rec => {
      if (!rec.studentId || !rec.status) {
        throw new Error('Each record must contain studentId and status');
      }
      return {
        updateOne: {
          filter: { student: rec.studentId, date: targetDate },
          update: { 
            $set: { 
              status: rec.status, 
              remarks: rec.remarks || '' 
            } 
          },
          upsert: true
        }
      };
    });

    await Attendance.bulkWrite(bulkOps);
    res.status(200).json({ message: 'Attendance records updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving attendance', error: error.message });
  }
};

// GET Dashboard Analytics
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total active students
    const totalStudents = await Student.countDocuments({ status: 'Active' });

    // 2. Class lists (distinct classes)
    const classes = await Student.distinct('classSection');

    // 3. Today's overall attendance rate
    const today = getNormalizedDate();
    const todayRecords = await Attendance.find({ date: today }).populate('student');
    
    // Filter records for active students only
    const activeTodayRecords = todayRecords.filter(r => r.student && r.student.status === 'Active');
    
    const presentToday = activeTodayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const todayRate = totalStudents > 0 
      ? Math.round((presentToday / totalStudents) * 100) 
      : 100;

    // 4. Seven-day trends
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const normalized = getNormalizedDate(targetDate);
      
      const dayRecords = await Attendance.find({ date: normalized }).populate('student');
      const activeDayRecords = dayRecords.filter(r => r.student && r.student.status === 'Active');
      
      const totalCount = activeDayRecords.length;
      const presentCount = activeDayRecords.filter(r => r.status === 'Present').length;
      const absentCount = activeDayRecords.filter(r => r.status === 'Absent').length;
      const lateCount = activeDayRecords.filter(r => r.status === 'Late').length;
      const excusedCount = activeDayRecords.filter(r => r.status === 'Excused').length;

      trends.push({
        date: normalized.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        total: totalCount
      });
    }

    // 5. Class-wise statistics for today
    const classStats = [];
    for (const classSec of classes) {
      const studentCount = await Student.countDocuments({ classSection: classSec, status: 'Active' });
      const studentIds = await Student.find({ classSection: classSec, status: 'Active' }).select('_id');
      
      const classTodayRecords = await Attendance.find({
        date: today,
        student: { $in: studentIds }
      });
      
      const classPresent = classTodayRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const rate = studentCount > 0 
        ? Math.round((classPresent / studentCount) * 100) 
        : 100;
      
      classStats.push({
        classSection: classSec,
        total: studentCount,
        present: classPresent,
        rate
      });
    }

    // 6. At-risk students (Attendance percentage < 75%)
    // Aggregate to calculate attendance percentages
    const allStudents = await Student.find({ status: 'Active' });
    const atRiskStudents = [];

    for (const student of allStudents) {
      const totalLogs = await Attendance.countDocuments({ student: student._id });
      if (totalLogs >= 3) { // Only highlight if they have at least 3 logs
        const presentOrLate = await Attendance.countDocuments({
          student: student._id,
          status: { $in: ['Present', 'Late'] }
        });
        const percentage = Math.round((presentOrLate / totalLogs) * 100);
        if (percentage < 75) {
          atRiskStudents.push({
            _id: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            classSection: student.classSection,
            percentage
          });
        }
      }
    }

    res.status(200).json({
      totalStudents,
      classesCount: classes.length,
      todayRate,
      trends,
      classStats,
      atRisk: atRiskStudents.sort((a, b) => a.percentage - b.percentage).slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling statistics', error: error.message });
  }
};

// GET single student attendance metrics
export const getStudentStats = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const records = await Attendance.find({ student: id }).sort({ date: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const late = records.filter(r => r.status === 'Late').length;
    const excused = records.filter(r => r.status === 'Excused').length;

    const percentage = total > 0 
      ? Math.round(((present + late) / total) * 100) 
      : 100;

    res.status(200).json({
      student,
      summary: {
        total,
        present,
        absent,
        late,
        excused,
        percentage
      },
      history: records.map(r => ({
        _id: r._id,
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        remarks: r.remarks
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving student metrics', error: error.message });
  }
};

// EXPORT attendance records to CSV
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { classSection, startDate, endDate } = req.query;

    if (!classSection) {
      return res.status(400).json({ message: 'classSection parameter is required for export' });
    }

    const query = { classSection, status: 'Active' };
    const students = await Student.find(query).sort({ name: 1 });

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in the specified class section' });
    }

    // Set date bounds
    const start = startDate ? getNormalizedDate(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default last 30 days
    const end = endDate ? getNormalizedDate(endDate) : getNormalizedDate();

    // Fetch all attendance records in range
    const studentIds = students.map(s => s._id);
    const attendanceRecords = await Attendance.find({
      student: { $in: studentIds },
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Identify unique dates present in records
    const datesSet = new Set();
    attendanceRecords.forEach(rec => {
      datesSet.add(rec.date.toISOString().split('T')[0]);
    });
    const sortedDates = Array.from(datesSet).sort();

    // Build CSV Headers: Student ID, Name, Roll Number, [Sorted Dates...], Attendance Rate
    let csvContent = 'Student ID,Name,Roll Number,' + sortedDates.join(',') + ',Attendance Rate (%)\n';

    // Populate student rows
    students.forEach(student => {
      let row = `"${student.studentId}","${student.name}","${student.rollNumber}"`;
      let studentLogsCount = 0;
      let presentOrLateCount = 0;

      sortedDates.forEach(dateStr => {
        const targetTime = getNormalizedDate(dateStr).getTime();
        const record = attendanceRecords.find(r => 
          r.student.toString() === student._id.toString() && 
          r.date.getTime() === targetTime
        );

        if (record) {
          row += `,"${record.status}"`;
          studentLogsCount++;
          if (record.status === 'Present' || record.status === 'Late') {
            presentOrLateCount++;
          }
        } else {
          row += ',"-"'; // No record for this date
        }
      });

      const rate = studentLogsCount > 0 
        ? Math.round((presentOrLateCount / studentLogsCount) * 100) 
        : 100;

      row += `,"${rate}%"\n`;
      csvContent += row;
    });

    const filename = `Attendance_Report_${classSection.replace(/\s+/g, '_')}_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.csv`;

    // Send CSV with appropriate headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting CSV', error: error.message });
  }
};
