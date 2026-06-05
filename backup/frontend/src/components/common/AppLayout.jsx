import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useIsDesktop } from '../../hooks/useBreakpoint';

function Sidebar({ items, user }) {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'white',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 'var(--nav-h)',
      height: 'calc(100vh - var(--nav-h))',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>🏥 IT Helpdesk</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 2 }}>Fort Surasi Hospital</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/' || item.to === '/admin/tickets'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10,
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
              transition: 'all 0.15s',
              background: isActive ? 'var(--primary-50)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--gray-600)',
            })}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--gray-50)', flexShrink: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-700)' }}>
            {user.firstName || user.first_name} {user.lastName || user.last_name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 2 }}>
            {user.role === 'ADMIN' ? '👨‍💻 เจ้าหน้าที่ IT'
           : user.role === 'SUPERVISOR' ? '👔 ผู้บริหาร'
           : '👤 ผู้ใช้งาน'}
          </div>
        </div>
      )}
    </aside>
  );
}

function BottomNav({ items }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--bottom-nav-h)',
      background: 'white',
      borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 100,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
    }}>
      {items.map(item => (
        <NavLink key={item.to} to={item.to} end={item.to === '/' || item.to === '/admin/tickets'}
          style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, textDecoration: 'none', fontSize: '0.65rem', fontWeight: 500,
            color: isActive ? 'var(--primary)' : 'var(--gray-400)',
            transition: 'color 0.15s',
          })}>
          <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout({ children, title, showBack, onBack }) {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const navItems = user?.role === 'USER' ? [
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

  if (isDesktop) {
    return (
      /* ── ครอบทั้งหน้า เต็มจอ ── */
      <div style={{
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', width: '100%',
        background: 'var(--bg)',
      }}>
        {/* Top bar — เต็มความกว้างจอ */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: 'var(--nav-h)', background: 'white',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12,
          boxShadow: 'var(--shadow-sm)',
          width: '100%',
        }}>
          {showBack && (
            <button onClick={onBack} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: 'none', background: 'var(--gray-100)',
              cursor: 'pointer', fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>←</button>
          )}
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)' }}>{title}</span>
        </header>

        {/* Body — sidebar + content เต็ม viewport */}
        <div style={{
          display: 'flex', flex: 1,
          width: '100%',
          /* ความสูงที่เหลือหลังจาก header */
          minHeight: 'calc(100vh - var(--nav-h))',
        }}>
          <Sidebar items={navItems} user={user} />

          {/* main ต้อง min-width:0 เพื่อให้ flex child ขยายเต็ม */}
          <main style={{
            flex: 1, minWidth: 0,
            padding: '24px 32px',
            overflowY: 'auto',
          }}>
            {children}
            <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.62rem', padding: '24px 0 8px' }}>
              {process.env.REACT_APP_FOOTER_TEXT || 'พัฒนาโดย ศูนย์เทคโนโลยีสารสนเทศ'}
            </p>
          </main>
        </div>
      </div>
    );
  }

  /* ── Mobile ── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 'var(--nav-h)', background: 'white',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12,
        boxShadow: 'var(--shadow-sm)',
      }}>
        {showBack && (
          <button onClick={onBack} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: 'none', background: 'var(--gray-100)',
            cursor: 'pointer', fontSize: '1.2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
        )}
        <span style={{ flex: 1, fontSize: '1rem', fontWeight: 600, color: 'var(--gray-800)' }}>{title}</span>
      </header>

      <div style={{ padding: '16px 16px calc(var(--bottom-nav-h) + 16px)' }}>
        {children}
        <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.62rem', padding: '8px 0 4px' }}>
          {process.env.REACT_APP_FOOTER_TEXT || 'พัฒนาโดย ศูนย์เทคโนโลยีสารสนเทศ'}
        </p>
      </div>

      <BottomNav items={navItems} />
    </div>
  );
}