// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useForm }             from 'react-hook-form';
import { useQuery }            from 'react-query';
import { useAuth }             from '../context/AuthContext';
import { authAPI }             from '../api/services';
import toast                   from 'react-hot-toast';

const formatPhone = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.slice(0,3) + '-' + digits.slice(3);
  return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
};

export default function LoginPage() {
  const { isAuthenticated, loading, lineProfile,
          register: authRegister, mockLogin } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode]       = useState('loading');
  const [phoneVal, setPhoneVal] = useState('');

  const { data: departments = [] } = useQuery(
    'departments',
    () => authAPI.getDepartments().then(r => r.data.data),
    { retry: 1 }
  );

  const { data: prefixes = [] } = useQuery(
    'prefixes',
    () => authAPI.getPrefixes().then(r => r.data.data),
    { retry: 1 }
  );

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
    else if (!loading) setMode('register');
  }, [isAuthenticated, loading, navigate]);

  const handlePhoneInput = (e) => {
    const f = formatPhone(e.target.value);
    setPhoneVal(f);
    setValue('phone', f);
  };

  const onRegister = async (data) => {
    const deptId = parseInt(data.departmentId);
    if (!deptId || isNaN(deptId)) { toast.error('กรุณาเลือกแผนก'); return; }
    const rawPhone = phoneVal.replace(/\D/g, '');
    if (rawPhone.length !== 10) { toast.error('กรุณากรอกเบอร์โทร 10 หลัก'); return; }

    try {
      await authRegister({
        lineUserId:      lineProfile?.userId      || ('mock-' + Date.now()),
        lineDisplayName: lineProfile?.displayName || null,
        linePictureUrl:  lineProfile?.pictureUrl  || null,
        prefixId:        parseInt(data.prefixId)  || null,
        firstName:       data.firstName,
        lastName:        data.lastName,
        phone:           phoneVal,
        departmentId:    deptId,
      });
      toast.success('ลงทะเบียนสำเร็จ!');
      navigate('/');
    } catch (err) {}
  };

  if (mode === 'loading') return (
    <div className="loading-screen">
      <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏥</div>
      <div className="spinner" />
      <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>กำลังโหลด...</p>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1d4ed8 0%, #1e3a8a 50%, #0f172a 100%)',
      display: 'flex', flexDirection: 'column', padding: '0 0 32px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '48px 24px 28px', color: 'white' }}>
        {process.env.REACT_APP_HOSPITAL_LOGO ? (
          <img src={process.env.REACT_APP_HOSPITAL_LOGO} alt="logo"
            style={{
              width: 110, height: 110, borderRadius: '50%',
              objectFit: 'cover', margin: '0 auto 16px', display: 'block',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              border: '3px solid rgba(255,255,255,0.3)',
            }} />
        ) : (
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>🏥</div>
        )}
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>
          {process.env.REACT_APP_HOSPITAL_NAME || 'โรงพยาบาล'}
        </h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>ระบบแจ้งซ่อมและติดตามงานด้านไอที</p>
      </div>

      {/* Register Card */}
      <div style={{
        margin: '0 16px', background: 'white', borderRadius: 20,
        padding: '24px 20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>ลงทะเบียนใช้งาน</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: 20 }}>
          กรอกข้อมูลเพื่อเริ่มใช้งานครั้งแรก
        </p>

        {lineProfile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#f0fdf4', borderRadius: 10, padding: '10px 14px',
            marginBottom: 20, border: '1px solid #bbf7d0',
          }}>
            <img src={lineProfile.pictureUrl} alt=""
              style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lineProfile.displayName}</p>
              <p style={{ fontSize: '0.72rem', color: '#16a34a' }}>✓ เชื่อมต่อ LINE สำเร็จ</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onRegister)}>
          {/* คำนำหน้าชื่อ */}
          <div className="form-group">
            <label className="form-label">คำนำหน้าชื่อ <span className="required">*</span></label>
            <select className={`form-control ${errors.prefixId ? 'error' : ''}`}
              {...register('prefixId', { required: 'กรุณาเลือกคำนำหน้าชื่อ' })}>
              <option value="">— เลือกคำนำหน้า —</option>
              {prefixes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.prefixId && <p className="form-error">{errors.prefixId.message}</p>}
          </div>

          {/* ชื่อ - นามสกุล */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label className="form-label">ชื่อ <span className="required">*</span></label>
              <input className={`form-control ${errors.firstName ? 'error' : ''}`}
                placeholder="สมชาย"
                {...register('firstName', { required: 'กรุณากรอกชื่อ', minLength: { value: 2, message: 'อย่างน้อย 2 ตัวอักษร' } })} />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="form-label">นามสกุล <span className="required">*</span></label>
              <input className={`form-control ${errors.lastName ? 'error' : ''}`}
                placeholder="ใจดี"
                {...register('lastName', { required: 'กรุณากรอกนามสกุล', minLength: { value: 2, message: 'อย่างน้อย 2 ตัวอักษร' } })} />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* เบอร์โทร */}
          <div className="form-group">
            <label className="form-label">เบอร์โทรศัพท์ <span className="required">*</span></label>
            <input className="form-control" type="tel" inputMode="numeric"
              placeholder="081-234-5678" value={phoneVal} onChange={handlePhoneInput} />
            <input type="hidden" {...register('phone', { required: true })} />
            {phoneVal.replace(/\D/g,'').length > 0 && phoneVal.replace(/\D/g,'').length < 10 && (
              <p className="form-error">กรุณากรอกเบอร์โทร 10 หลัก ({phoneVal.replace(/\D/g,'').length}/10)</p>
            )}
          </div>

          {/* แผนก */}
          <div className="form-group">
            <label className="form-label">หน่วยงาน / แผนก <span className="required">*</span></label>
            <select className={`form-control ${errors.departmentId ? 'error' : ''}`}
              {...register('departmentId', {
                required: 'กรุณาเลือกแผนก',
                validate: v => (v && v !== '' && !isNaN(parseInt(v))) || 'กรุณาเลือกแผนก',
              })}>
              <option value="">— เลือกแผนก —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.departmentId && <p className="form-error">{errors.departmentId.message}</p>}
            {departments.length === 0 && (
              <p className="form-hint">⚠️ ไม่สามารถโหลดรายชื่อแผนกได้</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg"
            disabled={isSubmitting} style={{ marginTop: 8 }}>
            {isSubmitting
              ? <><span className="spinner" style={{ width:18,height:18,borderColor:'rgba(255,255,255,0.3)',borderTopColor:'white' }} /> กำลังบันทึก...</>
              : '✓ เริ่มใช้งาน'}
          </button>
        </form>

        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: 8, textAlign: 'center' }}>🛠 Dev Mode</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['USER','ADMIN','SUPERVISOR'].map(r => (
                <button key={r} className="btn btn-ghost btn-sm"
                  style={{ flex:1, border:'1px solid var(--border)', fontSize:'0.7rem' }}
                  onClick={() => mockLogin(r)}>{r}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:'0.7rem', marginTop:24 }}>
        พัฒนาโดย ศูนย์เทคโนโลยีสารสนเทศ
      </p>
    </div>
  );
}