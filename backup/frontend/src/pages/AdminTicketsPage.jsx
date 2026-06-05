// src/pages/AdminTicketsPage.jsx
// ============================================================
// หน้า Admin — จัดการ Ticket ทั้งหมด
// ============================================================

import { useState }   from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAuth }    from '../context/AuthContext';
import TicketCard     from '../components/tickets/TicketCard';
import AppLayout      from '../components/common/AppLayout';

const FILTERS = [
  { value: '',            label: 'ทั้งหมด',        color: '#6b7280' },
  { value: 'OPEN',        label: 'รอรับงาน',       color: '#dc2626' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ', color: '#ea580c' },
  { value: 'RESOLVED',    label: 'เสร็จสิ้น',      color: '#16a34a' },
  { value: 'CANCELLED',   label: 'ยกเลิก',         color: '#9ca3af' },
];

export default function AdminTicketsPage() {
  const { isAdminOrSup } = useAuth();
  const navigate = useNavigate();
  const [status,  setStatus]  = useState('');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const LIMIT = 20;

  const { data, isLoading, isFetching } = useTickets({
    status:  status || undefined,
    search:  search || undefined,
    page,
    limit:   LIMIT,
  });

  const tickets    = data?.tickets    || [];
  const pagination = data?.pagination || {};

  return (
    <AppLayout title="รายการ Ticket">
      {/* ปุ่มแจ้งซ่อมสำหรับ Admin/Supervisor */}
      {isAdminOrSup && (
        <div style={{ marginBottom: 12 }}>
          <button className="btn btn-primary btn-full"
            onClick={() => navigate('/create')}>
            + แจ้งซ่อมใหม่
          </button>
        </div>
      )}
      {/* Top Nav */}

      {/* Search */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        marginBottom: 16, borderRadius: 'var(--radius)', padding: '12px 16px',
        boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--gray-400)', fontSize: '1rem' }}>🔍</span>
          <input
            className="form-control"
            placeholder="ค้นหา Ticket No. / ชื่อผู้แจ้ง / แผนก..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }}
          />
        </div>
        {/* Filter Chips — scrollable */}
        <div style={{
          display: 'flex', gap: 6,
          overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
        }}>
          {FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <button key={f.value}
                onClick={() => { setStatus(f.value); setPage(1); }}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap',
                  border: `1.5px solid ${active ? f.color : 'var(--border)'}`,
                  background: active ? f.color : 'white',
                  color: active ? 'white' : 'var(--gray-600)',
                  transition: 'all 0.15s',
                }}>
                {/* dot สีแทน emoji */}
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: active ? 'rgba(255,255,255,0.8)' : f.color,
                }} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket List */}
      <div>
        {/* Count — อยู่นอก grid */}
        {!isLoading && tickets.length > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginBottom: 10 }}>
            พบ <strong style={{ color: 'var(--gray-700)' }}>{pagination.total || 0}</strong> รายการ
            {status && <span> · สถานะ: {status}</span>}
            {search && <span> · ค้นหา: "{search}"</span>}
          </p>
        )}
        <div className="ticket-list-grid">

        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="skeleton skeleton-line" style={{ width: '30%', marginBottom: 8 }} />
              <div className="skeleton skeleton-line w-80" />
              <div className="skeleton skeleton-line" style={{ width: '50%', height: 10 }} />
            </div>
          ))
        ) : tickets.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-icon">🎫</div>
            <p className="empty-title">ไม่พบ Ticket</p>
            <p className="empty-desc">
              {search ? `ไม่พบ "${search}"` : 'ยังไม่มี Ticket ในสถานะที่เลือก'}
            </p>
          </div>
        ) : (
          tickets.map((t, i) => (
            <TicketCard key={t.id} ticket={t} showUser
              className={`animate-fadeInUp stagger-${Math.min(i+1,4)}`} />
          ))
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}>
              ← ก่อน
            </button>
            <span style={{ padding: '6px 12px', fontSize: '0.82rem', color: 'var(--gray-500)' }}>
              {page} / {pagination.totalPages}
            </span>
            <button className="btn btn-outline btn-sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}>
              ถัดไป →
            </button>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}