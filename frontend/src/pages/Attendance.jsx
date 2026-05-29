import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckSquare, XCircle, Clock, FileText, CheckCircle, RefreshCw } from 'lucide-react';

export default function Attendance({ triggerToast }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classSection, setClassSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [records, setRecords] = useState([]);
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch distinct classes on mount to populate the dropdown
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch class listings');
      const data = await res.json();
      
      const uniqueClasses = Array.from(new Set(data.map(s => s.classSection))).sort();
      setClassesList(uniqueClasses);
      if (uniqueClasses.length > 0 && !classSection) {
        setClassSection(uniqueClasses[0]); // Default to first class
      }
    } catch (err) {
      console.error(err);
      triggerToast('Could not load class directory.', 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch attendance list for chosen class & date
  const fetchAttendance = async () => {
    if (!classSection) return;
    try {
      setLoadingAttendance(true);
      const res = await fetch(`/api/attendance?date=${date}&classSection=${classSection}`);
      if (!res.ok) throw new Error('Failed to fetch attendance logs');
      const data = await res.json();
      
      // Data is array of { student: { _id, studentId, name, rollNumber, classSection }, status, remarks, hasRecord }
      setRecords(data);
    } catch (err) {
      console.error(err);
      triggerToast('Error loading attendance logs.', 'error');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [date, classSection]);

  // Handle single student attendance status change
  const handleStatusChange = (studentDbId, status) => {
    setRecords(prev => prev.map(rec => {
      if (rec.student._id === studentDbId) {
        return { ...rec, status };
      }
      return rec;
    }));
  };

  // Handle remarks change
  const handleRemarksChange = (studentDbId, remarks) => {
    setRecords(prev => prev.map(rec => {
      if (rec.student._id === studentDbId) {
        return { ...rec, remarks };
      }
      return rec;
    }));
  };

  // Bulk options
  const markAllStatus = (status) => {
    setRecords(prev => prev.map(rec => ({ ...rec, status })));
    triggerToast(`All students marked as ${status}`, 'success');
  };

  // Save changes to backend
  const handleSave = async () => {
    if (records.length === 0) return;
    try {
      setSaving(true);
      
      // Format payload: { date, classSection, records: [{ studentId, status, remarks }] }
      const payload = {
        date,
        classSection,
        records: records.map(rec => ({
          studentId: rec.student._id,
          status: rec.status,
          remarks: rec.remarks
        }))
      };

      const res = await fetch('/api/attendance/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save attendance logs');

      triggerToast('Attendance registry saved and updated successfully', 'success');
      fetchAttendance(); // Refresh
    } catch (err) {
      triggerToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <header className="top-header">
        <div className="page-title">
          <h1>Attendance Register</h1>
          <p>Mark daily attendance, write logs and view status</p>
        </div>
        <div className="header-actions">
          {records.length > 0 && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <CheckCircle size={16} className={saving ? 'spin' : ''} />
              {saving ? 'Saving...' : 'Save Records'}
            </button>
          )}
        </div>
      </header>

      {/* Selector Panels */}
      <section className="attendance-filters">
        <div className="filter-group">
          <Calendar size={18} style={{ color: 'var(--accent-indigo)' }} />
          <label>Target Date:</label>
          <input
            type="date"
            className="select-field"
            style={{ minWidth: '180px' }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Users size={18} style={{ color: 'var(--accent-purple)' }} />
          <label>Class Section:</label>
          {loadingClasses ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Loading classes...</span>
          ) : (
            <select
              className="select-field"
              value={classSection}
              onChange={(e) => setClassSection(e.target.value)}
            >
              {classesList.length === 0 ? (
                <option value="">No classes active</option>
              ) : (
                classesList.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))
              )}
            </select>
          )}
        </div>

        <button className="btn btn-icon-only" onClick={fetchAttendance} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={16} className={loadingAttendance ? 'spin' : ''} />
        </button>
      </section>

      {/* Bulk actions and core tables */}
      {loadingAttendance ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Retrieving class checklist...</p>
        </div>
      ) : !classSection ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No Class Registries Found</h3>
          <p>Go to the Student Directory and add your first student with their respective class section to get started.</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No Enrolled Students In {classSection}</h3>
          <p>There are no active student profiles assigned to this section yet. Add students to class {classSection} in the directory.</p>
        </div>
      ) : (
        <div className="attendance-grid" style={{ marginTop: '24px' }}>
          
          {/* Bulk Marking Bar */}
          <div className="bulk-bar">
            <span className="bulk-title">Bulk Actions ({records.length} Students):</span>
            <div className="bulk-actions-wrapper">
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--color-present)' }} 
                onClick={() => markAllStatus('Present')}
              >
                <CheckSquare size={14} className="text-present" style={{ color: 'var(--color-present)' }} />
                All Present
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--color-absent)' }} 
                onClick={() => markAllStatus('Absent')}
              >
                <XCircle size={14} className="text-absent" style={{ color: 'var(--color-absent)' }} />
                All Absent
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-responsive">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Info</th>
                  <th>Attendance Status</th>
                  <th>Remarks / Comments</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.student._id}>
                    <td style={{ fontWeight: '700', width: '10%' }}>{rec.student.rollNumber}</td>
                    <td style={{ width: '30%' }}>
                      <div style={{ fontWeight: '600', color: 'white' }}>{rec.student.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {rec.student.studentId}</div>
                    </td>
                    <td style={{ width: '35%' }}>
                      <div className="status-pills">
                        <button 
                          className={`status-pill Present ${rec.status === 'Present' ? 'selected' : ''}`}
                          onClick={() => handleStatusChange(rec.student._id, 'Present')}
                        >
                          Present
                        </button>
                        <button 
                          className={`status-pill Late ${rec.status === 'Late' ? 'selected' : ''}`}
                          onClick={() => handleStatusChange(rec.student._id, 'Late')}
                        >
                          Late
                        </button>
                        <button 
                          className={`status-pill Excused ${rec.status === 'Excused' ? 'selected' : ''}`}
                          onClick={() => handleStatusChange(rec.student._id, 'Excused')}
                        >
                          Excused
                        </button>
                        <button 
                          className={`status-pill Absent ${rec.status === 'Absent' ? 'selected' : ''}`}
                          onClick={() => handleStatusChange(rec.student._id, 'Absent')}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td style={{ width: '25%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. medical slip, left early"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                          value={rec.remarks}
                          onChange={(e) => handleRemarksChange(rec.student._id, e.target.value)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 30px' }}>
              <CheckCircle size={16} className={saving ? 'spin' : ''} />
              {saving ? 'Saving Logs...' : 'Submit Attendance Register'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
