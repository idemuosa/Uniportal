import { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { 
  GraduationCap, BookOpen, CreditCard, ShieldCheck,
  MapPin, Fingerprint, ArrowRight, Bell, Sparkles, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import AttendanceLogger from '../../components/AttendanceLogger';

export default function StudentPortal({ user }: { user: UserProfile }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [examResult, setExamResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payRes, examRes] = await Promise.all([
          api.get('/finances/payments/').catch(() => ({ data: [] })),
          api.get('/academics/entrance-exams/my-result', {
            params: { regNo: user.jambRegNo || undefined, uid: user.uid || undefined }
          }).catch(() => ({ data: null }))
        ]);
        setPayments(payRes.data);
        if (examRes.data) {
          setExamResult(examRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = [
    { label: 'Academic Standing', value: 'Good', icon: <Award className="text-emerald-500" /> },
    { label: 'Semester Progress', value: '65%', icon: <Target className="text-blue-500" /> },
    { label: 'Wallet Balance', value: '₦0.00', icon: <Wallet className="text-amber-500" /> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto px-4">
      {/* 🚀 COMMAND CENTER HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-emerald-950 p-10 rounded-[3rem] border border-emerald-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="w-3 h-3 inline mr-2" /> Live Session Active
            </span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
            Welcome back, <br /> <span className="text-emerald-400">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-emerald-100/40 text-sm font-bold uppercase tracking-widest max-w-md">
            Federal University Lukke • Matric No: {user.matricNo || 'LUK/2025/102'}
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
           <Link to="/courses" className="px-8 py-4 bg-emerald-500 text-emerald-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3">
             Register Courses <ArrowRight className="w-4 h-4" />
           </Link>
        </div>
      </div>

      {/* 📊 CORE STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-emerald-900/5 shadow-xl hover:border-emerald-500/20 transition-all group">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {s.icon}
            </div>
            <p className="text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em]">{s.label}</p>
            <p className="text-2xl font-black text-emerald-900 tracking-tighter mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* 📋 MAIN ACTIVITY FEED */}
        <div className="lg:col-span-8 space-y-8">
           {/* ENTRANCE EXAM & ADMISSION GUARANTEE BANNER */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-900/10 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-950 uppercase italic tracking-tight">
                      Entrance Exam & Admission Status
                    </h3>
                    <p className="text-xs text-emerald-900/50 font-bold uppercase tracking-wider">
                      CBT Assessment & Registry Release
                    </p>
                  </div>
                </div>

                <Link
                  to="/entrance-exam"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
                >
                  {examResult ? 'View Exam Details' : 'Take CBT Entrance Exam'} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {examResult ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-emerald-900/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Registration No: <span className="text-slate-900">{examResult.registrationNumber}</span>
                    </p>
                    <p className="text-2xl font-black text-emerald-700">
                      Score: {examResult.percentage}% ({examResult.stream})
                    </p>
                  </div>

                  <div>
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest inline-block ${
                      examResult.admissionGuaranteed || examResult.status === 'released'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {examResult.admissionGuaranteed || examResult.status === 'released'
                        ? '✓ ADMISSION GUARANTEED & RELEASED'
                        : '⏳ Pending Registry Release'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 text-xs text-emerald-900/70 font-medium">
                  Take your departmental or Direct Entry entrance CBT exam using your Registration Number. Once completed, your score will be reviewed by Admin to guarantee your admission.
                </div>
              )}
           </div>

           <div className="bg-slate-50 p-10 rounded-[4rem] border border-emerald-900/5 relative overflow-hidden min-h-[500px]">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-emerald-900 uppercase italic tracking-tighter flex items-center gap-4">
                  <Bell className="w-5 h-5 opacity-30" /> Academic Timeline
                </h3>
              </div>

              <div className="space-y-6">
                 {[
                   { title: 'Admission Finalized', desc: 'Registry has cleared your biometric data.', time: '2 days ago', status: 'success' },
                   { title: 'Course Enrollment', desc: 'Semester registration is now open.', time: '1 week ago', status: 'info' },
                   { title: 'Payment Reminder', desc: 'Tuition settlement deadline approaching.', time: 'Ongoing', status: 'warning' },
                 ].map((item, i) => (
                   <div key={i} className="flex gap-6 items-start group">
                      <div className="w-1.5 h-12 rounded-full bg-emerald-500/10 relative">
                        <div className={`absolute top-0 left-0 w-full h-1/2 rounded-full ${item.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-emerald-900 uppercase italic">{item.title}</p>
                        <p className="text-xs text-emerald-900/40 font-bold uppercase tracking-widest">{item.desc}</p>
                        <p className="text-[9px] text-emerald-500 font-black uppercase mt-2">{item.time}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 🛠️ QUICK TOOLS */}
        <div className="lg:col-span-4 space-y-8">
           <AttendanceLogger user={user} />

           <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm"><ShieldCheck className="text-emerald-600" /></div>
                <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Verify Identity</h4>
              </div>
              <p className="text-[10px] text-emerald-900/50 font-bold uppercase leading-relaxed tracking-wider">
                Access restricted areas using your biometric fingerprint or face ID.
              </p>
              <button className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-900/20 hover:bg-emerald-950 transition-all flex items-center justify-center gap-3">
                <Fingerprint className="w-4 h-4" /> Initialize Scan
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// Helper icons
function Award({ className }: { className?: string }) { return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>; }
function Target({ className }: { className?: string }) { return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>; }
function Wallet({ className }: { className?: string }) { return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>; }
