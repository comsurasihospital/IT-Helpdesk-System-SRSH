import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();

  const items = user?.role === 'USER' ? [
    { to: '/',        icon: '🏠', label: 'หน้าหลัก' },
    { to: '/create',  icon: '➕', label: 'แจ้งซ่อม' },
    { to: '/profile', icon: '👤', label: 'โปรไฟล์' },
  ] : user?.role === 'ADMIN' ? [
    { to: '/admin/tickets', icon: '🎫', label: 'Ticket' },
    { to: '/dashboard',     icon: '📊', label: 'Dashboard' },
    { to: '/profile',       icon: '👤', label: 'โปรไฟล์' },
  ] : [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/profile',   icon: '👤', label: 'โปรไฟล์' },
  ];

  return (
    <nav className="bottom-nav">
      {/* Logo — desktop sidebar only */}
      <div className="desktop-only" style={{
        padding: '8px 16px 20px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 8,
        flexDirection: 'column',
        gap: 2,
      }}>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>🏥 IT Helpdesk</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Fort Surasi Hospital</span>
      </div>

      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      {/* User info — desktop sidebar only */}
      {user && (
        <div className="desktop-only" style={{
          marginTop: 'auto',
          padding: '16px',
          borderTop: '1px solid var(--border)',
          flexDirection: 'column',
          gap: 4,
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)' }}>
            {user.firstName || user.first_name} {user.lastName || user.last_name}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>
            {user.role === 'ADMIN' ? 'เจ้าหน้าที่ IT' : user.role === 'SUPERVISOR' ? 'ผู้บริหาร' : 'ผู้ใช้งาน'}
          </span>
        </div>
      )}
    </nav>
  );
}