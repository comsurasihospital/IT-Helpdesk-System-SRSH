// src/pages/ProfilePage.jsx
import { useState }   from 'react';
import { useAuth }    from '../context/AuthContext';
import { useQuery, useQueryClient } from 'react-query';
import { useForm }    from 'react-hook-form';
import { authAPI }    from '../api/services';
import AppLayout      from '../components/common/AppLayout';
import toast          from 'react-hot-toast';

const getInitials = (firstName, lastName) =>
  `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const ROLE_LABEL = { USER: 'ผู้แจ้งซ่อม', ADMIN: 'เจ้าหน้าที่ IT', SUPERVISOR: 'ผู้บริหาร' };
const ROLE_COLOR = { USER: '#1d4ed8', ADMIN: '#7c3aed', SUPERVISOR: '#0f766e' };

const formatPhone = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.slice(0,3) + '-' + digits.slice(3);
  return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
};

export default function ProfilePage() {
  const { user, logout, saveSession } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [phoneVal, setPhoneVal] = useState('');
  const [saving,   setSaving]   = useState(false);

  const { data: me, isLoading } = useQuery('me', () => authAPI.getMe().then(r => r.data.data), {
    staleTime: 0, cacheTime: 0,
    onSuccess: (data) => {
      setPhoneVal(data.phone || '');
    },
  });

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

  const raw = me || user || {};
  const profile = {
    ...raw,
    prefix_id:       raw.prefix_id       || null,
    prefix:          raw.prefix          || '',
    first_name:      raw.first_name      || raw.firstName      || '',
    last_name:       raw.last_name       || raw.lastName       || '',
    department_name: raw.department_name || raw.departmentName || '-',
    department_id:   raw.department_id   || raw.departmentId   || '',
    phone:           raw.phone           || '-',
    role:            raw.role            || 'USER',
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  const openEdit = () => {
    reset({
      prefixId:     String(profile.prefix_id || ''),
      firstName:    profile.first_name,
      lastName:     profile.last_name,
      departmentId: String(profile.department_id),
    });
    setPhoneVal(profile.phone === '-' ? '' : profile.phone);
    setEditMode(true);
  };

  const handlePhoneInput = (e) => {
    const f = formatPhone(e.target.value);
    setPhoneVal(f);
    setValue('phone', f);
  };

  const onSave = async (data) => {
    const rawPhone = phoneVal.replace(/\D/g, '');
    if (rawPhone.length > 0 && rawPhone.length !== 10) {
      toast.error('กรุณากรอกเบอร์โทร 10 หลัก'); return;
    }
    setSaving(true);
    try {
      const res = await authAPI.updateMe({
        prefixId:     parseInt(data.prefixId) || null,
        firstName:    data.firstName,
        lastName:     data.lastName,
        phone:        phoneVal || null,
        departmentId: parseInt(data.departmentId),
      });
      const updated = res.data.data;
      // อัปเดต localStorage user
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      saveSession(localStorage.getItem('token'), {
        ...stored,
        prefix_id:    updated.prefix_id,
        prefix:       updated.prefix,
        firstName:    updated.first_name,
        first_name:   updated.first_name,
        lastName:     updated.last_name,
        last_name:    updated.last_name,
        phone:        updated.phone,
        departmentId: updated.department_id,
        department_id: updated.department_id,
      });
      queryClient.invalidateQueries('me');
      toast.success('บันทึกข้อมูลสำเร็จ');
      setEditMode(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return (
    <AppLayout title="โปรไฟล์">
      <div className="loading-screen"><div className="spinner" /></div>
    </AppLayout>
  );

  return (
    <AppLayout title="โปรไฟล์">
      <div>

        {/* Profile Header */}
        <div className="card" style={{
          textAlign: 'center', padding: '28px 20px',
          background: 'linear-gradient(135deg, var(--primary-50), white)',
        }}>
          {profile.line_picture_url ? (
            <img src={profile.line_picture_url} alt=""
              style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 12px',
              background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.6rem', fontWeight: 700,
            }}>
              {getInitials(profile.first_name, profile.last_name)}
            </div>
          )}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
            {profile.prefix} {profile.first_name} {profile.last_name}
          </h2>
          <span style={{
            display: 'inline-block', padding: '3px 12px', borderRadius: 20,
            background: ROLE_COLOR[profile.role] + '20',
            color: ROLE_COLOR[profile.role], fontSize: '0.75rem', fontWeight: 600,
          }}>
            {ROLE_LABEL[profile.role] || profile.role}
          </span>
        </div>

        {/* Info Card */}
        {!editMode ? (
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>ข้อมูลส่วนตัว</h3>
              <button className="btn btn-primary btn-sm" onClick={openEdit}>✏️ แก้ไข</button>
            </div>

            {[
              { label: 'คำนำหน้าชื่อ', value: profile.prefix || '-' },
              { label: 'ชื่อ-นามสกุล', value: `${profile.first_name} ${profile.last_name}` },
              { label: 'แผนก',         value: profile.department_name },
              { label: 'เบอร์โทร',     value: profile.phone },
              { label: 'LINE',         value: profile.line_display_name || '-' },
              { label: 'เข้าใช้ล่าสุด', value: formatDate(profile.last_login_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>{label}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}
          </div>
        ) : (
          /* Edit Form */
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>แก้ไขข้อมูล</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>ยกเลิก</button>
            </div>

            <form onSubmit={handleSubmit(onSave)}>
              {/* คำนำหน้า */}
              <div className="form-group">
                <label className="form-label">คำนำหน้าชื่อ</label>
                <select className="form-control" {...register('prefixId')}>
                  <option value="">— เลือก —</option>
                  {prefixes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* ชื่อ - นามสกุล */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="form-label">ชื่อ <span className="required">*</span></label>
                  <input className={`form-control ${errors.firstName ? 'error' : ''}`}
                    {...register('firstName', { required: 'กรุณากรอกชื่อ' })} />
                  {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="form-label">นามสกุล <span className="required">*</span></label>
                  <input className={`form-control ${errors.lastName ? 'error' : ''}`}
                    {...register('lastName', { required: 'กรุณากรอกนามสกุล' })} />
                  {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                </div>
              </div>

              {/* เบอร์โทร */}
              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์</label>
                <input className="form-control" type="tel" inputMode="numeric"
                  placeholder="081-234-5678"
                  value={phoneVal}
                  onChange={handlePhoneInput} />
                {phoneVal.replace(/\D/g,'').length > 0 && phoneVal.replace(/\D/g,'').length < 10 && (
                  <p className="form-error">กรุณากรอกเบอร์โทร 10 หลัก ({phoneVal.replace(/\D/g,'').length}/10)</p>
                )}
              </div>

              {/* แผนก */}
              <div className="form-group">
                <label className="form-label">แผนก <span className="required">*</span></label>
                <select className={`form-control ${errors.departmentId ? 'error' : ''}`}
                  {...register('departmentId', { required: 'กรุณาเลือกแผนก' })}>
                  <option value="">— เลือกแผนก —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.departmentId && <p className="form-error">{errors.departmentId.message}</p>}
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                {saving ? '⏳ กำลังบันทึก...' : '✓ บันทึกข้อมูล'}
              </button>
            </form>
          </div>
        )}

        {/* Logout */}
        <div className="card" style={{ marginTop: 12 }}>
          <button className="btn btn-full"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            onClick={logout}>
            ออกจากระบบ
          </button>
        </div>


      </div>
    </AppLayout>
  );
}