// src/pages/CreateTicketPage.jsx
import { useState, useRef, useEffect }  from 'react';
import { useNavigate }       from 'react-router-dom';
import { useForm }           from 'react-hook-form';
import { useQuery }          from 'react-query';
import { useCreateTicket }   from '../hooks/useTickets';
import { useAuth }           from '../context/AuthContext';
import { authAPI, ticketAPI } from '../api/services';
import toast                 from 'react-hot-toast';

const CAT_ICON = { SOFTWARE: '💻', PRINTER: '🖨️', COMPUTER: '🖥️', NETWORK: '📶', INFO_REQ: '📊', PUBLISH: '📢' };
const formatSla = (mins) => mins >= 1440 ? `${mins/1440} วัน` : mins >= 60 ? `${mins/60} ชม.` : `${mins} นาที`;

const formatPhone = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.slice(0,3) + '-' + digits.slice(3);
  return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
};

export default function CreateTicketPage() {
  const navigate  = useNavigate();
  const createMut = useCreateTicket();
  const fileRef   = useRef();
  const { user }  = useAuth();

  const [selectedCat, setSelectedCat] = useState(null);
  const [images,      setImages]      = useState([]);
  const [step,        setStep]        = useState(1);
  const [phoneVal,    setPhoneVal]    = useState('');

  // ดึงข้อมูล profile ล่าสุด
  const { data: me } = useQuery('me', () => authAPI.getMe().then(r => r.data.data), {
    staleTime: 0,
  });

  useEffect(() => {
    if (!me) return;
    const phone = me.phone || user?.phone || '';
    setPhoneVal(phone);
    setValue('reporterPhone', phone);
    setValue('reporterPrefixId', String(me.prefix_id || ''));
    setValue('reporterFirstName', me.first_name || '');
    setValue('reporterLastName', me.last_name || '');
    setValue('reporterDeptId', String(me.department_id || ''));
  }, [me]);

  const { data: departments = [] } = useQuery(
    'departments',
    () => authAPI.getDepartments().then(r => r.data.data),
    { staleTime: 60000 }
  );

  const { data: prefixes = [] } = useQuery(
    'prefixes',
    () => authAPI.getPrefixes().then(r => r.data.data),
    { staleTime: 60000 }
  );

  const { data: categories = [] } = useQuery(
    'categories',
    () => ticketAPI.getCategories().then(r => r.data.data),
    { staleTime: 60000 }
  );

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const handleFiles = (files) => {
    const arr = Array.from(files).slice(0, 5 - images.length);
    arr.forEach((file) => {
      if (!file.type.startsWith('image/')) { toast.error('กรุณาเลือกเฉพาะไฟล์ภาพ'); return; }
      setImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
    });
  };

  const removeImage = (idx) => {
    setImages((prev) => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_,i) => i !== idx); });
  };

  const handlePhoneInput = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhoneVal(formatted);
    setValue('reporterPhone', formatted);
  };

  const onSubmit = async (data) => {
    if (!selectedCat) { toast.error('กรุณาเลือกประเภทปัญหา'); return; }
    const rawPhone = phoneVal.replace(/\D/g, '');
    if (rawPhone.length !== 10) { toast.error('กรุณากรอกเบอร์โทร 10 หลัก'); return; }

    const fd = new FormData();
    fd.append('categoryId',       selectedCat.id);
    fd.append('title',            selectedCat.label);
    fd.append('description',      data.description);
    fd.append('priority',         'MEDIUM');
    fd.append('reporterPrefixId', data.reporterPrefixId || '');
    fd.append('reporterName',     `${data.reporterFirstName} ${data.reporterLastName}`);
    fd.append('reporterPhone',    phoneVal);
    fd.append('reporterDeptId',   data.reporterDeptId   || '');
    images.forEach(({ file }) => fd.append('images', file));

    try {
      const res = await createMut.mutateAsync(fd);
      navigate(`/tickets/${res.data.data.id}`, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'เกิดข้อผิดพลาด';
      toast.error(msg);
    }
  };

  return (
    <div className="app-container">
      {/* Top Nav */}
      <div className="top-nav">
        <button className="nav-back"
          onClick={() => step === 2 ? setStep(1) : navigate(-1)}>‹</button>
        <span className="nav-title">
          {step === 1 ? 'เลือกประเภทปัญหา' : 'รายละเอียดปัญหา'}
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* Step Indicator */}
      <div style={{ padding: '72px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map((cat, i) => (
            <button key={cat.id}
              className={`animate-fadeInUp stagger-${Math.min(i+1,4)}`}
              onClick={() => { setSelectedCat(cat); setStep(2); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'white', border: '1.5px solid var(--border)',
                borderRadius: 14, padding: '14px 16px',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{CAT_ICON[cat.code] || "🔧"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: 3 }}>
                  {cat.name}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>⏱ SLA: {formatSla(cat.sla_minutes)}</p>
              </div>
              <span style={{ color: 'var(--gray-400)', fontSize: '1.2rem' }}>›</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ padding: '0 16px 32px' }}>
          {/* Category Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 20,
          }}>
            <span style={{ fontSize: '1.5rem' }}>{selectedCat?.icon}</span>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>ประเภทปัญหา</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--gray-800)', fontWeight: 600 }}>{selectedCat?.label}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── ข้อมูลผู้แจ้ง ── */}
            <div style={{
              background: 'var(--gray-50)', borderRadius: 12,
              padding: '14px', marginBottom: 16,
              border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12 }}>
                📋 ข้อมูลผู้แจ้งซ่อม (แก้ไขได้)
              </p>

              {/* คำนำหน้า */}
              <div className="form-group">
                <label className="form-label">คำนำหน้าชื่อ</label>
                <select className="form-control" {...register('reporterPrefixId')}>
                  <option value="">— เลือก —</option>
                  {prefixes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* ชื่อ - นามสกุล */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="form-label">ชื่อ <span className="required">*</span></label>
                  <input className="form-control" placeholder="สมชาย"
                    {...register('reporterFirstName', { required: true })} />
                </div>
                <div>
                  <label className="form-label">นามสกุล <span className="required">*</span></label>
                  <input className="form-control" placeholder="ใจดี"
                    {...register('reporterLastName', { required: true })} />
                </div>
              </div>

              {/* เบอร์โทร */}
              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์</label>
                <input className="form-control" type="tel" inputMode="numeric"
                  placeholder="081-234-5678"
                  value={phoneVal}
                  onChange={handlePhoneInput} />
                <input type="hidden" {...register('reporterPhone')} />
              </div>

              {/* แผนก */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">แผนก</label>
                <select className="form-control" {...register('reporterDeptId')}>
                  <option value="">— เลือกแผนก —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {/* รายละเอียดปัญหา */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem' }}>
                รายละเอียดปัญหา <span className="required">*</span>
              </label>
              <textarea className={`form-control ${errors.description ? 'error' : ''}`}
                rows={6}
                placeholder="อธิบายปัญหาที่พบ เช่น&#10;- เกิดขึ้นเมื่อไหร่&#10;- ทำอะไรอยู่&#10;- เห็น error อะไร"
                style={{ fontSize: '0.95rem', lineHeight: 1.7, resize: 'none' }}
                {...register('description', {
                  required: 'กรุณากรอกรายละเอียด',
                  minLength: { value: 5, message: 'อย่างน้อย 5 ตัวอักษร' },
                })} />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            {/* แนบรูป */}
            <div className="form-group">
              <label className="form-label">แนบรูปภาพ (ไม่บังคับ, สูงสุด 5 รูป)</label>
              {images.length < 5 && (
                <div className="upload-zone" onClick={() => fileRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); }}>
                  <div className="upload-icon">📸</div>
                  <p className="upload-text">แตะเพื่อเลือกรูปภาพ</p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                    multiple style={{ display: 'none' }}
                    onChange={(e) => handleFiles(e.target.files)} />
                </div>
              )}
              {images.length > 0 && (
                <div className="image-preview-grid" style={{ marginTop: 10 }}>
                  {images.map(({ preview }, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img src={preview} alt="" />
                      <button type="button" className="remove-btn" onClick={() => removeImage(idx)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg"
              disabled={createMut.isLoading}>
              {createMut.isLoading ? '⏳ กำลังส่ง...' : '📩 ส่งแจ้งซ่อม'}
            </button>
          </form>
        </div>
      )}

      {/* Footer */}
      <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.65rem', padding: '8px 0 24px' }}>
        พัฒนาโดย ศูนย์เทคโนโลยีสารสนเทศ
      </p>
    </div>
  );
}