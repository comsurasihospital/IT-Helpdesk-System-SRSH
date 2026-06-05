// src/pages/HomePage.jsx
// ============================================================
// หน้าหลัก — USER: ดู Ticket ของตัวเอง + สถิติ
// ============================================================

import { useState }      from 'react';
import { Link }          from 'react-router-dom';
import { useAuth }       from '../context/AuthContext';
import { useTickets }    from '../hooks/useTickets';
import TicketCard        from '../components/tickets/TicketCard';
import AppLayout from '../components/common/AppLayout';
import { fromNow }       from '../utils';

const STATUS_FILTERS = [
  { value: '',            label: 'ทั้งหมด',        color: '#6b7280' },
  { value: 'OPEN',        label: 'แจ้งซ่อม',       color: '#dc2626' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ', color: '#ea580c' },
  { value: 'RESOLVED',    label: 'เสร็จสิ้น',      color: '#16a34a' },
  { value: 'CANCELLED',   label: 'ยกเลิก',         color: '#9ca3af' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useTickets({ status: statusFilter || undefined, limit: 50 });
  const tickets = data?.tickets || [];

  // คำนวณ stat summary
  const allTickets = useTickets({ limit: 999 });
  const all = allTickets.data?.tickets || [];
  const stats = {
    total:   all.length,
    open:    all.filter(t => t.status === 'OPEN').length,
    prog:    all.filter(t => t.status === 'IN_PROGRESS').length,
    done:    all.filter(t => t.status === 'RESOLVED').length,
  };

  return (
    <AppLayout title="หน้าหลัก">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
        padding: '48px 20px 24px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', overflow: 'hidden',
          }}>
            {user?.linePictureUrl
              ? <img src={user.linePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '👤'}
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', opacity: 0.8 }}>สวัสดี</p>
            <p style={{ fontSize: '1rem', fontWeight: 700 }}>
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Link to="/create" style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white', borderRadius: 20,
              padding: '6px 14px', fontSize: '0.8rem',
              fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              + แจ้งซ่อม
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'ทั้งหมด', val: stats.total,  color: 'rgba(255,255,255,0.25)' },
            { label: 'แจ้งซ่อม', val: stats.open,  color: 'rgba(239,68,68,0.4)' },
            { label: 'กำลังแก้', val: stats.prog,  color: 'rgba(234,88,12,0.4)' },
            { label: 'เสร็จแล้ว', val: stats.done, color: 'rgba(22,163,74,0.4)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.color, borderRadius: 12,
              padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ padding: '16px 16px 0' }}>
        <div className="filter-bar">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <button key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap',
                  border: `1.5px solid ${active ? f.color : 'var(--border)'}`,
                  background: active ? f.color : 'white',
                  color: active ? 'white' : 'var(--gray-600)',
                  transition: 'all 0.15s',
                }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: active ? 'rgba(255,255,255,0.8)' : f.color,
                }} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket List */}
      <div style={{ padding: '12px 16px 80px' }}>
        <div className="ticket-list-grid">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton skeleton-line w-60" />
                <div className="skeleton skeleton-line w-80" />
                <div className="skeleton skeleton-line" style={{ height: 10, width: '40%' }} />
              </div>
            ))
          ) : tickets.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 40 }}>
              <div className="empty-icon">🎫</div>
              <p className="empty-title">ยังไม่มี Ticket</p>
              <p className="empty-desc">กดปุ่ม "แจ้งซ่อม" เพื่อสร้าง Ticket ใหม่</p>
              <Link to="/create" className="btn btn-primary" style={{ marginTop: 16 }}>
                + แจ้งซ่อมใหม่
              </Link>
            </div>
          ) : (
            tickets.map((t, i) => (
              <TicketCard key={t.id} ticket={t}
                className={`animate-fadeInUp stagger-${Math.min(i + 1, 4)}`} />
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <Link to="/create" className="fab" title="แจ้งซ่อมใหม่">＋</Link>
    </AppLayout>
  );
}