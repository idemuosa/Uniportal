import { UserProfile } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  CreditCard,
  Building2,
  UserCheck,
  FileText,
  LayoutDashboard,
  Bed,
  ArrowRight,
  Bell,
  Fingerprint,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface HomeProps {
  user: UserProfile | null;
}

export default function Home({ user }: HomeProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-[#008751] px-4 md:px-6 py-12 space-y-16">

      {/* HERO SECTION */}
      <section className="relative min-h-[55vh] flex items-center justify-center overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border border-[#008751]/8 shadow-[0_20px_80px_rgba(0,135,81,0.06)] py-20 px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,135,81,0.04),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,135,81,0.03),transparent_60%)]" />
        
        <div className="relative z-10 text-center space-y-10 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-[#008751]/10 shadow-[0_4px_20px_rgba(0,135,81,0.06)]">
              <ShieldCheck className="w-4 h-4 text-[#008751]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#008751]/60">Secure Academic Portal</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-[#008751] tracking-tighter leading-[0.9] uppercase">
              Federal University <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#008751] via-emerald-500 to-[#006e41]">Lukke Portal</span>
            </h1>
            
            <p className="text-[#008751]/45 text-sm md:text-base font-semibold max-w-2xl mx-auto leading-relaxed">
              Your centralized gateway for admissions, academics, payments, and institutional services — powered by modern digital infrastructure.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-5"
          >
            {user ? (
              <Link to="/portal" className="group bg-[#008751] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(0,135,81,0.25)] hover:shadow-[0_12px_40px_rgba(0,135,81,0.35)] hover:scale-[1.02] transition-all text-sm">
                Access Dashboard
              </Link>
            ) : (
              <Link to="/auth" className="group bg-[#008751] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(0,135,81,0.25)] hover:shadow-[0_12px_40px_rgba(0,135,81,0.35)] hover:scale-[1.02] transition-all text-sm flex items-center gap-3">
                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <button className="bg-white text-[#008751] px-10 py-4 rounded-2xl font-bold uppercase tracking-widest border border-[#008751]/15 hover:border-[#008751]/30 hover:bg-slate-50 transition-all text-sm shadow-sm">
              View Prospectus
            </button>
          </motion.div>
        </div>
      </section>

      {/* QUICK ACTIONS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            title: 'Admission Portal', 
            desc: 'Apply for undergraduate and postgraduate programmes with biometric verification.',
            icon: <UserCheck className="w-7 h-7" />,
            link: '/admission'
          },
          { 
            title: 'Unified Treasury', 
            desc: 'Pay tuition, acceptance fees, and hostel charges via Remita or bank transfer.',
            icon: <CreditCard className="w-7 h-7" />,
            link: '/payments'
          },
          { 
            title: 'Smart Academics', 
            desc: 'Register courses, track CGPA, and download semester results instantly.',
            icon: <BookOpen className="w-7 h-7" />,
            link: '/courses'
          }
        ].map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * i }}
            className="p-8 rounded-[2rem] bg-white border border-[#008751]/8 hover:border-[#008751]/20 transition-all group relative overflow-hidden shadow-[0_4px_30px_rgba(0,135,81,0.04)] hover:shadow-[0_8px_40px_rgba(0,135,81,0.08)]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#008751]/3 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-[#008751]/6 transition-colors duration-700" />
            <div className="relative z-10 space-y-5">
              <div className="w-14 h-14 bg-[#008751]/8 rounded-2xl flex items-center justify-center text-[#008751]">
                {action.icon}
              </div>
              <h3 className="text-xl font-black text-[#008751] uppercase tracking-tight">{action.title}</h3>
              <p className="text-[#008751]/40 text-sm font-medium leading-relaxed">
                {action.desc}
              </p>
              <Link to={action.link} className="inline-flex items-center gap-2 text-[#008751] font-bold uppercase text-xs tracking-widest group-hover:gap-4 transition-all pt-4 border-t border-[#008751]/8 w-full">
                Open Module <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </section>

      {/* BULLETIN FEED */}
      <section className="bg-slate-50/80 p-8 md:p-12 rounded-[1.5rem] border border-[#008751]/8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8 border-b border-[#008751]/8 pb-5">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl text-[#008751] shadow-lg border border-[#008751]/8"><Bell className="w-5 h-5" /></div>
              <div>
                 <h2 className="text-xl font-black text-[#008751] uppercase tracking-tight">Notice Board</h2>
                 <p className="text-[10px] font-bold text-[#008751]/35 uppercase tracking-widest">Latest Announcements</p>
              </div>
           </div>
           <Link to="/news" className="text-xs font-bold text-[#008751]/40 uppercase tracking-widest hover:text-[#008751] transition-colors">View All →</Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {[
            { tag: 'Admissions', title: '2025/2026 Admission Screening Commences', date: '03 APR 2026', desc: 'Central Admission Committee releases finalized screening requirements for all faculties.' },
            { tag: 'Finance', title: 'Harmattan Semester Fee Payment Deadline', date: '01 APR 2026', desc: 'All students must complete fee settlement before the registration deadline.' }
          ].map((item, idx) => (
            <div key={idx} className="p-6 bg-white rounded-[1.5rem] border border-[#008751]/8 group hover:border-[#008751]/20 hover:shadow-[0_4px_20px_rgba(0,135,81,0.06)] transition-all cursor-pointer">
              <div className="flex justify-between items-center mb-3">
                 <span className="px-3 py-1 bg-[#008751] text-white rounded-full text-[9px] font-black uppercase tracking-widest">{item.tag}</span>
                 <span className="text-[9px] font-bold text-[#008751]/30 uppercase tracking-widest">{item.date}</span>
              </div>
              <h4 className="text-base font-black text-[#008751] uppercase tracking-tight mb-2 group-hover:translate-x-1 transition-transform">{item.title}</h4>
              <p className="text-[#008751]/35 text-xs font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
