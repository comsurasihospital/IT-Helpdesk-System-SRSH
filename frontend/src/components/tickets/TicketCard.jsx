import { Link } from 'react-router-dom';

const STATUS_LABEL = {
  OPEN:        'แจ้งซ่อม',
  IN_PROGRESS: 'กำลังดำเนินการ',
  RESOLVED:    'เสร็จสิ้น',
  CANCELLED:   'ยกเลิก',
};

const STATUS_DOT = {
  OPEN:        { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  IN_PROGRESS: { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  RESOLVED:    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  CANCELLED:   { color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
};

const CAT_ICON = {
  SOFTWARE: '💻', PRINTER: '🖨️', COMPUTER: '🖥️',
  NETWORK: '🌐', INFO_REQ: '📊', PUBLISH: '📢',
};

const SLA_MINS = { SOFTWARE: 30, PRINTER: 30, COMPUTER: 30, NETWORK: 20, INFO_REQ: 1440, PUBLISH: 1440 };

const formatDate = (d) => d
  ? new Date(d).toLocaleString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '-';

const displayName = (t) => {
  if (t.reporter_name) {
    const prefix = t.reporter_prefix_name || '';
    return prefix ? `${prefix} ${t.reporter_name}` : t.reporter_name;
  }
  return t.user_name || '-';
};
const displayDept = (t) => t.reporter_department_name || t.department_name || '-';

export default function TicketCard({ ticket: t, showUser = false, className = '' }) {
  if (!t) return null;
  const status  = t.status || 'OPEN';
  const dot     = STATUS_DOT[status] || STATUS_DOT.OPEN;
  const slaType = t.sla_type || t.category_code || '';
  const slaMins = SLA_MINS[slaType];
  const slaTime = slaMins >= 1440 ? `${slaMins/1440} วัน` : slaMins >= 60 ? `${slaMins/60} ชม.` : `${slaMins} นาที`;
  const icon    = CAT_ICON[slaType] || '🔧';

  return (
    <Link to={`/tickets/${t.id}`} className={`ticket-card status-${status} ${className}`}
      style={{ display: 'block', textDecoration: 'none', position: 'relative',
        overflow: 'hidden', borderRadius: 14, padding: '14px 14px 12px 18px',
        background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        border: '1px solid var(--gray-100)',
      }}>

      {/* แถบสีซ้าย */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
        background: dot.color,
      }} />

      {/* Row 1: ticket_no + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 600, letterSpacing: '0.03em' }}>
          {t.ticket_no}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
          background: dot.bg, color: dot.color, border: `1px solid ${dot.border}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot.color, flexShrink: 0 }} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Row 2: icon + category + SLA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
          {t.category_name || '-'}
        </span>
        {slaMins && (
          <span style={{
            fontSize: '0.65rem', color: 'var(--gray-400)',
            background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
            borderRadius: 10, padding: '1px 7px', marginLeft: 'auto', whiteSpace: 'nowrap',
          }}>
            SLA {slaTime}
          </span>
        )}
      </div>

      {/* Row 3: description */}
      {t.description && (
        <p style={{
          fontSize: '0.82rem', color: 'var(--gray-600)', lineHeight: 1.5,
          marginBottom: 10, fontWeight: 500,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {t.description}
        </p>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--gray-100)', marginBottom: 8 }} />

      {/* Row 5: ผู้แจ้ง + แผนก */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          {displayName(t)}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', color: 'var(--gray-500)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          {displayDept(t)}
        </span>
      </div>

      {/* Row 6: วันที่ + ปิดงานโดย + SLA breach */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {status === 'RESOLVED' && t.admin_name && (
            <span style={{ fontSize: '0.68rem', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              ปิดโดย {t.admin_name}
            </span>
          )}
          {t.sla_status === 'BREACHED' && (
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              ⚠️ เกิน SLA
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--gray-400)' }}>
          {formatDate(t.opened_at)}
        </span>
      </div>
    </Link>
  );
}