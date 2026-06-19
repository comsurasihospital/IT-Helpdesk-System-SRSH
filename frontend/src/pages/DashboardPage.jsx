// src/pages/DashboardPage.jsx — Dashboard v3
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import AppLayout from '../components/common/AppLayout';
import PublicLayout from '../components/common/PublicLayout';
import { useIsDesktop } from '../hooks/useBreakpoint';
import { publicDashboardAPI as dashboardAPI, exportAPI } from '../api/services';
import toast from 'react-hot-toast';

const minsToText = (m) => {
  if (m == null || m === '') return '-';
  const n = Number(m);
  if (n < 60)   return `${n} นาที`;
  if (n < 1440) return `${(n/60).toFixed(1)} ชม.`;
  return `${(n/1440).toFixed(1)} วัน`;
};
const shortCat = (n) => (n||'ไม่ระบุ')
  .replace('โปรแกรม HOSxP ขัดข้อง','HOSxP')
  .replace('เครื่องพิมพ์ขัดข้อง','Printer')
  .replace('เครื่องคอมพิวเตอร์ขัดข้อง','Computer')
  .replace('ระบบอินเทอร์เน็ตขัดข้อง','Network')
  .replace('การขอข้อมูลสารสนเทศทางการแพทย์','Info')
  .replace('การเผยแพร่ข่าวสาร ลงในเว็บไซต์และสื่อสังคมโรงพยาบาล','Publish');
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const todayStr = () => new Date().toISOString().slice(0,10);
const nDaysAgo = (n) => new Date(Date.now()-n*86400000).toISOString().slice(0,10);

const PALETTE = ['#2563eb','#16a34a','#ea580c','#7c3aed','#0891b2','#d97706','#be185d','#15803d','#9333ea','#b45309'];
const TT = {
  contentStyle: { background:'#1e293b', border:'none', borderRadius:10, fontSize:12, color:'white' },
  cursor: { fill:'rgba(0,0,0,0.04)' },
};
const RANGE_OPTS = [
  {v:'today',l:'วันนี้'},{v:'week',l:'7 วัน'},{v:'month',l:'30 วัน'},{v:'year',l:'ปีนี้'},{v:'all',l:'ทั้งหมด'},
];
const TAB_LIST = [
  {key:'overview', label:'ภาพรวม',       icon:'📊'},
  {key:'sla',      label:'SLA',           icon:'✅'},
  {key:'breakdown',label:'ประเภท / แผนก', icon:'📋'},
  {key:'aging',    label:'ค้างนาน',       icon:'🕐'},
  {key:'admin',    label:'Admin',          icon:'👤'},
];

const Skeleton = ({h=120}) => <div className="skeleton" style={{height:h, borderRadius:10}} />;

function StatCard({label,value,sub,color,bg,border,icon}) {
  return (
    <div style={{background:bg, border:`1.5px solid ${border}`, borderRadius:12, padding:'14px 16px', display:'flex', flexDirection:'column', gap:4}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <p style={{fontSize:'0.68rem', color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', margin:0}}>{label}</p>
        <span style={{width:24, height:24, borderRadius:7, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem'}}>{icon}</span>
      </div>
      <p style={{fontSize:'1.8rem', fontWeight:800, color:'var(--gray-800)', lineHeight:1, margin:0}}>{value}</p>
      <p style={{fontSize:'0.68rem', color:'var(--gray-400)', margin:0}}>{sub}</p>
    </div>
  );
}

function RangePill({value, onChange}) {
  return (
    <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
      {RANGE_OPTS.map(o => {
        const a = value===o.v;
        return (
          <button key={o.v} onClick={()=>onChange(o.v)} style={{
            padding:'4px 11px', fontSize:'0.72rem', borderRadius:20, cursor:'pointer',
            border:`1.5px solid ${a?'var(--primary)':'var(--border)'}`,
            background: a?'var(--primary)':'white',
            color: a?'white':'var(--gray-500)',
            fontWeight: a?600:400, transition:'all .15s',
          }}>{o.l}</button>
        );
      })}
    </div>
  );
}

function CardExportBtn({label, loading, onClick}) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display:'flex', alignItems:'center', gap:4,
      padding:'3px 10px', fontSize:'0.72rem', borderRadius:20, cursor:'pointer',
      border:'1px solid var(--border)', background:'#f8fafc',
      color:'var(--gray-500)', transition:'all .15s',
      opacity: loading?0.6:1, whiteSpace:'nowrap',
    }}>
      📥 {loading?'...':label}
    </button>
  );
}

function CardHeader({title, exportLabel, exportLoading, onExport}) {
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
      <p style={{fontSize:'0.88rem', fontWeight:700, color:'var(--gray-700)', margin:0}}>{title}</p>
      {onExport && <CardExportBtn label={exportLabel||'Export'} loading={exportLoading} onClick={onExport} />}
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange]       = useState('year');
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateTo, setDateTo]     = useState(todayStr());
  const [activeTab, setActiveTab] = useState('overview');

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingSla, setLoadingSla]           = useState(false);
  const [loadingBreak, setLoadingBreak]       = useState(false);
  const [loadingAging, setLoadingAging]       = useState(false);
  const [loadingAdmin, setLoadingAdmin]       = useState(false);

  // export loading แยกต่อปุ่ม
  const [expTab,      setExpTab]      = useState(false);
  const [expMonthly,  setExpMonthly]  = useState(false);
  const [expCat,      setExpCat]      = useState(false);
  const [expDept,     setExpDept]     = useState(false);
  const [expSlaD,     setExpSlaD]     = useState(false);
  const [expSlaCat,   setExpSlaCat]   = useState(false);
  const [expBreak,    setExpBreak]    = useState(false);
  const [expAging,    setExpAging]    = useState(false);
  const [expAdmin,    setExpAdmin]    = useState(false);

  const [summary,  setSummary]  = useState(null);
  const [monthly,  setMonthly]  = useState([]);
  const [catData,  setCatData]  = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [slaByDept,  setSlaByDept]  = useState([]);
  const [slaByCat,   setSlaByCat]   = useState([]);
  const [slaTrend,   setSlaTrend]   = useState([]);
  const [deptList,   setDeptList]   = useState([]); // [{id, name}]
  const [catList,    setCatList]    = useState([]);
  const [breakDept,  setBreakDept]  = useState(''); // department_id
  const [breakCat,   setBreakCat]   = useState('');
  const [breakData,  setBreakData]  = useState([]);
  const [agingDays,  setAgingDays]  = useState(3);
  const [agingData,  setAgingData]  = useState([]);
  const [adminData,  setAdminData]  = useState([]);

  const buildParams = useCallback(() => {
    if (range==='custom') return {range:'custom', dateFrom, dateTo};
    return {range};
  }, [range, dateFrom, dateTo]);

  const handleRange = (v) => {
    setRange(v);
    const today = todayStr();
    if (v==='today') { setDateFrom(today);  setDateTo(today); }
    if (v==='week')  { setDateFrom(nDaysAgo(7));  setDateTo(today); }
    if (v==='month') { setDateFrom(nDaysAgo(30)); setDateTo(today); }
    if (v==='year')  { setDateFrom(`${new Date().getFullYear()}-01-01`); setDateTo(today); }
    if (v==='all')   { setDateFrom('2020-01-01'); setDateTo(today); }
  };

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const p = buildParams();
      const [s,m,c,d] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getMonthlyChart(p),
        dashboardAPI.getCategoryChart(p),
        dashboardAPI.getDeptChart(p),
      ]);
      setSummary(s.data.data?.summary||{});
      setMonthly((m.data.data||[]).map(r=>({
        name:r.period_label, total:Number(r.total||0),
        resolved:Number(r.resolved||0), in_progress:Number(r.in_progress||0), cancelled:Number(r.cancelled||0),
      })));
      setCatData((c.data.data||[]).map(r=>({name:shortCat(r.category_name), value:Number(r.total_tickets||0)})));
      setDeptData((d.data.data||[]).slice(0,8));
    } catch(err) { console.error('loadOverview:',err); toast.error('โหลด Overview ไม่สำเร็จ'); }
    finally { setLoadingOverview(false); }
  }, [buildParams]);

  const loadSla = useCallback(async () => {
    setLoadingSla(true);
    try {
      const p = buildParams();
      const [d,c,t] = await Promise.all([
        dashboardAPI.getSlaByDept(p),
        dashboardAPI.getSlaByCategory(p),
        dashboardAPI.getSlaMonthlyTrend(12),
      ]);
      setSlaByDept(d.data.data||[]);
      setSlaByCat(c.data.data||[]);
      setSlaTrend(t.data.data||[]);
    } catch(err) { console.error('loadSla:',err); toast.error('โหลด SLA ไม่สำเร็จ'); }
    finally { setLoadingSla(false); }
  }, [buildParams]);

  const loadBreakdown = useCallback(async () => {
    setLoadingBreak(true);
    try {
      const p = buildParams();
      // breakCat คือ code ของ category ส่งตรงให้ backend
      const r = await dashboardAPI.getDeptBreakdown(breakDept||undefined, p.range, breakCat||undefined);
      setBreakData(r.data.data||[]);
    } catch(err) { console.error('loadBreakdown:',err); toast.error('โหลด Breakdown ไม่สำเร็จ'); }
    finally { setLoadingBreak(false); }
  }, [buildParams, breakDept, breakCat]);

  const loadAging = useCallback(async () => {
    setLoadingAging(true);
    try {
      const r = await dashboardAPI.getAgingTickets(agingDays);
      setAgingData(r.data.data||[]);
    } catch(err) { console.error('loadAging:',err); toast.error('โหลด Aging ไม่สำเร็จ'); }
    finally { setLoadingAging(false); }
  }, [agingDays]);

  const loadAdmin = useCallback(async () => {
    setLoadingAdmin(true);
    try {
      const p = buildParams();
      const r = await dashboardAPI.getAdminWorkload(p);
      setAdminData(r.data.data||[]);
    } catch(err) { console.error('loadAdmin:',err); toast.error('โหลด Admin ไม่สำเร็จ'); }
    finally { setLoadingAdmin(false); }
  }, [buildParams]);

  useEffect(() => {
    dashboardAPI.getDeptBreakdown(undefined,'all').then(r=>{
      const rows = r.data.data||[];
      // deptList เก็บ {id, name} เพื่อส่ง id ให้ backend
      const deptMap = {};
      rows.forEach(x => { if (x.department_id && x.department_name) deptMap[x.department_id] = x.department_name; });
      setDeptList(Object.entries(deptMap).map(([id, name]) => ({ id, name })));
      // catList เก็บ {name, code} เพื่อส่ง code ให้ backend filter
      const catMap = {};
      rows.forEach(x => { if (x.category_name) catMap[x.category_name] = x.category_code || x.category_name; });
      setCatList(Object.entries(catMap).map(([name, code]) => ({ name, code })));
    }).catch(()=>{});
  }, []);

  useEffect(()=>{ if(activeTab==='overview')  loadOverview(); }, [activeTab,range,dateFrom,dateTo]);
  useEffect(()=>{ if(activeTab==='sla')       loadSla();      }, [activeTab,range,dateFrom,dateTo]);
  useEffect(()=>{ if(activeTab==='breakdown') loadBreakdown();}, [activeTab,range,breakDept,breakCat]);
  useEffect(()=>{ if(activeTab==='aging')     loadAging();    }, [activeTab,agingDays]);
  useEffect(()=>{ if(activeTab==='admin')     loadAdmin();    }, [activeTab,range,dateFrom,dateTo]);

  // ── Export helpers ──────────────────────────────────────────────
  const doExport = async (setLoading, apiFn, filename) => {
    setLoading(true);
    try {
      const res = await apiFn();
      downloadBlob(res.data, filename);
      toast.success('Export สำเร็จ');
    } catch { toast.error('Export ไม่สำเร็จ'); }
    finally { setLoading(false); }
  };

  const fn  = (name) => `helpdesk_${name}_${dateFrom}_${dateTo}.xlsx`;

  // Tab bar export = tickets ตาม date range ปัจจุบัน
  const exportTabFn = {
    overview:  () => exportAPI.downloadXlsx({startDate:dateFrom, endDate:dateTo}),
    sla:       () => exportAPI.downloadSla(dateFrom, dateTo),
    breakdown: () => exportAPI.downloadBreakdown(dateFrom, dateTo),
    aging:     () => exportAPI.downloadAging(agingDays),
    admin:     () => exportAPI.downloadAdmin(dateFrom, dateTo),
  };
  const handleExportTab = () => doExport(setExpTab, exportTabFn[activeTab], fn(activeTab));

  // Per-card exports
  const handleExpMonthly  = () => doExport(setExpMonthly,  ()=>exportAPI.downloadXlsx({startDate:dateFrom, endDate:dateTo}),      fn('monthly'));
  const handleExpCat      = () => doExport(setExpCat,      ()=>exportAPI.downloadXlsx({startDate:dateFrom, endDate:dateTo}),      fn('category'));
  const handleExpDept     = () => doExport(setExpDept,     ()=>exportAPI.downloadXlsx({startDate:dateFrom, endDate:dateTo}),      fn('department'));
  const handleExpSlaD     = () => doExport(setExpSlaD,     ()=>exportAPI.downloadSla(dateFrom, dateTo),                          fn('sla_dept'));
  const handleExpSlaCat   = () => doExport(setExpSlaCat,   ()=>exportAPI.downloadSla(dateFrom, dateTo),                          fn('sla_category'));
  const handleExpBreak    = () => doExport(setExpBreak,    ()=>exportAPI.downloadBreakdown(dateFrom, dateTo),                    fn('breakdown'));
  const handleExpAging    = () => doExport(setExpAging,    ()=>exportAPI.downloadAging(agingDays),                               fn('aging'));
  const handleExpAdmin    = () => doExport(setExpAdmin,    ()=>exportAPI.downloadAdmin(dateFrom, dateTo),                        fn('admin'));

  const CARD = {
    background:'white', borderRadius:14, padding:'16px',
    border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
  };
  const location = useLocation();
  const isPublic = location.pathname === '/public-dashboard';
  const Layout = isPublic ? PublicLayout : AppLayout;
  const isDesktop = useIsDesktop();

  const deptMax = deptData.reduce((a,d)=>Math.max(a, d.total_tickets||d.cnt||0), 1);
  const currentTabLabel = TAB_LIST.find(t=>t.key===activeTab)?.label||'';

  return (
    <Layout title="Dashboard">
      <div style={{display:'flex', flexDirection:'column', gap:0, paddingBottom:40}}>

        {/* ── Top bar ── */}
        <div style={{background:'white', borderBottom:'1px solid var(--border)', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
            <div style={{display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'#f8fafc', border:'1px solid var(--border)', borderRadius:20, fontSize:'0.78rem'}}>
              <span style={{color:'var(--gray-400)'}}>📅</span>
              <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setRange('custom');}}
                style={{border:'none', background:'transparent', fontSize:'0.78rem', outline:'none', color:'var(--gray-700)', width:100}} />
              <span style={{color:'var(--gray-400)'}}>—</span>
              <input type="date" value={dateTo} min={dateFrom} onChange={e=>{setDateTo(e.target.value);setRange('custom');}}
                style={{border:'none', background:'transparent', fontSize:'0.78rem', outline:'none', color:'var(--gray-700)', width:100}} />
            </div>
            <RangePill value={range} onChange={handleRange} />
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{background:'white', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'stretch', paddingLeft:isDesktop?16:0}}>
          <div style={{display:'flex', flex:1, overflowX:'auto'}}>
            {TAB_LIST.map(tab=>(
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'10px 14px', fontSize:'0.82rem', cursor:'pointer',
                background:'none', border:'none',
                borderBottom: activeTab===tab.key ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                color: activeTab===tab.key ? 'var(--primary)' : 'var(--gray-500)',
                fontWeight: activeTab===tab.key ? 700 : 400,
                whiteSpace:'nowrap', transition:'all .15s',
              }}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
          <button onClick={handleExportTab} disabled={expTab} style={{
            display:'flex', alignItems:'center', gap:5,
            padding:'8px 14px', fontSize:'0.78rem', cursor:'pointer',
            background:'none', border:'none',
            borderLeft:'1px solid var(--border)',
            borderBottom:'2.5px solid transparent',
            color: expTab ? 'var(--gray-300)' : 'var(--gray-500)',
            transition:'all .15s', whiteSpace:'nowrap',
          }}>
            📥 {expTab ? 'กำลัง Export...' : `Export ${currentTabLabel}`}
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{padding: isDesktop ? '20px 24px 0' : '12px 12px 0'}}>

          {/* ════ OVERVIEW ════ */}
          {activeTab==='overview' && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div style={{ display:'grid', gridTemplateColumns: isDesktop ? 'repeat(5,1fr)' : 'repeat(2,1fr)', gap:10 }}>
                {loadingOverview && !summary
                  ? Array(5).fill(0).map((_,i)=><Skeleton key={i} h={90}/>)
                  : (<>
                    <StatCard label="รอรับงาน"    value={summary?.open_tickets||0}       sub="OPEN"        icon="🔔" color="#dc2626" bg="#fef2f2" border="#fecaca"/>
                    <StatCard label="กำลังดำเนิน" value={summary?.in_progress_tickets||0} sub="IN PROGRESS" icon="⚙️" color="#ea580c" bg="#fff7ed" border="#fed7aa"/>
                    <StatCard label="เสร็จสิ้น"   value={summary?.resolved_tickets||0}   sub="RESOLVED"    icon="✅" color="#16a34a" bg="#f0fdf4" border="#bbf7d0"/>
                    <StatCard label="วันนี้"       value={summary?.today_tickets||0}      sub="TODAY"       icon="📅" color="#2563eb" bg="#eff6ff" border="#bfdbfe"/>
                    <StatCard label="เกิน SLA"    value={summary?.sla_breached||0}       sub="BREACHED"    icon="⚠️"
                      color={summary?.sla_breached>0?'#dc2626':'#6b7280'}
                      bg={summary?.sla_breached>0?'#fef2f2':'#f9fafb'}
                      border={summary?.sla_breached>0?'#fecaca':'#e5e7eb'}/>
                  </>)}
              </div>

              <div style={CARD}>
                <CardHeader title="จำนวน Ticket รายเดือน"/>
                {loadingOverview ? <Skeleton h={220}/> : monthly.length===0
                  ? <p style={{textAlign:'center',color:'var(--gray-400)',padding:32}}>ยังไม่มีข้อมูล</p>
                  : <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthly} margin={{top:4,right:4,left:-20,bottom:0}}>
                        <XAxis dataKey="name" tick={{fontSize:11}}/>
                        <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                        <Tooltip {...TT}/><Legend wrapperStyle={{fontSize:11}}/>
                        <Bar dataKey="total"       name="ทั้งหมด"     fill="#93c5fd" radius={[3,3,0,0]}/>
                        <Bar dataKey="resolved"    name="เสร็จสิ้น"   fill="#86efac" radius={[3,3,0,0]}/>
                        <Bar dataKey="in_progress" name="กำลังดำเนิน" fill="#fdba74" radius={[3,3,0,0]}/>
                        <Bar dataKey="cancelled"   name="ยกเลิก"      fill="#d1d5db" radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap:14 }}>
                <div style={CARD}>
                  <CardHeader title="ประเภทปัญหา"/>
                  {loadingOverview ? <Skeleton h={180}/> : catData.length===0
                    ? <p style={{textAlign:'center',color:'var(--gray-400)',padding:24}}>ยังไม่มีข้อมูล</p>
                    : <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={catData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name"
                            label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                            labelLine={false} style={{fontSize:10}}>
                            {catData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
                          </Pie>
                          <Tooltip {...TT}/>
                        </PieChart>
                      </ResponsiveContainer>}
                </div>
                <div style={CARD}>
                  <CardHeader title="Top แผนก"/>
                  {loadingOverview
                    ? Array(5).fill(0).map((_,i)=><Skeleton key={i} h={22}/>)
                    : deptData.map((d,i)=>{
                      const cnt = d.total_tickets||d.cnt||0;
                      return (
                        <div key={d.department_id||i} style={{marginBottom:10}}>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                            <span style={{fontSize:'0.78rem', color:'var(--gray-700)'}}>
                              <span style={{width:16,height:16,borderRadius:'50%',background:PALETTE[i%PALETTE.length],display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'0.55rem',fontWeight:800,color:'white',marginRight:6}}>{i+1}</span>
                              {d.department_name}
                            </span>
                            <span style={{fontSize:'0.75rem',fontWeight:700}}>{cnt}</span>
                          </div>
                          <div style={{height:5,background:'#f1f5f9',borderRadius:3,overflow:'hidden'}}>
                            <div style={{height:'100%',borderRadius:3,width:`${Math.round(cnt/deptMax*100)}%`,background:PALETTE[i%PALETTE.length],transition:'width .5s'}}/>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ════ SLA ════ */}
          {activeTab==='sla' && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {loadingSla
                ? <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>{Array(4).fill(0).map((_,i)=><Skeleton key={i} h={72}/>)}</div>
                : slaByCat.length>0 && (()=>{
                  const totalAll  = slaByCat.reduce((s,r)=>s+Number(r.total||0),0);
                  const onTimeAll = slaByCat.reduce((s,r)=>s+Number(r.on_time||0),0);
                  const pct    = totalAll>0?Math.round(onTimeAll/totalAll*100):0;
                  const avgArr = slaByCat.map(r=>Number(r.avg_resolve_minutes||0)).filter(Boolean);
                  const minArr = slaByCat.map(r=>Number(r.min_resolve_minutes||0)).filter(Boolean);
                  const maxArr = slaByCat.map(r=>Number(r.max_resolve_minutes||0)).filter(Boolean);
                  const avgAll = avgArr.length?Math.round(avgArr.reduce((a,b)=>a+b)/avgArr.length):null;
                  const minAll = minArr.length?Math.min(...minArr):null;
                  const maxAll = maxArr.length?Math.max(...maxArr):null;
                  return (
                    <div style={{ display:'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap:10 }}>
                      {[
                        {l:'ทันเวลา SLA', v:`${pct}%`,          c:pct>=90?'#16a34a':'#dc2626', bg:pct>=90?'#f0fdf4':'#fef2f2', bd:pct>=90?'#bbf7d0':'#fecaca'},
                        {l:'เฉลี่ยแก้ไข', v:minsToText(avgAll), c:'#2563eb', bg:'#eff6ff', bd:'#bfdbfe'},
                        {l:'เร็วสุด',      v:minsToText(minAll), c:'#16a34a', bg:'#f0fdf4', bd:'#bbf7d0'},
                        {l:'ช้าสุด',      v:minsToText(maxAll), c:'#dc2626', bg:'#fef2f2', bd:'#fecaca'},
                      ].map(k=>(
                        <div key={k.l} style={{background:k.bg,border:`1.5px solid ${k.bd}`,borderRadius:12,padding:'12px 14px'}}>
                          <p style={{fontSize:'0.68rem',color:k.c,fontWeight:700,textTransform:'uppercase',margin:'0 0 6px'}}>{k.l}</p>
                          <p style={{fontSize:'1.5rem',fontWeight:800,color:'var(--gray-800)',margin:0,lineHeight:1}}>{k.v}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

              <div style={CARD}>
                <CardHeader title="SLA รายประเภทปัญหา"/>
                {loadingSla ? <Skeleton h={160}/> : slaByCat.length===0
                  ? <p style={{textAlign:'center',color:'var(--gray-400)',padding:24}}>ยังไม่มีข้อมูล</p>
                  : <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.8rem'}}>
                        <thead>
                          <tr style={{background:'#f8fafc'}}>
                            {['ประเภท','SLA เป้า','ทันเวลา','avg','min','max','สถานะ'].map(h=>(
                              <th key={h} style={{padding:'9px 10px',textAlign:'left',fontWeight:600,color:'var(--gray-500)',fontSize:'0.72rem',borderBottom:'2px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {slaByCat.map((r,i)=>{
                            const ok=Number(r.on_time_pct||0)>=90;
                            return (
                              <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                                <td style={{padding:'9px 10px',fontWeight:600,color:'var(--gray-700)'}}>{shortCat(r.category_name)}</td>
                                <td style={{padding:'9px 10px',color:'var(--gray-500)'}}>{minsToText(r.sla_target)}</td>
                                <td style={{padding:'9px 10px',fontWeight:700,color:ok?'#16a34a':'#dc2626'}}>{r.on_time_pct}%</td>
                                <td style={{padding:'9px 10px',color:'var(--gray-600)'}}>{minsToText(r.avg_resolve_minutes)}</td>
                                <td style={{padding:'9px 10px',color:'#16a34a',fontWeight:600}}>{minsToText(r.min_resolve_minutes)}</td>
                                <td style={{padding:'9px 10px',color:'#dc2626',fontWeight:600}}>{minsToText(r.max_resolve_minutes)}</td>
                                <td style={{padding:'9px 10px'}}>
                                  <span style={{fontSize:'0.7rem',padding:'2px 8px',borderRadius:20,fontWeight:600,background:ok?'#f0fdf4':'#fef2f2',color:ok?'#16a34a':'#dc2626'}}>
                                    {ok?'✅ ทัน SLA':'⚠️ ใกล้เกิน'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>}
              </div>

              <div style={CARD}>
                <CardHeader title="SLA รายแผนก"/>
                {loadingSla ? <Skeleton h={200}/> : slaByDept.length===0
                  ? <p style={{textAlign:'center',color:'var(--gray-400)',padding:24}}>ยังไม่มีข้อมูล</p>
                  : <ResponsiveContainer width="100%" height={Math.max(160,slaByDept.length*40)}>
                      <BarChart data={slaByDept} layout="vertical" margin={{top:4,right:80,left:8,bottom:4}}>
                        <XAxis type="number" domain={[0,100]} tick={{fontSize:11}} tickFormatter={v=>`${v}%`}/>
                        <YAxis type="category" dataKey="department_name" tick={{fontSize:11}} width={120}/>
                        <Tooltip {...TT} formatter={v=>[`${v}%`,'ทันเวลา']}/>
                        <Bar dataKey="on_time_pct" name="ทันเวลา %" fill="#16a34a" radius={[0,4,4,0]}
                          label={{position:'right',fontSize:11,fill:'#6b7280',formatter:v=>`${v}%`}}/>
                      </BarChart>
                    </ResponsiveContainer>}
              </div>

              <div style={CARD}>
                <CardHeader title="Trend SLA รายเดือน (12 เดือน)"/>
                {loadingSla ? <Skeleton h={180}/> : slaTrend.length===0
                  ? <p style={{textAlign:'center',color:'var(--gray-400)',padding:24}}>ยังไม่มีข้อมูล</p>
                  : <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={slaTrend} margin={{top:4,right:20,left:-20,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                        <XAxis dataKey="period_label" tick={{fontSize:11}}/>
                        <YAxis domain={[0,100]} tick={{fontSize:11}} tickFormatter={v=>`${v}%`}/>
                        <Tooltip {...TT} formatter={v=>[`${v}%`,'% ทันเวลา']}/>
                        <Line type="monotone" dataKey="on_time_pct" stroke="#2563eb" strokeWidth={2} dot={{r:3}}/>
                      </LineChart>
                    </ResponsiveContainer>}
              </div>
            </div>
          )}

          {/* ════ BREAKDOWN ════ */}
          {activeTab==='breakdown' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={CARD}>
                <CardHeader title="ประเภทปัญหาตามแผนก"/>
                <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:16}}>
                  <div>
                    <label style={{fontSize:'0.72rem',color:'var(--gray-500)',display:'block',marginBottom:4}}>แผนก</label>
                    <select value={breakDept} onChange={e=>setBreakDept(e.target.value)}
                      style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border)',fontSize:'0.8rem',background:'white',minWidth:160}}>
                      <option value="">ทุกแผนก</option>
                      {deptList.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:'0.72rem',color:'var(--gray-500)',display:'block',marginBottom:4}}>ประเภทปัญหา</label>
                    <select value={breakCat} onChange={e=>setBreakCat(e.target.value)}
                      style={{padding:'5px 10px',borderRadius:8,border:'1px solid var(--border)',fontSize:'0.8rem',background:'white',minWidth:160}}>
                      <option value="">ทุกประเภท</option>
                      {catList.map(c=><option key={c.code} value={c.code}>{shortCat(c.name)}</option>)}
                    </select>
                  </div>
                  <div style={{fontSize:'0.72rem',color:'var(--gray-400)',marginTop:16}}>
                    {!breakDept&&!breakCat&&'แสดง: ทุกแผนก × ทุกประเภท'}
                    {breakDept&&!breakCat&&`แสดง: "${deptList.find(d=>d.id==breakDept)?.name}" — ทุกประเภท`}
                    {!breakDept&&breakCat&&`แสดง: "${shortCat(catList.find(c=>c.code===breakCat)?.name||breakCat)}" — ทุกแผนก`}
                    {breakDept&&breakCat&&`แสดง: "${deptList.find(d=>d.id==breakDept)?.name}" × "${shortCat(catList.find(c=>c.code===breakCat)?.name||breakCat)}"`}
                  </div>
                </div>
                {loadingBreak ? <Skeleton h={280}/> : breakData.length===0
                  ? <p style={{textAlign:'center',color:'var(--gray-400)',padding:32}}>ยังไม่มีข้อมูล</p>
                  : (()=>{
                    if (breakDept) {
                      const cats=[...new Set(breakData.map(r=>r.category_name))];
                      const cd=cats.map(cat=>{
                        const rows=breakData.filter(r=>r.category_name===cat);
                        return {name:shortCat(cat),
                          เสร็จสิ้น:   rows.reduce((s,r)=>s+Number(r.resolved||0),0),
                          กำลังดำเนิน: rows.reduce((s,r)=>s+Number(r.in_progress||0),0),
                          รอรับงาน:    rows.reduce((s,r)=>s+Number(r.open_tickets||0),0),
                        };
                      });
                      return (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={cd} margin={{top:4,right:4,left:-20,bottom:30}}>
                            <XAxis dataKey="name" tick={{fontSize:11}} angle={-15} textAnchor="end" interval={0}/>
                            <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                            <Tooltip {...TT}/><Legend wrapperStyle={{fontSize:11}}/>
                            <Bar dataKey="เสร็จสิ้น"   stackId="a" fill="#86efac" radius={[0,0,0,0]}/>
                            <Bar dataKey="กำลังดำเนิน" stackId="a" fill="#fdba74" radius={[0,0,0,0]}/>
                            <Bar dataKey="รอรับงาน"    stackId="a" fill="#fca5a5" radius={[3,3,0,0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    } else {
                      const depts=[...new Set(breakData.map(r=>r.department_name))];
                      const cats=[...new Set(breakData.map(r=>r.category_name).filter(Boolean))];
                      const cd=depts.map(dept=>{
                        const obj={name:dept};
                        cats.forEach(cat=>{
                          const row=breakData.find(r=>r.department_name===dept&&r.category_name===cat);
                          obj[shortCat(cat)]=row?Number(row.total||0):0;
                        });
                        return obj;
                      });
                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={cd} margin={{top:4,right:4,left:-20,bottom:60}}>
                            <XAxis dataKey="name" tick={{fontSize:10}} angle={-30} textAnchor="end" interval={0}/>
                            <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                            <Tooltip {...TT}/><Legend wrapperStyle={{fontSize:11}}/>
                            {cats.map((cat,i)=>(
                              <Bar key={cat} dataKey={shortCat(cat)} stackId="a" fill={PALETTE[i%PALETTE.length]}
                                radius={i===cats.length-1?[3,3,0,0]:[0,0,0,0]}/>
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    }
                  })()}
              </div>
            </div>
          )}

          {/* ════ AGING ════ */}
          {activeTab==='aging' && (
            <div style={CARD}>
              <CardHeader title="Ticket ค้างนาน"/>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                <span style={{fontSize:'0.82rem',color:'var(--gray-600)'}}>เกิน</span>
                {[1,3,7,14,30].map(d=>{
                  const a=agingDays===d;
                  return (
                    <button key={d} onClick={()=>setAgingDays(d)} style={{
                      padding:'4px 14px',borderRadius:20,cursor:'pointer',fontSize:'0.78rem',
                      fontWeight:a?700:400, border:`1.5px solid ${a?'#dc2626':'var(--border)'}`,
                      background:a?'#fef2f2':'white', color:a?'#dc2626':'var(--gray-500)', transition:'all .15s',
                    }}>{d} วัน</button>
                  );
                })}
                {agingData.length>0 && (
                  <span style={{marginLeft:'auto',fontSize:'0.78rem',fontWeight:700,color:'#dc2626',background:'#fef2f2',padding:'4px 12px',borderRadius:20,border:'1px solid #fecaca'}}>
                    {agingData.length} รายการ
                  </span>
                )}
              </div>
              {loadingAging ? <Skeleton h={180}/> : agingData.length===0
                ? <div style={{textAlign:'center',padding:'32px 16px'}}>
                    <div style={{fontSize:'2rem',marginBottom:8}}>✅</div>
                    <p style={{color:'#16a34a',fontWeight:600,fontSize:'0.88rem'}}>ไม่มี Ticket ค้างนาน</p>
                  </div>
                : <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.8rem'}}>
                      <thead>
                        <tr style={{background:'#f8fafc'}}>
                          {['Ticket No.','หัวข้อ','ผู้แจ้ง','แผนก','สถานะ','ค้างมา','SLA'].map(h=>(
                            <th key={h} style={{padding:'9px 10px',textAlign:'left',fontWeight:600,color:'var(--gray-500)',fontSize:'0.72rem',borderBottom:'2px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {agingData.map((t,i)=>{
                          const sc=t.status==='OPEN'?'#dc2626':'#ea580c';
                          const sb=t.status==='OPEN'?'#fef2f2':'#fff7ed';
                          return (
                            <tr key={i} style={{borderBottom:'1px solid #f8fafc',background:i%2===0?'white':'#f8fafc'}}>
                              <td style={{padding:'9px 10px',fontWeight:700,color:'#2563eb',whiteSpace:'nowrap'}}>{t.ticket_no}</td>
                              <td style={{padding:'9px 10px',color:'var(--gray-700)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</td>
                              <td style={{padding:'9px 10px',color:'var(--gray-600)',whiteSpace:'nowrap'}}>{t.user_name}</td>
                              <td style={{padding:'9px 10px',color:'var(--gray-600)',whiteSpace:'nowrap'}}>{t.department_name}</td>
                              <td style={{padding:'9px 10px'}}><span style={{padding:'2px 10px',borderRadius:20,fontSize:'0.72rem',fontWeight:600,background:sb,color:sc}}>{t.status==='OPEN'?'รอรับงาน':'กำลังดำเนิน'}</span></td>
                              <td style={{padding:'9px 10px',fontWeight:700,whiteSpace:'nowrap',color:t.age_days>=7?'#dc2626':t.age_days>=3?'#ea580c':'var(--gray-600)'}}>
                                {t.age_days>0?`${t.age_days} วัน`:`${t.age_hours} ชม.`}
                              </td>
                              <td style={{padding:'9px 10px'}}>{t.sla_status==='BREACHED'&&<span style={{fontSize:'0.72rem',color:'#dc2626',fontWeight:600}}>⚠️ เกิน SLA</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>}
            </div>
          )}

          {/* ════ ADMIN ════ */}
          {activeTab==='admin' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {loadingAdmin
                ? Array(3).fill(0).map((_,i)=><Skeleton key={i} h={120}/>)
                : adminData.length===0
                  ? <p style={{textAlign:'center',color:'var(--gray-400)',padding:32}}>ยังไม่มีข้อมูล</p>
                  : adminData.map((a,i)=>{
                    const sat=parseFloat(a.avg_satisfaction);
                    const stars=isNaN(sat)?null:Math.round(sat);
                    return (
                      <div key={i} style={{...CARD,display:'flex',flexDirection:'column',gap:12}}>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          <div style={{width:40,height:40,borderRadius:'50%',flexShrink:0,
                            background:`linear-gradient(135deg,${PALETTE[i%PALETTE.length]},${PALETTE[(i+1)%PALETTE.length]})`,
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.82rem',fontWeight:800,color:'white'}}>
                            {(a.admin_name||'?').slice(0,2)}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:'0.95rem',fontWeight:700,color:'var(--gray-800)'}}>{a.admin_name}</div>
                            <div style={{fontSize:'0.72rem',color:'var(--gray-400)'}}>IT Admin</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            {stars!=null
                              ? (<>
                                  <div style={{fontSize:'0.95rem',color:'#f59e0b',letterSpacing:2}}>{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</div>
                                  <div style={{fontSize:'0.72rem',color:'var(--gray-500)'}}>{sat.toFixed(1)} / 5.0{a.rated_count>0&&` (${a.rated_count} รีวิว)`}</div>
                                </>)
                              : <div style={{fontSize:'0.72rem',color:'var(--gray-400)'}}>ยังไม่มีรีวิว</div>}
                            <div style={{fontSize:'0.65rem',color:'var(--gray-400)'}}>ความพึงพอใจ</div>
                          </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns: isDesktop ? 'repeat(6,1fr)' : 'repeat(3,1fr)', gap:8 }}>
                          {[
                            {l:'รับงาน',      v:a.assigned,           c:'#2563eb'},
                            {l:'เสร็จสิ้น',   v:a.resolved,           c:'#16a34a'},
                            {l:'กำลังดำเนิน', v:a.in_progress,        c:'#ea580c'},
                            {l:'avg',         v:minsToText(a.avg_mins), c:'var(--gray-600)', small:true},
                            {l:'min',         v:minsToText(a.min_mins), c:'#16a34a', small:true},
                            {l:'max',         v:minsToText(a.max_mins), c:'#dc2626', small:true},
                          ].map(s=>(
                            <div key={s.l} style={{background:'#f8fafc',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                              <div style={{fontSize:'0.65rem',color:'var(--gray-400)',marginBottom:3}}>{s.l}</div>
                              <div style={{fontSize:s.small?'0.9rem':'1.4rem',fontWeight:s.small?600:700,color:s.c,lineHeight:1}}>{s.v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}