import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, FileSpreadsheet, Percent, Info } from 'lucide-react';

export default function Reports({ triggerToast }) {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default last 30 days
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [classSection, setClassSection] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [reportData, setReportData] = useState([]);
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [stats, setStats] = useState({
    avgRate: 0,
    classesHeld: 0,
    presentCount: 0,
    absentCount: 0
  });

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch class lists');
      const data = await res.json();
      
      const uniqueClasses = Array.from(new Set(data.map(s => s.classSection))).sort();
      setClassesList(uniqueClasses);
      if (uniqueClasses.length > 0 && !classSection) {
        setClassSection(uniqueClasses[0]);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Could not load class list.', 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

  const generateReport = async () => {
    if (!classSection) return;
    try {
      setLoadingReport(true);
      // Construct a report by calling standard API endpoints
      // We'll calculate student attendance statistics based on the class list and active records
      const resStudents = await fetch(`/api/students?classSection=${classSection}`);
      if (!resStudents.ok) throw new Error('Failed to fetch class roster');
      const students = await resStudents.json();

      if (students.length === 0) {
        setReportData([]);
        setStats({ avgRate: 0, classesHeld: 0, presentCount: 0, absentCount: 0 });
        return;
      }

      // Fetch statistics for all students to combine and display in the date range
      // For a robust and quick frontend approach, we fetch detailed stats or compile them.
      // We will loop and fetch or do a single fetch for the class attendance.
      // Let's call our export route as a data source or calculate dynamically.
      // Wait, we can fetch all records on date range and process them:
      // Let's fetch records using attendance endpoint or generate dynamically:
      const resAttendance = await fetch(`/api/attendance/export?classSection=${classSection}&startDate=${startDate}&endDate=${endDate}`);
      if (!resAttendance.ok) throw new Error('Failed to fetch attendance logs');
      
      // Parse the CSV response to preview the table in the browser!
      // This is a very cool, unified approach that guarantees the preview matches the export exactly!
      const csvText = await resAttendance.text();
      const rows = csvText.split('\n').filter(row => row.trim() !== '');
      
      if (rows.length < 2) {
        setReportData([]);
        return;
      }

      // First row: Student ID, Name, Roll Number, [Dates...], Attendance Rate (%)
      const headers = rows[0].split(',').map(h => h.replace(/"/g, ''));
      const dateHeaders = headers.slice(3, -1);
      
      const studentsData = [];
      let totalRateSum = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLogsCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(',').map(c => c.replace(/"/g, ''));
        if (columns.length < headers.length) continue;

        const studentId = columns[0];
        const name = columns[1];
        const roll = columns[2];
        const rates = columns[columns.length - 1]; // e.g. "85%"
        const parsedRate = parseInt(rates.replace('%', ''), 10);

        let present = 0;
        let absent = 0;
        let late = 0;
        let excused = 0;
        let unchecked = 0;

        // Parse individual date cells
        const statusValues = columns.slice(3, -1);
        statusValues.forEach(val => {
          if (val === 'Present') {
            present++;
            totalPresent++;
            totalLogsCount++;
          } else if (val === 'Absent') {
            absent++;
            totalAbsent++;
            totalLogsCount++;
          } else if (val === 'Late') {
            late++;
            totalPresent++; // counts as present for rates
            totalLogsCount++;
          } else if (val === 'Excused') {
            excused++;
            totalLogsCount++;
          } else {
            unchecked++;
          }
        });

        studentsData.push({
          studentId,
          name,
          roll,
          present,
          absent,
          late,
          excused,
          percentage: parsedRate
        });

        totalRateSum += parsedRate;
      }

      setReportData(studentsData);
      setStats({
        avgRate: studentsData.length > 0 ? Math.round(totalRateSum / studentsData.length) : 0,
        classesHeld: dateHeaders.length,
        presentCount: totalPresent,
        absentCount: totalAbsent
      });
    } catch (err) {
      console.error(err);
      triggerToast('Error compiling report summaries.', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    generateReport();
  }, [startDate, endDate, classSection]);

  const handleExport = () => {
    if (!classSection) {
      triggerToast('Please select a class section first.', 'error');
      return;
    }
    
    // Construct the download URL
    const url = `/api/attendance/export?classSection=${classSection}&startDate=${startDate}&endDate=${endDate}`;
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Report_${classSection}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast('Downloading CSV report...', 'success');
  };

  return (
    <div>
      <header className="top-header">
        <div className="page-title">
          <h1>Analytics Reports</h1>
          <p>Export attendance records, analyze rates and review history</p>
        </div>
        <div className="header-actions">
          {reportData.length > 0 && (
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={16} />
              Export to CSV
            </button>
          )}
        </div>
      </header>

      {/* Filter Parameters Card */}
      <section className="report-generator-card">
        <div className="report-form">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Start Date
            </label>
            <input
              type="date"
              className="select-field"
              style={{ width: '100%', minWidth: 'auto' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> End Date
            </label>
            <input
              type="date"
              className="select-field"
              style={{ width: '100%', minWidth: 'auto' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Select Class Section</label>
            {loadingClasses ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', padding: '12px 0', display: 'block' }}>
                Loading...
              </span>
            ) : (
              <select
                className="select-field"
                style={{ width: '100%', minWidth: 'auto' }}
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

          <button className="btn btn-secondary" onClick={generateReport} style={{ height: '42px' }}>
            <RefreshCw size={14} className={loadingReport ? 'spin' : ''} />
            Compile Report
          </button>
        </div>
      </section>

      {/* Aggregate Stats widgets */}
      {reportData.length > 0 && (
        <section className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card blue">
            <div className="stat-icon-wrapper">
              <Percent size={22} />
            </div>
            <div className="stat-details">
              <h3>Average Class Attendance</h3>
              <div className="stat-number">{stats.avgRate}%</div>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon-wrapper">
              <FileSpreadsheet size={22} />
            </div>
            <div className="stat-details">
              <h3>Total Sessions Logged</h3>
              <div className="stat-number">{stats.classesHeld}</div>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon-wrapper">
              <Info size={22} />
            </div>
            <div className="stat-details">
              <h3>Presents / Lates Logged</h3>
              <div className="stat-number">{stats.presentCount}</div>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon-wrapper">
              <Info size={22} />
            </div>
            <div className="stat-details">
              <h3>Absences Logged</h3>
              <div className="stat-number">{stats.absentCount}</div>
            </div>
          </div>
        </section>
      )}

      {/* Data Preview Table */}
      {loadingReport ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Compiling database summaries...</p>
        </div>
      ) : !classSection ? (
        <div className="empty-state">
          <FileSpreadsheet size={48} />
          <h3>No Class Selection</h3>
          <p>Create a class section and add students to generate reports.</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="empty-state">
          <FileSpreadsheet size={48} />
          <h3>No Attendance Records Found</h3>
          <p>There are no recorded attendance entries for class {classSection} between {startDate} and {endDate}.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Roll No</th>
                <th>Full Name</th>
                <th>Presents / Lates</th>
                <th>Excused Logs</th>
                <th>Absences</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <code style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '2px 6px' }}>
                      {row.studentId}
                    </code>
                  </td>
                  <td style={{ fontWeight: '700' }}>{row.roll}</td>
                  <td style={{ fontWeight: '600', color: 'white' }}>{row.name}</td>
                  <td>
                    <span style={{ color: 'var(--color-present)', fontWeight: '600' }}>{row.present + row.late}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}> ({row.late} Late)</span>
                  </td>
                  <td style={{ color: 'var(--color-excused)', fontWeight: '600' }}>{row.excused}</td>
                  <td style={{ color: 'var(--color-absent)', fontWeight: '600' }}>{row.absent}</td>
                  <td>
                    <span 
                      className={`badge ${row.percentage >= 90 ? 'badge-active' : row.percentage >= 75 ? 'badge-active' : 'badge-inactive'}`}
                      style={{
                        backgroundColor: row.percentage >= 90 ? 'var(--color-present-glow)' : row.percentage >= 75 ? 'var(--color-late-glow)' : 'var(--color-absent-glow)',
                        color: row.percentage >= 90 ? 'var(--color-present)' : row.percentage >= 75 ? 'var(--color-late)' : 'var(--color-absent)'
                      }}
                    >
                      {row.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
