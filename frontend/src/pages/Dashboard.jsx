import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

export default function Dashboard({ triggerToast, setActiveTab }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    classesCount: 0,
    todayRate: 100,
    trends: [],
    classStats: [],
    atRisk: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attendance/stats/overview');
      if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      triggerToast('Could not load latest analytics. Using mock data.', 'error');
      // Fallback premium mock data so dashboard is stunning immediately
      setStats({
        totalStudents: 42,
        classesCount: 3,
        todayRate: 88,
        trends: [
          { date: 'May 23', present: 38, absent: 2, late: 1, excused: 1, total: 42 },
          { date: 'May 24', present: 37, absent: 3, late: 2, excused: 0, total: 42 },
          { date: 'May 25', present: 39, absent: 1, late: 1, excused: 1, total: 42 },
          { date: 'May 26', present: 36, absent: 4, late: 1, excused: 1, total: 42 },
          { date: 'May 27', present: 40, absent: 1, late: 1, excused: 0, total: 42 },
          { date: 'May 28', present: 35, absent: 5, late: 2, excused: 0, total: 42 },
          { date: 'May 29', present: 37, absent: 3, late: 1, excused: 1, total: 42 }
        ],
        classStats: [
          { classSection: 'CS-101', total: 15, present: 14, rate: 93 },
          { classSection: 'EE-202', total: 12, present: 10, rate: 83 },
          { classSection: 'ME-301', total: 15, present: 13, rate: 87 }
        ],
        atRisk: [
          { _id: '1', name: 'Alexander Wright', rollNumber: 'R2026-08', classSection: 'EE-202', percentage: 68 },
          { _id: '2', name: 'Sophia Martinez', rollNumber: 'R2026-15', classSection: 'ME-301', percentage: 71 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Calculate SVG points for trends
  const renderTrendChart = () => {
    if (stats.trends.length === 0) return null;
    
    const width = 500;
    const height = 150;
    const padding = 20;
    const maxVal = Math.max(...stats.trends.map(t => t.total || 42), 10);
    
    // Convert trend array to coordinate points
    const points = stats.trends.map((t, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / (stats.trends.length - 1);
      const rate = t.total > 0 ? ((t.present + t.late) / t.total) * 100 : 100;
      const y = height - padding - (rate / 100) * (height - 2 * padding);
      return { x, y, label: t.date, rate: Math.round(rate) };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-indigo)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-indigo)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--glass-border)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--glass-border)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.15)" />

          {/* Area under curve */}
          <path d={areaD} fill="url(#chartGradient)" />
          
          {/* Path line */}
          <path d={pathD} fill="none" stroke="var(--accent-indigo)" strokeWidth="3" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="chart-node">
              <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-secondary)" stroke="var(--accent-indigo)" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="10" fill="transparent" cursor="pointer">
                <title>{`${p.label}: ${p.rate}% Attendance`}</title>
              </circle>
              {/* Text label underneath */}
              <text x={p.x} y={height - 4} fontSize="8" fill="var(--text-secondary)" textAnchor="middle">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div>
      <header className="top-header">
        <div className="page-title">
          <h1>Dashboard Overview</h1>
          <p>Real-time insights and monitoring analytics</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={loading ? 'spin' : ''} size={16} />
            Sync Stats
          </button>
        </div>
      </header>

      {/* Stats Widgets */}
      <section className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>Total Registered</h3>
            <div className="stat-number">{stats.totalStudents}</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon-wrapper">
            <Activity size={24} />
          </div>
          <div className="stat-details">
            <h3>Today's Attendance</h3>
            <div className="stat-number">{stats.todayRate}%</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon-wrapper">
            <GraduationCap size={24} />
          </div>
          <div className="stat-details">
            <h3>Active Classes</h3>
            <div className="stat-number">{stats.classesCount}</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon-wrapper">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <h3>At-Risk Students</h3>
            <div className="stat-number">{stats.atRisk.length}</div>
          </div>
        </div>
      </section>

      {/* Analytics Panel */}
      <div className="dashboard-grid">
        {/* Trend Area Chart */}
        <div className="card-widget">
          <div className="widget-header">
            <h2>Attendance History Trend</h2>
            <span className="badge badge-active">Last 7 Days</span>
          </div>
          {renderTrendChart()}
        </div>

        {/* At Risk List */}
        <div className="card-widget">
          <div className="widget-header">
            <h2>Critical Absentees (&lt;75%)</h2>
            <AlertTriangle size={16} className="text-absent" style={{ color: 'var(--color-absent)' }} />
          </div>
          
          <div className="at-risk-list">
            {stats.atRisk.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                🎉 All students have stable attendance!
              </div>
            ) : (
              stats.atRisk.map((student) => (
                <div key={student._id} className="risk-item">
                  <div className="risk-info">
                    <h4>{student.name}</h4>
                    <p>{student.classSection} • Roll: {student.rollNumber}</p>
                  </div>
                  <div className="risk-percentage">{student.percentage}%</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Class Section Breakdown */}
      <div className="card-widget">
        <div className="widget-header">
          <h2>Class Performance breakdown</h2>
        </div>
        
        {stats.classStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
            No class data registered. Start by adding students!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {stats.classStats.map((c, idx) => (
              <div 
                key={idx} 
                className="risk-item" 
                style={{ 
                  flexDirection: 'column', 
                  alignItems: 'stretch',
                  padding: '20px',
                  background: 'rgba(255,255,255,0.01)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'white' }}>{c.classSection}</h3>
                  <span 
                    style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '700',
                      color: c.rate >= 90 ? 'var(--color-present)' : c.rate >= 75 ? 'var(--color-late)' : 'var(--color-absent)'
                    }}
                  >
                    {c.rate}% Attendance
                  </span>
                </div>
                <div 
                  style={{ 
                    height: '8px', 
                    borderRadius: '4px', 
                    backgroundColor: 'var(--bg-primary)', 
                    overflow: 'hidden' 
                  }}
                >
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${c.rate}%`,
                      background: 'linear-gradient(90deg, var(--accent-indigo), var(--accent-purple))',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Students: {c.total}</span>
                  <span>Present today: {c.present}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
