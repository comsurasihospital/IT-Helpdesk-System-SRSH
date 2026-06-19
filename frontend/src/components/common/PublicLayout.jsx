// src/components/common/PublicLayout.jsx
import { useEffect } from 'react';

export default function PublicLayout({ children, title }) {

  useEffect(() => {
    // Override viewport สำหรับ public dashboard เท่านั้น
    // ให้ browser คอมแสดงผลตามขนาดจอจริง
    const vp = document.querySelector('meta[name="viewport"]');
    const original = vp?.getAttribute('content');
    if (vp) {
      vp.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }
    // Cleanup — คืนค่าเดิมเมื่อออกจากหน้านี้
    return () => {
      if (vp && original) vp.setAttribute('content', original);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #f8fafc)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white',
        borderBottom: '1px solid var(--border, #e5e7eb)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          height: 52, padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: '1.1rem' }}>🏥</span>
          <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-800, #1f2937)' }}>
            {title || 'SRSH IT Helpdesk Dashboard'}
          </span>
          <span style={{
            fontSize: '0.7rem', padding: '2px 10px', borderRadius: 20,
            background: '#f0fdf4', color: '#16a34a',
            border: '1px solid #bbf7d0', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            Public View
          </span>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      <footer style={{
        textAlign: 'center', fontSize: '0.68rem',
        color: 'var(--gray-400, #9ca3af)',
        padding: '10px 16px',
        borderTop: '1px solid var(--border, #e5e7eb)',
        background: 'white',
      }}>
        {process.env.REACT_APP_FOOTER_TEXT || 'พัฒนาโดย ศูนย์เทคโนโลยีสารสนเทศ โรงพยาบาลค่ายสุรสีห์'}
      </footer>
    </div>
  );
}