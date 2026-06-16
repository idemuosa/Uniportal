import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { 
  GraduationCap, BookOpen, CreditCard, Bed, FileText, 
  User, MapPin, Building2, ShieldCheck, Mail, Landmark, 
  ArrowRight, Copy, HeartPulse, History, Phone, Fingerprint, 
  FileUp, MapPinned, Cake, LogIn 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../api/axios';
import ClearanceForm from './ClearanceForm';
import AttendanceLogger from '../../components/AttendanceLogger';

interface StudentPortalProps {
  user: UserProfile;
}

type Tab = 'dashboard' | 'profile' | 'clearance';

export default function StudentPortal({ user }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [hasPaidAcceptance, setHasPaidAcceptance] = useState(false);
  const [hasPaidSchoolFees, setHasPaidSchoolFees] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkPayments = async () => {
      try {
        const response = await api.get('/finances/payments/');
        const payments = response.data;
        setHasPaidAcceptance(payments.some((p: any) => p.type === 'acceptance' && p.status === 'success'));
        setHasPaidSchoolFees(payments.some((p: any) => p.type === 'tuition' && p.status === 'success'));
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      }
    };
    if (user) checkPayments();
  }, [user]);

  const currentSchool = {
    portalName: 'Federal University Lukke',
    idLabel: 'Student Registration No',
    idValue: user.matricNo || 'LUKKE/2025/11204',
    logo: 'https://picsum.photos/seed/lukke/200/200',
    motto: 'Knowledge, Integrity and Service'
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🧭 HEADER & NAVIGATION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#008751]/5 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-[#008751]/8 flex items-center justify-center">
             <GraduationCap className="w-8 h-8 text-[#008751]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[#008751] uppercase italic">{currentSchool.portalName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[#008751] font-bold tracking-[0.3em] uppercase text-[9px] opacity-60">Academic Session 2025/2026</span>
              <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
              <span className="text-[#008751]/35 font-bold uppercase text-[9px]">Harmattan Semester</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-slate-50 backdrop-blur-md p-1.5 rounded-2xl border border-[#008751]/5 shadow-xl">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#008751] shadow-lg scale-105' : 'text-[#008751]/35 hover:text-[#008751]'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-[#008751] shadow-lg scale-105' : 'text-[#008751]/35 hover:text-[#008751]'}`}
          >
            Base Data
          </button>
          <button 
            onClick={() => setActiveTab('clearance')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'clearance' ? 'bg-white text-[#008751] shadow-lg scale-105' : 'text-[#008751]/35 hover:text-[#008751]'}`}
          >
            Clearance
          </button>
        </div>
      </div>

      {/* 🚀 QUICK STATUS INDICATORS */}
      <div className="flex flex-wrap gap-4">
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-md transition-all ${
          hasPaidAcceptance ? 'bg-emerald-500/10 border-emerald-500/20 text-[#008751]' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${hasPaidAcceptance ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">Acceptance: {hasPaidAcceptance ? 'PAID' : 'PENDING'}</span>
        </div>
        
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-md transition-all ${
          hasPaidSchoolFees ? 'bg-emerald-500/10 border-emerald-500/20 text-[#008751]' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${hasPaidSchoolFees ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">School Fees: {hasPaidSchoolFees ? 'PAID' : 'PENDING'}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* 🎯 CORE ACTION HUB - THE PILLARS REQUESTED BY USER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 1. Base Data Card */}
              <button 
                onClick={() => setActiveTab('profile')}
                className="bg-emerald-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-[#008751]/8 shadow-2xl text-left group hover:bg-emerald-500/10 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                <div className="p-4 bg-emerald-500/20 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform">
                  <User className="w-8 h-8 text-[#008751]" />
                </div>
                <h3 className="text-xl font-black text-[#008751] uppercase italic tracking-tighter mb-2">Base Data</h3>
                <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest leading-relaxed">
                  Personal Identity & Bio-Data Records.
                </p>
                <div className="mt-8 flex justify-between items-center">
                  <span className="text-[8px] font-black text-[#008751] px-3 py-1 bg-emerald-500/10 rounded-full">View Profile</span>
                  <ArrowRight className="w-5 h-5 text-[#008751] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </button>

              {/* 2. Course Registration Card */}
              <Link 
                to="/courses"
                className="bg-emerald-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-[#008751]/8 shadow-2xl text-left group hover:bg-emerald-500/10 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                <div className="p-4 bg-indigo-500/20 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-[#008751] uppercase italic tracking-tighter mb-2">Registration</h3>
                <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest leading-relaxed">
                  Enroll for Session Course Registry.
                </p>
                <div className="mt-8 flex justify-between items-center">
                  <span className="text-[8px] font-black text-indigo-400 px-3 py-1 bg-indigo-500/10 rounded-full">Open Enrollment</span>
                  <ArrowRight className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              {/* 3. School Fees Card */}
              <Link 
                to="/payments"
                className="bg-emerald-900/40 backdrop-blur-xl p-10 rounded-[3rem] border border-[#008751]/8 shadow-2xl text-left group hover:bg-emerald-500/10 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
                <div className="p-4 bg-amber-500/20 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-black text-[#008751] uppercase italic tracking-tighter mb-2">School Fees</h3>
                <p className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest leading-relaxed">
                  Financial Settlement & Receipt Hub.
                </p>
                <div className="mt-8 flex justify-between items-center">
                  <span className="text-[8px] font-black text-amber-400 px-3 py-1 bg-amber-500/10 rounded-full">Payment Portal</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>

            {/* 📊 SUMMARY SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <AttendanceLogger user={user} />
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 backdrop-blur-xl p-10 rounded-[3.5rem] border border-[#008751]/8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <h3 className="text-xs font-black text-[#008751] uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                    <ShieldCheck className="w-5 h-5" /> Institutional Metadata
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[8px] text-[#008751]/25 uppercase font-black tracking-widest mb-1.5">Registered Faculty</p>
                      <p className="font-black text-[#008751] italic uppercase tracking-tighter">{user.faculty || 'Standard'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-[#008751]/25 uppercase font-black tracking-widest mb-1.5">Current Level</p>
                      <p className="font-black text-[#008751] italic uppercase tracking-tighter">{user.level || '100L'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-[#008751]/25 uppercase font-black tracking-widest mb-1.5">Verification ID</p>
                      <p className="font-mono text-[#008751] text-xs font-black uppercase">{user.matricNo || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => navigate('/portal')} className="p-3 bg-[#008751]/3 rounded-xl border border-[#008751]/8 hover:bg-[#008751]/5 transition-all">
                          <Fingerprint className="w-5 h-5 text-[#008751] opacity-40 hover:opacity-100" />
                       </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-10 rounded-[3.5rem] border border-[#008751]/8 shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Session Clearance</h3>
                        <p className="text-emerald-100/60 text-[10px] font-bold uppercase tracking-widest">Digital Audit status: verified</p>
                      </div>
                      <Link to="/payments" className="bg-white text-[#008751] p-5 rounded-2xl font-black text-xs uppercase tracking-widest italic flex items-center justify-between hover:bg-emerald-50 transition-all shadow-2xl mt-12">
                        View Final Receipts
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'profile' ? (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* 📸 BIOMETRIC PHOTO & BASE INFO */}
            <div className="space-y-8">
               <div className="bg-emerald-900/40 backdrop-blur-xl p-10 rounded-[4rem] border border-[#008751]/8 text-center space-y-6 shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                  <div className="w-48 h-56 bg-slate-50/50 rounded-[3rem] mx-auto border-4 border-[#008751]/8 overflow-hidden shadow-2xl relative group/img">
                     {user.photoUrl || user.faceUrl ? (
                       <img src={user.photoUrl || user.faceUrl} alt="" className="w-full h-full object-cover grayscale contrast-125 group-hover/img:scale-110 transition-transform duration-700" />
                     ) : (
                       <User className="w-full h-full p-10 text-[#008751]/5 opacity-20" />
                     )}
                     <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Fingerprint className="text-[#008751] w-10 h-10 animate-pulse" />
                     </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-[#008751] italic uppercase tracking-tighter">{user.name}</h2>
                    <p className="text-[#008751] font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">Verified Institutional Profile</p>
                  </div>
                  <div className="pt-6 border-t border-[#008751]/5 grid grid-cols-3 gap-2">
                     <div className="text-center">
                        <p className="text-[7px] text-[#008751]/15 font-black uppercase tracking-widest mb-1">Age</p>
                        <p className="text-xs text-[#008751] font-black italic">{user.age || '--'}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[7px] text-[#008751]/15 font-black uppercase tracking-widest mb-1">Gender</p>
                        <p className="text-xs text-[#008751] font-black italic">{user.gender || 'Set'}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[7px] text-[#008751]/15 font-black uppercase tracking-widest mb-1">Status</p>
                        <p className={`text-xs font-black italic uppercase ${hasPaidAcceptance ? 'text-[#008751]' : 'text-amber-400'}`}>
                          {hasPaidAcceptance ? 'Active' : 'Pending'}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 backdrop-blur-md p-8 rounded-[3rem] border border-[#008751]/8 space-y-6">
                  <h4 className="text-[10px] font-black text-[#008751] uppercase tracking-[0.4em] mb-4">Registry Actions</h4>
                  <button className="w-full flex items-center justify-between p-4 bg-[#008751]/3 rounded-2xl text-[#008751] font-black text-[10px] uppercase tracking-widest hover:bg-[#008751]/5 transition-all border border-[#008751]/5 group">
                     Print Bio-Data Form
                     <Copy className="w-4 h-4 opacity-20 group-hover:opacity-100" />
                  </button>
               </div>
            </div>

            {/* 🧬 DETAILED BIO-DATA GRID */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-emerald-900/40 backdrop-blur-xl p-12 rounded-[4rem] border border-[#008751]/8 shadow-2xl space-y-12">
                  <div className="space-y-8">
                    <h3 className="text-xs font-black text-[#008751] uppercase tracking-[0.5em] flex items-center gap-4">
                       <MapPin className="w-4 h-4" /> Geographical & Origin Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-1.5 px-6 border-l-2 border-emerald-500/20">
                          <p className="text-[8px] font-black text-[#008751]/25 uppercase tracking-[0.3em]">State of Origin</p>
                          <p className="text-sm font-black text-[#008751] italic uppercase tracking-tight">{user.stateOfOrigin || 'Registered'}</p>
                       </div>
                       <div className="space-y-1.5 px-6 border-l-2 border-emerald-500/20">
                          <p className="text-[8px] font-black text-[#008751]/25 uppercase tracking-[0.3em]">City / Location</p>
                          <p className="text-sm font-black text-[#008751] italic uppercase tracking-tight">{user.locationCity || 'Unspecified'}</p>
                       </div>
                       <div className="space-y-1.5 px-6 border-l-2 border-emerald-500/20">
                          <p className="text-[8px] font-black text-[#008751]/25 uppercase tracking-[0.3em]">Institutional ID</p>
                          <p className="text-sm font-black text-[#008751] italic uppercase tracking-tight">{user.matricNo || 'Assigned'}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="clearance"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <ClearanceForm user={user} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

