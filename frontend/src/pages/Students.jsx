import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react';

export default function Students({ triggerToast }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    classSection: '',
    phone: '',
    gender: 'Male',
    status: 'Active'
  });

  // Distinct classes list for filter dropdown
  const [classesList, setClassesList] = useState([]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (classFilter) queryParams.append('classSection', classFilter);
      
      const res = await fetch(`/api/students?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to retrieve students');
      const data = await res.json();
      setStudents(data);

      // Extract unique classes list
      if (!classFilter && data.length > 0) {
        const uniqueClasses = Array.from(new Set(data.map(s => s.classSection))).sort();
        setClassesList(uniqueClasses);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Could not sync student database. Check server connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input to limit API calls
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, classFilter]);

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedStudentId(null);
    setFormData({
      name: '',
      email: '',
      rollNumber: '',
      classSection: '',
      phone: '',
      gender: 'Male',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setIsEditing(true);
    setSelectedStudentId(student._id);
    setFormData({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      classSection: student.classSection,
      phone: student.phone || '',
      gender: student.gender,
      status: student.status
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/students/${selectedStudentId}` : '/api/students';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error saving student');
      }

      triggerToast(
        isEditing ? 'Student profile updated successfully' : 'New student registered successfully',
        'success'
      );
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? This will also wipe all of their attendance history.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Error deleting student');
      }

      triggerToast('Student record wiped successfully', 'success');
      fetchStudents();
    } catch (err) {
      triggerToast(err.message, 'error');
    }
  };

  return (
    <div>
      <header className="top-header">
        <div className="page-title">
          <h1>Student Directory</h1>
          <p>Register, update and manage student enrollment records</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </header>

      {/* Toolbar / Search & Filter */}
      <section className="toolbar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, roll no, student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="select-field"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classesList.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <button className="btn btn-icon-only" onClick={fetchStudents} title="Sync list">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </section>

      {/* Database Table view */}
      {loading && students.length === 0 ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Syncing student logs...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <GraduationCap size={48} />
          <h3>No Student Records Found</h3>
          <p>Try searching another keyword, changing the class filter, or create a new registry entry.</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            Add First Student
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Class / Section</th>
                <th>Contact</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>
                    <code style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '2px 6px' }}>
                      {student.studentId}
                    </code>
                  </td>
                  <td>
                    <div className="student-name-cell">
                      <div className="student-avatar">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'white' }}>{student.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{student.rollNumber}</td>
                  <td>
                    <span style={{ fontWeight: '500' }}>{student.classSection}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{student.phone || '-'}</span>
                  </td>
                  <td>{student.gender}</td>
                  <td>
                    <span className={`badge ${student.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="action-btn" onClick={() => openEditModal(student)} title="Edit profile">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(student._id, student.name)} title="Remove entry">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>{isEditing ? 'Modify Student Profile' : 'Enroll New Student'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Student Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  className="form-control"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. john.doe@school.com"
                  className="form-control"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Roll Number *</label>
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    placeholder="e.g. R2026-01"
                    className="form-control"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Class / Section *</label>
                  <input
                    type="text"
                    name="classSection"
                    required
                    placeholder="e.g. CS-101"
                    className="form-control"
                    value={formData.classSection}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. +1 555-0199"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    required
                    className="form-control"
                    style={{ background: 'var(--bg-primary)', color: 'white' }}
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    required
                    className="form-control"
                    style={{ background: 'var(--bg-primary)', color: 'white' }}
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              )}

              <footer className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Register Student'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
