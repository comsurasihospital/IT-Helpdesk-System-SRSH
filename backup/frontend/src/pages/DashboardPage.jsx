// src/pages/DashboardPage.jsx  — Dashboard v2
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import useDashboard from '../hooks/useDashboard';
import AppLayout   from '../components/common/AppLayout';
import { reportAPI, dashboardAPI, authAPI, exportAPI } from '../api/services';
import toast from 'react-hot-toast';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('th-TH', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
}) : '-';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', {
  day:'2-digit', month:'short', year:'numeric'
}) : '-';
const minsToText = (m) => {
  if (!m && m !== 0) return '-';
  if (m < 60) return `${m} นาที`;
  if (m < 1440) return `${(m/60).toFixed(1)} ชม.`;
  return `${(m/1440).toFixed(1)} วัน`;
};
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const mapTicketRow = (t) => {
  const mins = t.resolve_minutes != null ? Number(t.resolve_minutes) : null;
  let resolveTime = '-';
  if (mins !== null) {
    if (mins < 60)        resolveTime = `${mins} นาที`;
    else if (mins < 1440) resolveTime = `${Math.floor(mins/60)} ชม. ${mins%60} นาที`;
    else                  resolveTime = `${Math.floor(mins/1440)} วัน ${Math.floor((mins%1440)/60)} ชม.`;
  }
  return {
    'Ticket No.':                    t.ticket_no || '-',
    'วันที่และเวลาแจ้ง':             fmtDateTime(t.opened_at),
    'แผนกที่แจ้งซ่อม':              t.department_name || '-',
    'ผู้แจ้งซ่อม':                  t.user_name || '-',
    'ประเภทปัญหา':                  t.category_name || '-',
    'รายละเอียดปัญหา':              (t.description || '-').split('\n').join(' '),
    'วันที่และเวลาปิดงาน':           fmtDateTime(t.resolved_at),
    'สาเหตุ/วิธีแก้ปัญหา':         (t.resolution_note || '-').split('\n').join(' '),
    'ระยะเวลาแก้ไขปัญหา':           resolveTime,
    'ผู้รับงาน (Admin)':             t.admin_name || '-',
  };
};

const shortCat = n => (n||'ไม่ระบุ')
  .replace('โปรแกรม HOSxP ขัดข้อง','HOSxP')
  .replace('เครื่องพิมพ์ขัดข้อง','Printer')
  .replace('เครื่องคอมพิวเตอร์ขัดข้อง','Computer')
  .replace('ระบบอินเทอร์เน็ตขัดข้อง','Network')
  .replace('การขอข้อมูลสารสนเทศทางการแพทย์','Info')
  .replace('การเผยแพร่ข่าวสาร ลงในเว็บไซต์และสื่อสังคมโรงพยาบาล','Publish');

const C = {
  blue:'#2563eb', blueLight:'#eff6ff', blueBorder:'#bfdbfe',
  green:'#16a34a', greenLight:'#f0fdf4', greenBorder:'#bbf7d0',
  orange:'#ea580c', orangeLight:'#fff7ed', orangeBorder:'#fed7aa',
  red:'#dc2626', redLight:'#fef2f2', redBorder:'#fecaca',
  gray:'#6b7280', grayLight:'#f9fafb', grayBorder:'#e5e7eb',
  purple:'#7c3aed', teal:'#0891b2', amber:'#d97706',
};
const PALETTE = [C.blue,C.green,C.orange,C.red,C.purple,C.teal,C.amber,'#be185d','#15803d','#9333ea'];
const TT = { contentStyle:{background:'#1e293b',border:'none',borderRadius:10,fontSize:12,color:'white',boxShadow:'0 8px 24px rgba(0,0,0,0.3)'}, cursor:{fill:'rgba(0,0,0,0.04)'} };
const CARD = { background:'white', borderRadius:16, padding:'20px', border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' };
const RANGE_OPTS = [{v:'today',l:'วันนี้'},{v:'week',l:'7 วัน'},{v:'month',l:'30 วัน'},{v:'year',l:'ปีนี้'},{v:'all',l:'ทั้งหมด'}];

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--primary),#60a5fa)',
        display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0 }}>{icon}</span>
      <div>
        <h2 style={{ fontSize:'0.95rem',fontWeight:700,color:'var(--gray-800)',margin:0 }}>{title}</h2>
        {sub && <p style={{ fontSize:'0.72rem',color:'var(--gray-400)',margin:0 }}>{sub}</p>}
      </div>
    </div>
  );
}

function RangeBar({ value, onChange, options }) {
  return (
    <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
      {options.map(o => {
        const a = value===o.v;
        return (
          <button key={o.v} onClick={()=>onChange(o.v)} style={{
            padding:'4px 12px',fontSize:'0.73rem',borderRadius:20,cursor:'pointer',
            border:`1.5px solid ${a?'var(--primary)':'var(--border)'}`,
            background:a?'var(--primary)':'white',
            color:a?'white':'var(--gray-500)',
            fontWeight:a?600:400,transition:'all .15s',
          }}>{o.l}</button>
        );
      })}
    </div>
  );
}

function Skeleton({ h=200 }) {
  return <div className="skeleton" style={{ height:h,borderRadius:12 }} />;
}

function StatCard({ label, value, sub, color, bg, border, icon }) {
  return (
    <div style={{ background:bg,border:`1.5px solid ${border}`,borderRadius:14,padding:'16px 18px',display:'flex',flexDirection:'column',gap:4 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
        <p style={{ fontSize:'0.68rem',color:color,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',margin:0 }}>{label}</p>
        <span style={{ width:26,height:26,borderRadius:8,background:`${color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem' }}>{icon}</span>
      </div>
      <p style={{ fontSize:'1.9rem',fontWeight:800,color:'var(--gray-800)',lineHeight:1,margin:0 }}>{value}</p>
      <p style={{ fontSize:'0.7rem',color:'var(--gray-400)',margin:0 }}>{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const year = new Date().getFullYear();

  const [mRange,setMRange]         = useState('year');
  const [mFrom,setMFrom]           = useState('');
  const [mTo,setMTo]               = useState('');
  const [showCustom,setShowCustom] = useState(false);
  const [exportingM,setExportingM] = useState(false);
  const [catRange,setCatRange]     = useState('all');
  const [deptRange,setDeptRange]   = useState('all');
  const [showAllDept,setShowAllDept]   = useState(false);
  const [allDeptData,setAllDeptData]   = useState(null);
  const [loadingAllDept,setLoadingAllDept] = useState(false);
  const [breakRange,setBreakRange]     = useState('month');
  const [breakDeptId,setBreakDeptId]   = useState('');
  const [breakDepts,setBreakDepts]     = useState([]);
  const [breakData,setBreakData]       = useState([]);
  const [breakLoading,setBreakLoading] = useState(false);
  const [slaRange,setSlaRange]         = useState('month');
  const [slaData,setSlaData]           = useState([]);
  const [slaLoading,setSlaLoading]     = useState(false);
  const [workRange,setWorkRange]       = useState('month');
  const [workData,setWorkData]         = useState([]);
  const [workLoading,setWorkLoading]   = useState(false);
  const [mttrRange,setMttrRange]       = useState('month');
  const [mttrData,setMttrData]         = useState([]);
  const [mttrLoading,setMttrLoading]   = useState(false);
  const [agingDays,setAgingDays]       = useState(3);
  const [agingData,setAgingData]       = useState([]);
  const [agingLoading,setAgingLoading] = useState(false);
  const [exporting,setExporting]       = useState(false);

  const monthParams = mRange==='custom'&&mFrom&&mTo
    ? {range:'custom',dateFrom:mFrom,dateTo:mTo} : {range:mRange};
  const { summary,monthly,category,dept } = useDashboard(catRange,deptRange,monthParams);
  const s = summary.data?.summary || {};

  useEffect(()=>{ authAPI.getDepartments().then(r=>setBreakDepts(r.data.data||[])).catch(()=>{}); },[]);
  useEffect(()=>{
    setBreakLoading(true);
    dashboardAPI.getDeptBreakdown(breakDeptId||undefined,breakRange)
      .then(r=>setBreakData(r.data.data||[])).catch(()=>setBreakData([])).finally(()=>setBreakLoading(false));
  },[breakDeptId,breakRange]);
  useEffect(()=>{
    setSlaLoading(true);
    dashboardAPI.getSlaByDept(slaRange).then(r=>setSlaData(r.data.data||[])).catch(()=>setSlaData([])).finally(()=>setSlaLoading(false));
  },[slaRange]);
  useEffect(()=>{
    setWorkLoading(true);
    dashboardAPI.getAdminWorkload(workRange).then(r=>setWorkData(r.data.data||[])).catch(()=>setWorkData([])).finally(()=>setWorkLoading(false));
  },[workRange]);
  useEffect(()=>{
    setMttrLoading(true);
    dashboardAPI.getMttr(mttrRange).then(r=>setMttrData(r.data.data||[])).catch(()=>setMttrData([])).finally(()=>setMttrLoading(false));
  },[mttrRange]);
  useEffect(()=>{
    setAgingLoading(true);
    dashboardAPI.getAgingTickets(agingDays).then(r=>setAgingData(r.data.data||[])).catch(()=>setAgingData([])).finally(()=>setAgingLoading(false));
  },[agingDays]);

  const monthlyData = (monthly.data||[]).map(r=>({
    name:r.period_label,
    total:Number(r.total||0),resolved:Number(r.resolved||0),
    in_progress:Number(r.in_progress||0),cancelled:Number(r.cancelled||0),
  }));
  const mSum = monthlyData.reduce((a,r)=>({
    total:a.total+r.total,resolved:a.resolved+r.resolved,
    in_progress:a.in_progress+r.in_progress,cancelled:a.cancelled+r.cancelled,
  }),{total:0,resolved:0,in_progress:0,cancelled:0});
  const catData = (category.data||[]).map(r=>({ name:r.category_name, value:Number(r.total_tickets||0) }));
  const deptData    = (dept.data||[]).slice(0,10);
  const deptDisplay = showAllDept?(allDeptData||deptData):deptData;
  const deptMax     = deptDisplay.reduce((a,d)=>Math.max(a,d.total_tickets),1);

  const handleMRange = v => { setMRange(v); setShowCustom(v==='custom'); };
  const handleExpandDept = async () => {
    if (showAllDept) { setShowAllDept(false); return; }
    setLoadingAllDept(true);
    try { const r=await dashboardAPI.getAllDeptChart(deptRange); setAllDeptData(r.data.data); setShowAllDept(true); }
    catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); } finally { setLoadingAllDept(false); }
  };
  const handleExportMonthly = async () => {
    setExportingM(true);
    try {
      const params = mRange==='custom'&&mFrom&&mTo
        ? { startDate:mFrom, endDate:mTo }
        : mRange==='today'  ? { startDate:new Date().toISOString().slice(0,10), endDate:new Date().toISOString().slice(0,10) }
        : mRange==='week'   ? { startDate:new Date(Date.now()-7*86400000).toISOString().slice(0,10), endDate:new Date().toISOString().slice(0,10) }
        : mRange==='month'  ? { startDate:new Date(Date.now()-30*86400000).toISOString().slice(0,10), endDate:new Date().toISOString().slice(0,10) }
        : mRange==='year'   ? { startDate:`${new Date().getFullYear()}-01-01`, endDate:new Date().toISOString().slice(0,10) }
        : {};
      const res = await exportAPI.downloadXlsx(params);
      downloadBlob(res.data, `helpdesk_report_${mRange}_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Export Excel สำเร็จ');
    } catch { toast.error('Export ไม่สำเร็จ'); }
    finally { setExportingM(false); }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const res = await exportAPI.downloadXlsx({});
      downloadBlob(res.data, `helpdesk_all_tickets_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('Export Excel ทั้งหมด สำเร็จ');
    } catch { toast.error('Export ไม่สำเร็จ'); }
    finally { setExporting(false); }
  };

  return (
    <AppLayout title="Dashboard">
      <div style={{ display:'flex',flexDirection:'column',gap:28,paddingBottom:32 }}>

        {/* S1: Overview */}
        <section>
          <SectionTitle icon="📊" title="ภาพรวมระบบ" sub="สถานะ Ticket ทั้งหมดในระบบ" />
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:14 }}>
            {summary.isLoading ? Array(6).fill(0).map((_,i)=><Skeleton key={i} h={90}/>) : (<>
              <StatCard label="รอรับงาน"    value={s.open_tickets||0}       sub="OPEN"        color={C.red}    bg={C.redLight}    border={C.redBorder}    icon="🔔" />
              <StatCard label="กำลังดำเนิน" value={s.in_progress_tickets||0} sub="IN PROGRESS" color={C.orange} bg={C.orangeLight} border={C.orangeBorder} icon="⚙️" />
              <StatCard label="เสร็จสิ้น"   value={s.resolved_tickets||0}   sub="RESOLVED"    color={C.green}  bg={C.greenLight}  border={C.greenBorder}  icon="✅" />
              <StatCard label="วันนี้"       value={s.today_tickets||0}      sub="TODAY"       color={C.blue}   bg={C.blueLight}   border={C.blueBorder}   icon="📅" />
              <StatCard label="เกิน SLA"    value={s.sla_breached||0}       sub="BREACHED"    color={s.sla_breached>0?C.red:C.gray} bg={s.sla_breached>0?C.redLight:C.grayLight} border={s.sla_breached>0?C.redBorder:C.grayBorder} icon="⚠️" />
              <StatCard label="ความพึงพอใจ" value={s.avg_satisfaction?`${parseFloat(s.avg_satisfaction).toFixed(1)} *`:'-'} sub="คะแนนเฉลี่ย" color={C.amber} bg="#fffbeb" border="#fde68a" icon="⭐" />
            </>)}
          </div>
        </section>

        {/* S2: Monthly */}
        <section>
          <SectionTitle icon="📈" title="รายงานจำนวนการแจ้งซ่อม" sub="จำนวน Ticket แยกตามสถานะ" />
          <div style={CARD}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:14 }}>
              <RangeBar value={mRange} onChange={handleMRange} options={[
                {v:'today',l:'วันนี้'},{v:'week',l:'7 วัน'},{v:'month',l:'30 วัน'},
                {v:'year',l:'ปีนี้'},{v:'all',l:'ทั้งหมด'},{v:'custom',l:'กำหนดเอง'},
              ]} />
              <button onClick={handleExportMonthly} disabled={exportingM||monthly.isLoading}
                style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 16px',borderRadius:20,
                  border:`1.5px solid ${C.blue}`,background:C.blueLight,color:C.blue,
                  cursor:'pointer',fontSize:'0.78rem',fontWeight:600,opacity:exportingM?.6:1,transition:'all .15s' }}>
                📥 {exportingM?'กำลัง Export...':'Export Excel'}
              </button>
            </div>

            {showCustom && (() => {
              const diff = mFrom&&mTo?Math.ceil((new Date(mTo)-new Date(mFrom))/86400000)+1:null;
              return (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.78rem',color:'var(--gray-500)' }}>จาก</span>
                    <input type="date" value={mFrom} onChange={e=>setMFrom(e.target.value)}
                      style={{ padding:'4px 8px',borderRadius:8,border:'1.5px solid var(--border)',fontSize:'0.82rem' }} />
                    <span style={{ fontSize:'0.78rem',color:'var(--gray-500)' }}>ถึง</span>
                    <input type="date" value={mTo} min={mFrom} onChange={e=>setMTo(e.target.value)}
                      style={{ padding:'4px 8px',borderRadius:8,border:'1.5px solid var(--border)',fontSize:'0.82rem' }} />
                  </div>
                  {diff&&diff>=1&&(
                    <span style={{ display:'inline-flex',alignItems:'center',gap:4,marginTop:6,
                      padding:'3px 10px',borderRadius:20,fontSize:'0.73rem',fontWeight:600,
                      background:C.blueLight,color:C.blue,border:`1px solid ${C.blueBorder}` }}>
                      {diff} วัน{diff>60?' · แสดงเป็นรายเดือน':''}
                    </span>
                  )}
                </div>
              );
            })()}

            {!monthly.isLoading&&monthlyData.length>0&&(
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16 }}>
                {[{l:'ทั้งหมด',v:mSum.total,c:C.blue,bg:C.blueLight},
                  {l:'เสร็จสิ้น',v:mSum.resolved,c:C.green,bg:C.greenLight},
                  {l:'กำลังดำเนิน',v:mSum.in_progress,c:C.orange,bg:C.orangeLight},
                  {l:'ยกเลิก',v:mSum.cancelled,c:C.gray,bg:C.grayLight}].map(it=>(
                  <div key={it.l} style={{ background:it.bg,borderRadius:10,padding:'10px',textAlign:'center' }}>
                    <div style={{ fontSize:'1.5rem',fontWeight:800,color:it.c }}>{it.v.toLocaleString()}</div>
                    <div style={{ fontSize:'0.68rem',color:'var(--gray-500)',marginTop:2 }}>{it.l}</div>
                  </div>
                ))}
              </div>
            )}

            {monthly.isLoading?<Skeleton h={260}/>:monthlyData.length===0?
              <p style={{ color:'var(--gray-400)',textAlign:'center',padding:32,fontSize:'0.82rem' }}>ยังไม่มีข้อมูล</p>:(
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} margin={{ top:4,right:4,left:-20,bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fontSize:11,fill:'var(--gray-400)' }} />
                  <YAxis tick={{ fontSize:11,fill:'var(--gray-400)' }} allowDecimals={false} />
                  <Tooltip {...TT} />
                  <Legend wrapperStyle={{ fontSize:11,paddingTop:8 }} />
                  <Bar dataKey="total"       name="ทั้งหมด"        fill={C.blue}   radius={[3,3,0,0]} />
                  <Bar dataKey="resolved"    name="เสร็จสิ้น"      fill={C.green}  radius={[3,3,0,0]} />
                  <Bar dataKey="in_progress" name="กำลังดำเนินการ" fill={C.orange} radius={[3,3,0,0]} />
                  <Bar dataKey="cancelled"   name="ยกเลิก"         fill={C.gray}   radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* S3: Category + Top Dept */}
        <section>
          <SectionTitle icon="🏢" title="แยกตามประเภทและแผนก" sub="สัดส่วนปัญหาและแผนกที่แจ้งซ่อมสูงสุด" />
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16 }}>
            <div style={CARD}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:12 }}>
                <p style={{ fontSize:'0.88rem',fontWeight:700,color:'var(--gray-700)',margin:0 }}>ประเภทปัญหา</p>
                <RangeBar value={catRange} onChange={setCatRange} options={[
                  {v:'today',l:'วันนี้'},{v:'week',l:'7 วัน'},{v:'month',l:'30 วัน'},{v:'all',l:'ทั้งหมด'},
                ]} />
              </div>
              {category.isLoading?<Skeleton h={200}/>:catData.length===0?
                <p style={{ color:'var(--gray-400)',textAlign:'center',padding:24 }}>ยังไม่มีข้อมูล</p>:(
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="45%" outerRadius={80}
                      dataKey="value" nameKey="name"
                      label={({name,percent})=>`${shortCat(name)} ${(percent*100).toFixed(0)}%`}
                      labelLine={false} style={{ fontSize:10 }}>
                      {catData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                    </Pie>
                    <Tooltip {...TT} formatter={(v,n)=>[v+' Ticket',shortCat(n)]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={CARD}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:12 }}>
                <p style={{ fontSize:'0.88rem',fontWeight:700,color:'var(--gray-700)',margin:0 }}>Top แผนก</p>
                <RangeBar value={deptRange} onChange={setDeptRange} options={RANGE_OPTS} />
              </div>
              {dept.isLoading?Array(5).fill(0).map((_,i)=><div key={i} className="skeleton skeleton-line" style={{ marginBottom:10 }}/>):
               deptDisplay.length===0?<p style={{ color:'var(--gray-400)',textAlign:'center',padding:24 }}>ยังไม่มีข้อมูล</p>:
               deptDisplay.map((d,i)=>(
                <div key={d.department_id} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                    <span style={{ display:'flex',alignItems:'center',gap:6,fontSize:'0.8rem',color:'var(--gray-700)',fontWeight:500 }}>
                      <span style={{ width:18,height:18,borderRadius:'50%',background:PALETTE[i%PALETTE.length],
                        display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.58rem',fontWeight:800,color:'white',flexShrink:0 }}>{i+1}</span>
                      {d.department_name}
                    </span>
                    <span style={{ fontSize:'0.75rem',fontWeight:700,color:'var(--gray-700)' }}>{d.total_tickets}</span>
                  </div>
                  <div style={{ height:6,background:'var(--gray-100)',borderRadius:4,overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:4,width:`${Math.round(d.total_tickets/deptMax*100)}%`,
                      background:PALETTE[i%PALETTE.length],transition:'width .6s ease' }}/>
                  </div>
                </div>
               ))}
              <button onClick={handleExpandDept} disabled={loadingAllDept} style={{
                marginTop:6,width:'100%',padding:'7px',borderRadius:10,
                border:'1.5px dashed var(--border)',background:'var(--gray-50)',
                color:'var(--gray-500)',cursor:'pointer',fontSize:'0.78rem',
              }}>
                {loadingAllDept?'กำลังโหลด...':showAllDept?'▲ แสดงแค่ Top 10':`▼ ดูทุกแผนก (${dept.data?.length||0})`}
              </button>
            </div>
          </div>
        </section>

        {/* S4: Breakdown */}
        <section>
          <SectionTitle icon="📋" title="ประเภทปัญหาตามแผนก" sub="เลือกแผนกเพื่อดูรายละเอียด" />
          <div style={CARD}>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:16 }}>
              <select value={breakDeptId} onChange={e=>setBreakDeptId(e.target.value)}
                style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',
                  fontSize:'0.78rem',background:'white',color:'var(--gray-700)',cursor:'pointer',minWidth:160 }}>
                <option value="">ทุกแผนก</option>
                {breakDepts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <RangeBar value={breakRange} onChange={setBreakRange} options={RANGE_OPTS} />
            </div>
            {breakLoading?<Skeleton h={300}/>:breakData.length===0?
              <p style={{ color:'var(--gray-400)',textAlign:'center',padding:32,fontSize:'0.82rem' }}>ยังไม่มีข้อมูล</p>:
              (()=>{
                if (breakDeptId) {
                  const cats=[...new Set(breakData.map(r=>r.category_name))];
                  const cd=cats.map(cat=>{
                    const rows=breakData.filter(r=>r.category_name===cat);
                    return { name:shortCat(cat),
                      'เสร็จสิ้น':rows.reduce((s,r)=>s+Number(r.resolved||0),0),
                      'กำลังดำเนินการ':rows.reduce((s,r)=>s+Number(r.in_progress||0),0),
                      'รอรับงาน':rows.reduce((s,r)=>s+Number(r.open_tickets||0),0),
                      'ยกเลิก':rows.reduce((s,r)=>s+Number(r.cancelled||0),0),
                    };
                  });
                  return (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={cd} margin={{ top:4,right:4,left:-20,bottom:30 }}>
                        <XAxis dataKey="name" tick={{ fontSize:11 }} angle={-15} textAnchor="end" interval={0}/>
                        <YAxis tick={{ fontSize:11 }} allowDecimals={false}/>
                        <Tooltip {...TT}/><Legend wrapperStyle={{ fontSize:11,paddingTop:8 }}/>
                        <Bar dataKey="เสร็จสิ้น"      stackId="a" fill={C.green}  radius={[0,0,0,0]}/>
                        <Bar dataKey="กำลังดำเนินการ" stackId="a" fill={C.orange} radius={[0,0,0,0]}/>
                        <Bar dataKey="รอรับงาน"       stackId="a" fill={C.red}    radius={[0,0,0,0]}/>
                        <Bar dataKey="ยกเลิก"         stackId="a" fill={C.gray}   radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                } else {
                  const depts=[...new Set(breakData.map(r=>r.department_name))];
                  const cats=[...new Set(breakData.map(r=>r.category_name).filter(Boolean))];
                  const cd=depts.map(dept=>{
                    const obj={ name:dept };
                    cats.forEach(cat=>{
                      const row=breakData.find(r=>r.department_name===dept&&r.category_name===cat);
                      obj[shortCat(cat)]=row?Number(row.total):0;
                    });
                    return obj;
                  });
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cd} margin={{ top:4,right:4,left:-20,bottom:60 }}>
                        <XAxis dataKey="name" tick={{ fontSize:10 }} angle={-30} textAnchor="end" interval={0}/>
                        <YAxis tick={{ fontSize:11 }} allowDecimals={false}/>
                        <Tooltip {...TT}/><Legend wrapperStyle={{ fontSize:11,paddingTop:8 }}/>
                        {cats.map((cat,i)=>(
                          <Bar key={cat} dataKey={shortCat(cat)} stackId="a" fill={PALETTE[i%PALETTE.length]}
                            radius={i===cats.length-1?[3,3,0,0]:[0,0,0,0]}/>
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  );
                }
              })()
            }
          </div>
        </section>

        {/* S5: SLA by Dept */}
        <section>
          <SectionTitle icon="✅" title="SLA Performance รายแผนก" sub="สัดส่วนทันเวลา vs เกิน SLA แยกตามแผนก" />
          <div style={CARD}>
            <div style={{ marginBottom:14 }}><RangeBar value={slaRange} onChange={setSlaRange} options={RANGE_OPTS}/></div>
            {slaLoading?<Skeleton h={240}/>:slaData.length===0?
              <p style={{ color:'var(--gray-400)',textAlign:'center',padding:32 }}>ยังไม่มีข้อมูล</p>:(
              <>
                <ResponsiveContainer width="100%" height={Math.max(220,slaData.length*44)}>
                  <BarChart data={slaData} layout="vertical" margin={{ top:4,right:64,left:8,bottom:4 }}>
                    <XAxis type="number" domain={[0,100]} tick={{ fontSize:11 }} tickFormatter={v=>`${v}%`}/>
                    <YAxis type="category" dataKey="department_name" tick={{ fontSize:11 }} width={130}/>
                    <Tooltip {...TT} formatter={(v,n)=>[`${v}%`,n]}/>
                    <Bar dataKey="on_time_pct" name="ทันเวลา %" fill={C.green} radius={[0,4,4,0]}
                      label={{ position:'right',fontSize:11,fill:'var(--gray-500)',formatter:v=>`${v}%` }}/>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)' }}>
                  {slaData.slice(0,6).map(d=>(
                    <div key={d.department_name} style={{ fontSize:'0.75rem',color:'var(--gray-600)' }}>
                      <span style={{ fontWeight:600 }}>{d.department_name}</span>
                      {' — '}
                      <span style={{ color:C.green }}>ทัน {d.on_time}</span>
                      {' / '}
                      <span style={{ color:C.red }}>เกิน {d.breached}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* S6: Admin Workload */}
        <section>
          <SectionTitle icon="👤" title="Admin Workload" sub="จำนวน Ticket ที่แต่ละ admin รับและปิด" />
          <div style={CARD}>
            <div style={{ marginBottom:14 }}><RangeBar value={workRange} onChange={setWorkRange} options={RANGE_OPTS}/></div>
            {workLoading?<Skeleton h={200}/>:workData.length===0?
              <p style={{ color:'var(--gray-400)',textAlign:'center',padding:32 }}>ยังไม่มีข้อมูล</p>:(
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'0.82rem' }}>
                  <thead>
                    <tr style={{ background:'var(--gray-50)' }}>
                      {['Admin','รับงานทั้งหมด','ปิดงานแล้ว','กำลังดำเนินการ','เวลาปิดงานเฉลี่ย'].map(h=>(
                        <th key={h} style={{ padding:'10px 12px',textAlign:h==='Admin'?'left':'center',
                          fontWeight:600,color:'var(--gray-500)',fontSize:'0.72rem',
                          borderBottom:'2px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workData.map((w,i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid var(--gray-50)' }}>
                        <td style={{ padding:'10px 12px',fontWeight:600,color:'var(--gray-700)' }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <span style={{ width:28,height:28,borderRadius:'50%',flexShrink:0,
                              background:`linear-gradient(135deg,${PALETTE[i%PALETTE.length]},${PALETTE[(i+1)%PALETTE.length]})`,
                              display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:800,color:'white' }}>
                              {(w.admin_name||'?')[0]}
                            </span>
                            {w.admin_name}
                          </div>
                        </td>
                        <td style={{ padding:'10px 12px',textAlign:'center',fontWeight:700,color:C.blue }}>{w.assigned}</td>
                        <td style={{ padding:'10px 12px',textAlign:'center',fontWeight:700,color:C.green }}>{w.resolved}</td>
                        <td style={{ padding:'10px 12px',textAlign:'center',fontWeight:700,color:C.orange }}>{w.in_progress}</td>
                        <td style={{ padding:'10px 12px',textAlign:'center',color:'var(--gray-600)' }}>{minsToText(w.avg_mins)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* S7: MTTR */}
        <section>
          <SectionTitle icon="⚡" title="เวลาตอบสนองเฉลี่ย (MTTR)" sub="เวลา OPEN → รับงาน และ OPEN → ปิดงาน แยกตามประเภท" />
          <div style={CARD}>
            <div style={{ marginBottom:14 }}><RangeBar value={mttrRange} onChange={setMttrRange} options={RANGE_OPTS}/></div>
            {mttrLoading?<Skeleton h={220}/>:mttrData.length===0?
              <p style={{ color:'var(--gray-400)',textAlign:'center',padding:32 }}>ยังไม่มีข้อมูล</p>:(
              <>
                <ResponsiveContainer width="100%" height={Math.max(200,mttrData.length*52)}>
                  <BarChart data={mttrData.map(r=>({
                    name:shortCat(r.category_name),
                    'รับงาน (นาที)':r.avg_accept_mins||0,
                    'ปิดงาน (นาที)':r.avg_resolve_mins||0,
                    sla:r.sla_minutes,
                  }))} layout="vertical" margin={{ top:4,right:8,left:8,bottom:4 }}>
                    <XAxis type="number" tick={{ fontSize:11 }} tickFormatter={v=>v>=1440?`${(v/1440).toFixed(1)}d`:v>=60?`${(v/60).toFixed(1)}h`:`${v}m`}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={80}/>
                    <Tooltip {...TT} formatter={(v,n)=>[minsToText(v),n]}/>
                    <Legend wrapperStyle={{ fontSize:11 }}/>
                    <Bar dataKey="รับงาน (นาที)"  fill={C.blue}   radius={[0,4,4,0]}/>
                    <Bar dataKey="ปิดงาน (นาที)" fill={C.orange} radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)' }}>
                  {mttrData.map(r=>{
                    const over=(r.avg_resolve_mins||0)>(r.sla_minutes||9999);
                    return (
                      <span key={r.code} style={{ fontSize:'0.73rem',padding:'2px 10px',borderRadius:20,fontWeight:600,
                        background:over?C.redLight:C.greenLight,color:over?C.red:C.green,
                        border:`1px solid ${over?C.redBorder:C.greenBorder}` }}>
                        {shortCat(r.category_name)} SLA {minsToText(r.sla_minutes)} {over?'⚠️ เกิน':'✅ ทัน'}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* S8: Aging */}
        <section>
          <SectionTitle icon="🕐" title="Ticket ค้างนาน" sub="รายการที่ยังไม่ปิดเกินระยะเวลาที่กำหนด" />
          <div style={CARD}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap' }}>
              <span style={{ fontSize:'0.82rem',color:'var(--gray-600)' }}>เกิน</span>
              {[1,3,7,14,30].map(d=>{
                const a=agingDays===d;
                return (
                  <button key={d} onClick={()=>setAgingDays(d)} style={{
                    padding:'4px 14px',borderRadius:20,cursor:'pointer',fontSize:'0.78rem',fontWeight:a?700:400,
                    border:`1.5px solid ${a?C.red:C.grayBorder}`,
                    background:a?C.redLight:'white',color:a?C.red:'var(--gray-500)',transition:'all .15s',
                  }}>{d} วัน</button>
                );
              })}
              {agingData.length>0&&(
                <span style={{ marginLeft:'auto',fontSize:'0.78rem',fontWeight:700,
                  color:C.red,background:C.redLight,padding:'4px 12px',borderRadius:20,
                  border:`1px solid ${C.redBorder}` }}>{agingData.length} รายการ</span>
              )}
            </div>
            {agingLoading?<Skeleton h={180}/>:agingData.length===0?(
              <div style={{ textAlign:'center',padding:'32px 16px' }}>
                <div style={{ fontSize:'2rem',marginBottom:8,color:C.green }}>✅</div>
                <p style={{ color:C.green,fontWeight:600,fontSize:'0.88rem' }}>ไม่มี Ticket ค้างนาน</p>
              </div>
            ):(
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'0.8rem' }}>
                  <thead>
                    <tr style={{ background:'var(--gray-50)' }}>
                      {['Ticket No.','หัวข้อ','ผู้แจ้ง','แผนก','สถานะ','ค้างมา','SLA'].map(h=>(
                        <th key={h} style={{ padding:'9px 10px',textAlign:'left',fontWeight:600,
                          color:'var(--gray-500)',fontSize:'0.72rem',borderBottom:'2px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agingData.map((t,i)=>{
                      const sc=t.status==='OPEN'?C.red:C.orange;
                      const sb=t.status==='OPEN'?C.redLight:C.orangeLight;
                      return (
                        <tr key={i} style={{ borderBottom:'1px solid var(--gray-50)',background:i%2===0?'white':'var(--gray-50)' }}>
                          <td style={{ padding:'9px 10px',fontWeight:700,color:C.blue,whiteSpace:'nowrap' }}>{t.ticket_no}</td>
                          <td style={{ padding:'9px 10px',color:'var(--gray-700)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.title}</td>
                          <td style={{ padding:'9px 10px',color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.user_name}</td>
                          <td style={{ padding:'9px 10px',color:'var(--gray-600)',whiteSpace:'nowrap' }}>{t.department_name}</td>
                          <td style={{ padding:'9px 10px' }}>
                            <span style={{ padding:'2px 10px',borderRadius:20,fontSize:'0.72rem',fontWeight:600,background:sb,color:sc }}>
                              <span style={{ width:6,height:6,borderRadius:'50%',background:sc,display:'inline-block',marginRight:4 }}/>
                              {t.status==='OPEN'?'รอรับงาน':'กำลังดำเนิน'}
                            </span>
                          </td>
                          <td style={{ padding:'9px 10px',fontWeight:700,whiteSpace:'nowrap',
                            color:t.age_days>=7?C.red:t.age_days>=3?C.orange:'var(--gray-600)' }}>
                            {t.age_days>0?`${t.age_days} วัน`:`${t.age_hours} ชม.`}
                          </td>
                          <td style={{ padding:'9px 10px' }}>
                            {t.sla_status==='BREACHED'&&<span style={{ fontSize:'0.72rem',color:C.red,fontWeight:600 }}>เกิน SLA</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions — Export Only */}
        <div style={{ marginTop:8 }}>
          <button onClick={handleExportAll} disabled={exporting}
            style={{ ...CARD,textAlign:'center',cursor:'pointer',border:`1.5px solid ${C.blue}`,
              display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'20px',width:'100%',
              opacity:exporting?.6:1,transition:'all .15s' }}>
            <span style={{ fontSize:'1.8rem' }}>📥</span>
            <span style={{ fontSize:'0.85rem',fontWeight:700,color:C.blue }}>
              {exporting?'กำลัง Export...':'📥 Export Excel ทั้งหมด'}
            </span>
          </button>
        </div>

      </div>
    </AppLayout>
  );
}