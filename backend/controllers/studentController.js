import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';

// Generate a unique 4-digit numeric ID prefixed with STD-
const generateUniqueStudentId = async () => {
  let isUnique = false;
  let studentId = '';
  while (!isUnique) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit code (1000-9999)
    studentId = `STD-${randomDigits}`;
    const existing = await Student.findOne({ studentId });
    if (!existing) {
      isUnique = true;
    }
  }
  return studentId;
};

// GET all students (with optional search and class filters)
export const getAllStudents = async (req, res) => {
  try {
    const { search, classSection, status } = req.query;
    const query = {};

    // Filter by classSection if provided
    if (classSection) {
      query.classSection = classSection;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Search by name, rollNumber, or studentId
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query).sort({ classSection: 1, name: 1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
};

// GET a student by database ID
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving student', error: error.message });
  }
};

// CREATE a new student
export const createStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, classSection, phone, gender, status } = req.body;

    if (!name || !email || !rollNumber || !classSection || !gender) {
      return res.status(400).json({ message: 'Required fields: name, email, rollNumber, classSection, gender' });
    }

    // Check if email already exists
    const emailExists = await Student.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'A student with this email already exists' });
    }

    // Generate unique student ID
    const studentId = await generateUniqueStudentId();

    const newStudent = new Student({
      studentId,
      name,
      email,
      rollNumber,
      classSection,
      phone,
      gender,
      status: status || 'Active'
    });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
};

// UPDATE an existing student
export const updateStudent = async (req, res) => {
  try {
    const { name, email, rollNumber, classSection, phone, gender, status } = req.body;

    // Check email uniqueness if email is changed
    if (email) {
      const emailExists = await Student.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.params.id } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'A student with this email already exists' });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { name, email, rollNumber, classSection, phone, gender, status },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

// DELETE a student & clean up attendance records
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Remove the student
    await Student.findByIdAndDelete(req.params.id);
    
    // Remove all associated attendance entries
    await Attendance.deleteMany({ student: req.params.id });

    res.status(200).json({ message: 'Student and associated attendance records successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};
