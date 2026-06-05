// src/pages/TicketDetailPage.jsx
// ============================================================
// หน้ารายละเอียด Ticket + Action Buttons + Rating
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket, useAcceptTicket, useResolveTicket,
         useCancelTicket, useRateTicket, useAddComment,
         useEditTicket, useEditResolved } from '../hooks/useTickets';
import { useQuery }        from 'react-query';
import { useAuth }         from '../context/AuthContext';
import { ticketAPI }       from '../api/services';
import AppLayout           from '../components/common/AppLayout';
import { useForm }         from 'react-hook-form';
// ── Inline constants (ไม่ import จาก utils เพื่อป้องกัน undefined) ──
const STATUS_LABEL = { OPEN: 'แจ้งซ่อม', IN_PROGRESS: 'กำลังดำเนินการ', RESOLVED: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก' };
const STATUS_COLOR = { OPEN: '#dc2626', IN_PROGRESS: '#ea580c', RESOLVED: '#16a34a', CANCELLED: '#9ca3af' };
const SLA_STATUS_LABEL = { ON_TIME: '✅ ทันเวลา', BREACHED: '⚠️ เกิน SLA', PENDING: '' };
const getSlaColor = (s) => s === 'BREACHED' ? 'var(--status-open)' : s === 'ON_TIME' ? 'var(--status-resolved)' : 'var(--gray-400)';
const getBaseUrl = () => {
  const api = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return api.replace(/\/api$/, '');
};
const getImageUrl = (p) => p ? (p.startsWith('http') ? p : `${getBaseUrl()}/${p}`) : '';
const formatDate = (d) => d ? new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
const fromNow = (d) => {
  if (!d) return '-';
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'เมื่อกี้';
  if (min < 60) return min + ' นาทีที่แล้ว';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' ชั่วโมงที่แล้ว';
  const day = Math.floor(hr / 24);
  if (day < 30) return day + ' วันที่แล้ว';
  return new Date(d).toLocaleDateString('th-TH');
};
import toast               from 'react-hot-toast';

// แปลง Date เป็น string สำหรับ input[type=datetime-local]
const toLocalDatetimeInput = (d) => {
  const dt = d ? new Date(d) : new Date();
  // offset เป็น +07:00
  const offset = 7 * 60;
  const local  = new Date(dt.getTime() + offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function TicketDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const { data: ticket, isLoading, isError } = useTicket(id);
  const acceptMut     = useAcceptTicket();
  const resolveMut    = useResolveTicket();
  const cancelMut     = useCancelTicket();
  const rateMut       = useRateTicket();
  const commentMut    = useAddComment();
  const editMut       = useEditTicket();
  const editResMut    = useEditResolved();

  const [showEdit,    setShowEdit]    = useState(false);
  const [showEditRes, setShowEditRes] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showRate,    setShowRate]    = useState(false);
  const [hoverStar,   setHoverStar]   = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [showImages,  setShowImages]  = useState(false);
  const [activeImg,   setActiveImg]   = useState(0);

  // ── ดึง categories จาก API ──
  const { data: categories = [] } = useQuery(
    'categories',
    () => ticketAPI.getCategories().then(r => r.data.data),
    { staleTime: 300000 }
  );
  const formatSlaMins = (mins) => mins >= 1440 ? `${mins/1440} วัน` : mins >= 60 ? `${mins/60} ชม.` : `${mins} นาที`;

  // default ค่า resolve form ทุกครั้งที่ ticket โหลด / popup เปิด
  useEffect(() => {
    if (ticket && showResolve) {
      resetResolve({
        acceptedAt:     toLocalDatetimeInput(ticket.accepted_at || new Date()),
        resolvedAt:     toLocalDatetimeInput(new Date()),
        slaType:        ticket.category_code || '',
        rootCause:      '',
        resolutionNote: '',
      });
    }
  }, [ticket, showResolve]); // eslint-disable-line

  const { register: regComment, handleSubmit: handleComment, reset: resetComment } = useForm();
  const { register: regResolve, handleSubmit: handleResolve,
          reset: resetResolve,
          formState: { errors: resolveErrors } } = useForm();
  const { register: regRating,  handleSubmit: handleRating } = useForm();
  const { register: regEdit,    handleSubmit: handleEdit,    reset: resetEdit }    = useForm();
  const { register: regEditRes, handleSubmit: handleEditRes, reset: resetEditRes } = useForm();

  useEffect(() => {
    if (isError) {
      toast.error('ไม่พบ Ticket หรือถูกลบไปแล้ว');
      navigate('/', { replace: true });
    }
  }, [isError, navigate]);

  if (isLoading) return (
    <AppLayout title="รายละเอียด" showBack onBack={() => navigate(-1)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="card"><div className="skeleton skeleton-line w-80" /><div className="skeleton skeleton-line" /></div>
        ))}
      </div>
    </AppLayout>
  );

  if (!ticket) return null;

  const canAccept  = isAdmin && ticket.status === 'OPEN';
  const canResolve = isAdmin && ticket.status === 'IN_PROGRESS';
  const canCancel  = ticket.status !== 'RESOLVED' && ticket.status !== 'CANCELLED';
  const canRate    = ticket.status === 'RESOLVED' && !ticket.satisfaction_score
                     && user?.id === ticket.user_id;

  const onSubmitResolve = async (data) => {
    await resolveMut.mutateAsync({ id, data });
    setShowResolve(false);
  };

  const onSubmitRate = async () => {
    if (!selectedStar) { toast.error('กรุณาเลือกคะแนน'); return; }
    await rateMut.mutateAsync({ id, data: { score: selectedStar } });
    setShowRate(false);
  };

  const onSubmitComment = async (data) => {
    await commentMut.mutateAsync({ id, data: { comment: data.comment } });
    resetComment();
  };

  return (
    <AppLayout title={ticket.ticket_no} showBack onBack={() => navigate(-1)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Status Banner */}
        <div className={`card`} style={{
          background: ticket.status === 'OPEN'        ? 'var(--status-open-bg)'
                    : ticket.status === 'IN_PROGRESS' ? 'var(--status-progress-bg)'
                    : ticket.status === 'RESOLVED'    ? 'var(--status-resolved-bg)'
                    : 'var(--gray-50)',
          border: 'none',
          borderLeft: `4px solid ${
            ticket.status === 'OPEN'        ? 'var(--status-open)'
          : ticket.status === 'IN_PROGRESS' ? 'var(--status-progress)'
          : ticket.status === 'RESOLVED'    ? 'var(--status-resolved)'
          : 'var(--gray-400)'}`,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={`badge badge-${ticket.status}`}>
              <span style={{width:8,height:8,borderRadius:'50%',background:STATUS_COLOR[ticket.status],display:'inline-block',marginRight:4,flexShrink:0}} />
              {STATUS_LABEL[ticket.status]}
            </span>
            <span style={{
              fontSize: '0.7rem',
              color: getSlaColor(ticket.sla_status),
              fontWeight: 600,
            }}>
              {SLA_STATUS_LABEL[ticket.sla_status]}
            </span>
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 700, marginTop: 8, color: 'var(--gray-800)' }}>
            {ticket.title}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: 4 }}>
            {fromNow(ticket.opened_at)}
          </p>
        </div>

        {/* Info Card */}
        <div className="card">
          <p className="card-title">ข้อมูลการแจ้งซ่อม</p>
          <div className="divider" style={{ margin: '8px 0' }} />
          {[
            ['👤 ผู้แจ้ง',    ticket.reporter_name
                              ? `${ticket.reporter_prefix_name || ''} ${ticket.reporter_name}`.trim()
                              : ticket.user_name],
            ['📞 เบอร์โทร',   ticket.reporter_phone || ticket.user_phone || '-'],
            ['🏢 แผนก',      ticket.reporter_department_name || ticket.department_name],
            ['📂 ประเภท',    ticket.category_name],
            ['📅 วันที่แจ้ง', formatDate(ticket.opened_at)],
            ticket.accepted_at && ['⏱ รับงานเมื่อ', formatDate(ticket.accepted_at)],
            ticket.resolved_at && ['✅ ปิดงานเมื่อ',  formatDate(ticket.resolved_at)],
            ticket.assigned_to && ['👨‍💻 ผู้รับงาน', ticket.admin_name],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: '1px solid var(--gray-100)',
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{label}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--gray-800)', textAlign: 'right', maxWidth: '60%' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="card">
          <p className="card-title">รายละเอียดปัญหา</p>
          <div className="divider" style={{ margin: '8px 0' }} />
          <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </p>
        </div>

        {/* Attachments */}
        {ticket.attachments?.length > 0 && (
          <div className="card">
            <p className="card-title">รูปภาพแนบ ({ticket.attachments.length} รูป)</p>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="image-preview-grid">
              {ticket.attachments.map((att, i) => (
                <div key={att.id} className="image-preview-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setActiveImg(i); setShowImages(true); }}>
                  <img src={getImageUrl(att.file_path)} alt="" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Note (if resolved) */}
        {ticket.resolution_note && (
          <div className="card" style={{ background: 'var(--status-resolved-bg)', border: '1px solid var(--status-resolved-border)' }}>
            <p className="card-title" style={{ color: 'var(--status-resolved)' }}>✅ ผลการแก้ไข</p>
            <div className="divider" style={{ margin: '8px 0', background: 'var(--status-resolved-border)' }} />
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
              {ticket.resolution_note}
            </p>
          </div>
        )}

        {/* Satisfaction */}
        {ticket.satisfaction_score && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="card-title">คะแนนความพึงพอใจ</p>
            <div style={{ fontSize: '2rem', margin: '8px 0' }}>
              {'⭐'.repeat(ticket.satisfaction_score)}{'☆'.repeat(5 - ticket.satisfaction_score)}
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>
              {ticket.satisfaction_score}/5
            </p>
          </div>
        )}

        {/* Timeline */}
        {ticket.logs?.length > 0 && (
          <div className="card">
            <p className="card-title">ประวัติ Timeline</p>
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="timeline" style={{ marginTop: 8 }}>
              {(() => {
                // 1. กรองเฉพาะ log ที่ต้องการแสดง (ไม่เอา EDITED)
                const show = ['TICKET_CREATED', 'STATUS_CHANGE', 'RATED'];
                const filtered = ticket.logs.filter(l => show.includes(l.action));

                // 2. กรอง IN_PROGRESS ซ้ำ เก็บแค่อัน id สูงสุด
                const lastAcceptId = [...filtered].sort((a,b)=>b.id-a.id).find(l => l.to_status === 'IN_PROGRESS')?.id;
                const deduped = filtered.filter(l => l.to_status !== 'IN_PROGRESS' || l.id === lastAcceptId);

                // 3. เรียงตาม logic ของ status (ไม่ใช้ timestamp เพราะอาจผิดพลาด)
                const ORDER = { 'TICKET_CREATED': 0, 'IN_PROGRESS': 1, 'RESOLVED': 2, 'CANCELLED': 2, 'RATED': 3 };
                const getOrder = (l) => {
                  if (l.action === 'TICKET_CREATED') return 0;
                  if (l.action === 'RATED') return 3;
                  return ORDER[l.to_status] ?? 1;
                };
                const final = [...deduped].sort((a, b) => getOrder(a) - getOrder(b));

                return final;
              })().map((log, i, arr) => {
                const isCreate  = log.action === 'TICKET_CREATED';
                const isAccept  = log.action === 'STATUS_CHANGE' && log.to_status === 'IN_PROGRESS';
                const isResolve = log.action === 'STATUS_CHANGE' && log.to_status === 'RESOLVED';
                const isRated   = log.action === 'RATED';
                const showTime  = true; // แสดงเวลาทุก event

                const statusColor =
                  log.to_status === 'IN_PROGRESS' ? '#ea580c'
                : log.to_status === 'RESOLVED'    ? '#16a34a'
                : log.to_status === 'CANCELLED'   ? '#9ca3af'
                : '#dc2626'; // OPEN หรือ TICKET_CREATED

                const dotLabel = isCreate  ? { color: '#dc2626', text: 'แจ้งซ่อม' }
                               : isRated   ? { color: '#f59e0b', text: `ให้คะแนน: ${log.note}` }
                               : { color: statusColor, text: STATUS_LABEL[log.to_status] || log.to_status };

                return (
                  <div key={log.id} className={`timeline-item ${i === arr.length - 1 ? 'active' : ''}`}>
                    {showTime && (
                      <p className="timeline-time" style={{ fontWeight: isResolve ? 600 : 400 }}>
                        {formatDate(log.created_at)}
                      </p>
                    )}
                    <p className="timeline-text">
                      <span className="timeline-actor">{log.actor_name}</span>
                      {' '}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: dotLabel.color,
                          display: 'inline-block', flexShrink: 0,
                        }} />
                        {dotLabel.text}
                      </span>
                    </p>
                    {isResolve && log.note && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: 6, lineHeight: 1.8 }}>
                        {log.note.split('\n').map((line, i) => {
                          if (line.startsWith('สาเหตุ:')) return (
                            <p key={i}>
                              <span style={{ color: '#dc2626', fontWeight: 700 }}>สาเหตุ:</span>
                              <span>{line.replace('สาเหตุ:', '')}</span>
                            </p>
                          );
                          if (line.startsWith('วิธีแก้ไข:')) return (
                            <p key={i}>
                              <span style={{ color: '#16a34a', fontWeight: 700 }}>วิธีแก้ไข:</span>
                              <span>{line.replace('วิธีแก้ไข:', '')}</span>
                            </p>
                          );
                          return <p key={i}>{line}</p>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments */}
        {ticket.comments?.length > 0 && (
          <div className="card">
            <p className="card-title">ความคิดเห็น</p>
            <div className="divider" style={{ margin: '8px 0' }} />
            {ticket.comments.map((c) => (
              <div key={c.id} style={{
                padding: '10px 0', borderBottom: '1px solid var(--gray-100)',
                display: 'flex', gap: 10,
              }}>
                <div className="avatar avatar-sm">
                  {c.user_name?.[0] || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.user_name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{fromNow(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>{c.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment */}
        <form className="card" onSubmit={handleComment(onSubmitComment)}>
          <p className="card-title">เพิ่มความคิดเห็น</p>
          <div className="divider" style={{ margin: '8px 0' }} />
          <textarea
            className="form-control"
            rows={2}
            placeholder="พิมพ์ความคิดเห็น..."
            {...regComment('comment', { required: true })}
          />
          <button type="submit" className="btn btn-outline btn-full" style={{ marginTop: 8 }}
            disabled={commentMut.isLoading}>
            ส่งความคิดเห็น
          </button>
        </form>

        {/* ─── Action Buttons ──────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>

          {/* Admin: Accept */}
          {canAccept && (
            <button className="btn btn-primary btn-full btn-lg"
              onClick={() => acceptMut.mutate(id)}
              disabled={acceptMut.isLoading}>
              {acceptMut.isLoading ? '⏳ กำลังรับงาน...' : '✋ รับงานนี้'}
            </button>
          )}

          {/* Admin: Resolve */}
          {canResolve && (
            <button className="btn btn-success btn-full btn-lg"
              onClick={() => setShowResolve(true)}>
              ✅ ปิดงาน / แก้ไขเสร็จแล้ว
            </button>
          )}

          {/* User: แก้ไข Ticket (ก่อนปิดงาน) */}
          {user?.id === ticket.user_id && ['OPEN','IN_PROGRESS'].includes(ticket.status) && (
            <button className="btn btn-outline btn-full"
              onClick={() => { resetEdit({ description: ticket.description }); setShowEdit(true); }}>
              ✏️ แก้ไขรายละเอียด
            </button>
          )}

          {/* Admin: แก้ไขหลังปิดงาน */}
          {isAdmin && ticket.status === 'RESOLVED' && (
            <button className="btn btn-outline btn-full"
              onClick={() => { resetEditRes((() => {
                  const note = ticket.resolution_note || '';
                  const parts = note.split('\nวิธีแก้ไข:');
                  const causePart = parts[0].replace('สาเหตุ:', '').trim();
                  const fixPart   = parts[1] ? parts[1].trim() : '';
                  return {
                    acceptedAt:     toLocalDatetimeInput(ticket.accepted_at || new Date()),
                    resolvedAt:     toLocalDatetimeInput(ticket.resolved_at || new Date()),
                    description:    ticket.description || '',
                    rootCause:      causePart,
                    resolutionNote: fixPart || note,
                  };
                })()); setShowEditRes(true); }}>
              ✏️ แก้ไขข้อมูลการปิดงาน
            </button>
          )}

          {/* User: Rate */}
          {canRate && (
            <button className="btn btn-primary btn-full btn-lg"
              style={{ background: '#f59e0b', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}
              onClick={() => setShowRate(true)}>
              ⭐ ให้คะแนนความพึงพอใจ
            </button>
          )}

          {/* Cancel */}
          {canCancel && (
            <button className="btn btn-ghost btn-full"
              style={{ color: 'var(--status-open)', border: '1px solid var(--status-open-border)' }}
              onClick={() => {
                if (window.confirm('ต้องการยกเลิก Ticket นี้?')) {
                  cancelMut.mutate({ id, data: {} });
                }
              }}
              disabled={cancelMut.isLoading}>
              ยกเลิก Ticket
            </button>
          )}
        </div>

      </div>

      {/* ─── Bottom Sheet: Resolve ────────────────────── */}
      {showResolve && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowResolve(false)}>
          <div className="bottom-sheet" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>ปิดงาน</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: 16 }}>
              กรุณากรอกข้อมูลให้ครบก่อนปิดงาน
            </p>
            <form onSubmit={handleResolve(onSubmitResolve)}>

              {/* 1. วัน/เวลา รับงาน */}
              <div className="form-group">
                <label className="form-label">วันที่/เวลา รับงาน <span className="required">*</span></label>
                <input type="datetime-local"
                  className={`form-control ${resolveErrors.acceptedAt ? 'error' : ''}`}
                  {...regResolve('acceptedAt', { required: 'กรุณากรอกวันที่รับงาน' })}
                />
                {resolveErrors.acceptedAt && <p className="form-error">{resolveErrors.acceptedAt.message}</p>}
              </div>

              {/* 2. วัน/เวลา ปิดงาน */}
              <div className="form-group">
                <label className="form-label">วันที่/เวลา ปิดงาน <span className="required">*</span></label>
                <input type="datetime-local"
                  className={`form-control ${resolveErrors.resolvedAt ? 'error' : ''}`}
                  {...regResolve('resolvedAt', { required: 'กรุณากรอกวันที่ปิดงาน' })}
                />
                {resolveErrors.resolvedAt && <p className="form-error">{resolveErrors.resolvedAt.message}</p>}
              </div>

              {/* 3. SLA */}
              <div className="form-group">
                <label className="form-label">ประเภทงาน (SLA) <span className="required">*</span></label>
                <select className={`form-control ${resolveErrors.slaType ? 'error' : ''}`}
                  {...regResolve('slaType', { required: 'กรุณาเลือกประเภทงาน' })}>
                  <option value="">— เลือกประเภทงาน —</option>
                  {categories.map(o => (
                    <option key={o.code} value={o.code}>{o.name} (SLA {formatSlaMins(o.sla_minutes)})</option>
                  ))}
                </select>
                {resolveErrors.slaType && <p className="form-error">{resolveErrors.slaType.message}</p>}
              </div>

              {/* 4. สาเหตุของปัญหา */}
              <div className="form-group">
                <label className="form-label">สาเหตุของปัญหา <span className="required">*</span></label>
                <textarea className={`form-control ${resolveErrors.rootCause ? 'error' : ''}`}
                  rows={3} placeholder="อธิบายสาเหตุที่ทำให้เกิดปัญหา..."
                  {...regResolve('rootCause', { required: 'กรุณากรอกสาเหตุ', minLength: { value: 3, message: 'อย่างน้อย 3 ตัวอักษร' } })}
                />
                {resolveErrors.rootCause && <p className="form-error">{resolveErrors.rootCause.message}</p>}
              </div>

              {/* 5. วิธีการแก้ปัญหา */}
              <div className="form-group">
                <label className="form-label">วิธีการแก้ปัญหา <span className="required">*</span></label>
                <textarea className={`form-control ${resolveErrors.resolutionNote ? 'error' : ''}`}
                  rows={3} placeholder="อธิบายวิธีการแก้ไขที่ทำ..."
                  {...regResolve('resolutionNote', { required: 'กรุณากรอกวิธีแก้ปัญหา', minLength: { value: 3, message: 'อย่างน้อย 3 ตัวอักษร' } })}
                />
                {resolveErrors.resolutionNote && <p className="form-error">{resolveErrors.resolutionNote.message}</p>}
              </div>

              <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
                <button type="button" className="btn btn-ghost btn-full"
                  onClick={() => setShowResolve(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-success btn-full"
                  disabled={resolveMut.isLoading}>
                  {resolveMut.isLoading ? '⏳...' : '✅ ปิดงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Bottom Sheet: Rate ──────────────────────── */}
      {showRate && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowRate(false)}>
          <div className="bottom-sheet" style={{ textAlign: 'center' }}>
            <div className="sheet-handle" />
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>ประเมินความพึงพอใจ</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginBottom: 24 }}>
              บริการ IT ครั้งนี้เป็นอย่างไรบ้าง?
            </p>
            <div className="star-rating" style={{ marginBottom: 24 }}>
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" className={`star-btn ${s <= (hoverStar || selectedStar) ? 'active' : ''}`}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setSelectedStar(s)}>
                  ★
                </button>
              ))}
            </div>
            {selectedStar > 0 && (
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: 16 }}>
                {['','แย่มาก','พอใช้','ปานกลาง','ดี','ดีมาก'][selectedStar]}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => setShowRate(false)}>ข้ามไปก่อน</button>
              <button className="btn btn-full btn-lg"
                style={{ background: '#f59e0b', color: 'white' }}
                onClick={onSubmitRate}
                disabled={rateMut.isLoading || !selectedStar}>
                {rateMut.isLoading ? '⏳...' : '⭐ ส่งคะแนน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: User แก้ไขรายละเอียด ────────────────── */}
      {showEdit && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="bottom-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>✏️ แก้ไขรายละเอียด</h3>
            <form onSubmit={handleEdit(async (data) => {
              const fd = new FormData();
              if (data.description) fd.append('description', data.description);
              // รูปใหม่ที่แนบเพิ่ม
              const fileInput = document.getElementById('edit-images');
              if (fileInput?.files) {
                Array.from(fileInput.files).forEach(f => fd.append('images', f));
              }
              await editMut.mutateAsync({ id, formData: fd });
              setShowEdit(false);
            })}>
              <div className="form-group">
                <label className="form-label">รายละเอียดปัญหา</label>
                <textarea className="form-control" rows={5}
                  style={{ resize: 'none', fontSize: '0.95rem' }}
                  {...regEdit('description')} />
              </div>
              <div className="form-group">
                <label className="form-label">แนบรูปเพิ่มเติม (ไม่บังคับ)</label>
                <input id="edit-images" type="file" className="form-control"
                  accept="image/jpeg,image/png,image/webp" multiple />
              </div>
              <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
                <button type="button" className="btn btn-ghost btn-full"
                  onClick={() => setShowEdit(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary btn-full"
                  disabled={editMut.isLoading}>
                  {editMut.isLoading ? '⏳...' : '💾 บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Admin แก้ไขหลังปิดงาน ──────────────────── */}
      {showEditRes && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowEditRes(false)}>
          <div className="bottom-sheet" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="sheet-handle" />
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>✏️ แก้ไขข้อมูลการปิดงาน</h3>
            <form onSubmit={handleEditRes(async (data) => {
              await editResMut.mutateAsync({ id, data });
              setShowEditRes(false);
            })}>
              <div className="form-group">
                <label className="form-label">วันที่/เวลา รับงาน</label>
                <input type="datetime-local" className="form-control"
                  {...regEditRes('acceptedAt')} />
              </div>
              <div className="form-group">
                <label className="form-label">วันที่/เวลา ปิดงาน</label>
                <input type="datetime-local" className="form-control"
                  {...regEditRes('resolvedAt')} />
              </div>
              <div className="form-group">
                <label className="form-label">รายละเอียดปัญหา (ที่ user แจ้ง)</label>
                <textarea className="form-control" rows={3} style={{ resize: 'none' }}
                  {...regEditRes('description')} />
              </div>
              <div className="form-group">
                <label className="form-label">สาเหตุของปัญหา <span className="required">*</span></label>
                <textarea className="form-control" rows={3} style={{ resize: 'none' }}
                  {...regEditRes('rootCause', { required: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">วิธีการแก้ปัญหา <span className="required">*</span></label>
                <textarea className="form-control" rows={3} style={{ resize: 'none' }}
                  {...regEditRes('resolutionNote', { required: true })} />
              </div>
              <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
                <button type="button" className="btn btn-ghost btn-full"
                  onClick={() => setShowEditRes(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary btn-full"
                  disabled={editResMut.isLoading}>
                  {editResMut.isLoading ? '⏳...' : '💾 บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Image Lightbox */}
      {showImages && ticket.attachments?.length > 0 && (
        <div className="overlay" onClick={() => setShowImages(false)}
          style={{ alignItems: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <img src={getImageUrl(ticket.attachments[activeImg].file_path)} alt=""
              style={{ width: '100%', borderRadius: 12, maxHeight: '80vh', objectFit: 'contain' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              {ticket.attachments.map((_, i) => (
                <button key={i}
                  style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: i === activeImg ? 'white' : 'rgba(255,255,255,0.4)' }}
                  onClick={() => setActiveImg(i)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}