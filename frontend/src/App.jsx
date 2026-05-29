import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CalendarCheck, FileText, Clock, Menu } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState('Checking...');
  
  // Toast notifications state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ping backend to check connection status
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setDbStatus('Connected');
      } else {
        setDbStatus('Degraded');
      }
    } catch (err) {
      setDbStatus('Offline');
    }
  };

  useEffect(() => {
    checkHealth();
    // Re-check status every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    // Hide toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard triggerToast={triggerToast} setActiveTab={setActiveTab} />;
      case 'students':
        return <Students triggerToast={triggerToast} />;
      case 'attendance':
        return <Attendance triggerToast={triggerToast} />;
      case 'reports':
        return <Reports triggerToast={triggerToast} />;
      default:
        return <Dashboard triggerToast={triggerToast} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Toast Banner */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-content">
            <span style={{ fontWeight: '600' }}>
              {toast.type === 'success' ? '✅ Success' : '⚠️ Alert'}
            </span>
            <p style={{ fontSize: '0.85rem', marginTop: '2px', color: 'white' }}>{toast.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <div className="logo-icon">SA</div>
          <span className="logo-text">Smart Attendance</span>
        </div>

        <nav className="nav-links">
          <li 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </li>
          <li 
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
          >
            <Users size={18} />
            Student Database
          </li>
          <li 
            className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
          >
            <CalendarCheck size={18} />
            Daily Attendance
          </li>
          <li 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
          >
            <FileText size={18} />
            Reports & Export
          </li>
        </nav>

        <footer className="sidebar-footer">
          <div className="system-status" style={{ marginBottom: '10px' }}>
            <Clock size={14} />
            <span>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="system-status">
            <div 
              className="status-dot" 
              style={{ 
                backgroundColor: dbStatus === 'Connected' ? 'var(--color-present)' : dbStatus === 'Checking...' ? 'var(--color-late)' : 'var(--color-absent)',
                boxShadow: `0 0 8px ${dbStatus === 'Connected' ? 'var(--color-present)' : dbStatus === 'Checking...' ? 'var(--color-late)' : 'var(--color-absent)'}`
              }}
            />
            <span>API: {dbStatus}</span>
          </div>
        </footer>
      </aside>

      {/* Main Panel Viewport */}
      <main className="main-content">
        {/* Mobile Header Toggle */}
        <div className="mobile-toggle" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="btn-icon-only" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={20} />
          </button>
          <span className="logo-text" style={{ fontSize: '1rem', fontWeight: '800' }}>Smart Attendance</span>
        </div>

        {renderActivePage()}

        {/* Global Footer */}
        <footer className="app-footer">
          <p>© 2026 Smart Attendance System • MERN Stack Senior Edition</p>
        </footer>
      </main>
    </div>
  );
}
