import { useState, useEffect } from 'react';
import { UserProfile, Result } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';
import { FileText, CheckCircle, Clock, TrendingUp, Award, BookOpen, LayoutGrid, Calendar, ShieldCheck, Download, Printer, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResultsProps {
  user: UserProfile;
}

export default function Results({ user }: ResultsProps) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get('/academics/results/');
        const mapped = response.data.map((r: any) => ({
          id: r.id,
          courseId: r.course_code || r.course_title, // Ensure compatibility with backend fields
          score: r.score,
          grade: r.grade,
          semester: 'Harmattan', // Or from backend if available
          level: user.level,
        }));
        setResults(mapped);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user.level]);

  const calculateGPA = (res: Result[]) => {
    if (res.length === 0) return '0.00';
    const totalGP = res.reduce((acc, r) => acc + (r.gp || 0), 0);
    return (totalGP / res.length).toFixed(2);
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      {/* ðŸ“Š TRANSCRIPT HEADER */}
      <div className="bg-slate-50 p-10 rounded-[3rem] shadow-2xl border border-[#008751]/10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-8000/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 space-y-2">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white text-[#008751] rounded-xl shadow-inner"><TrendingUp className="w-6 h-6" /></div>
              <h2 className="text-3xl font-black text-[#008751] tracking-tighter uppercase italic">Institutional Academic Transcript</h2>
           </div>
           <p className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-[0.3em] pl-12">Registry Division â€¢ Cumulative Performance Log</p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <div className="px-8 py-5 bg-[#008751] text-[#008751] rounded-3xl shadow-xl shadow-indigo-100 text-center">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Current CGPA</p>
              <p className="text-4xl font-black tracking-tighter italic">{calculateGPA(results)}</p>
           </div>
           <button className="p-5 bg-white text-[#008751] rounded-3xl hover:bg-white transition-all shadow-xl active:scale-90">
              <Printer className="w-6 h-6" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* ðŸ“š PERFORMANCE LOG */}
        <div className="xl:col-span-8 space-y-8">
           <div className="bg-slate-50 p-10 rounded-[4rem] shadow-2xl border border-[#008751]/10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-xl font-black text-[#008751] tracking-tight uppercase italic flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl"><BookOpen className="w-5 h-5 text-[#008751]" /></div>
                    Semester Breakdown
                 </h3>
                 <div className="flex items-center gap-2 text-[8px] font-black text-[#008751] bg-white px-3 py-1 rounded-full uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> Digitally Verified By Senate
                 </div>
              </div>

              <div className="space-y-4">
                 {results.length === 0 && (
                   <div className="py-24 text-center space-y-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                         <Calendar className="w-10 h-10" />
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No Examination Records Synchronized</p>
                   </div>
                 )}
                 {results.map(result => (
                   <div key={result.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-[#008751]/10 flex justify-between items-center group hover:bg-slate-50 hover:border-indigo-100 hover:shadow-xl transition-all duration-500">
                      <div className="flex items-center gap-8">
                         <div className="w-20 h-20 bg-slate-50 text-[#008751] rounded-3xl flex items-center justify-center font-black text-4xl shadow-sm border border-[#008751]/10 group-hover:bg-[#008751] group-hover:text-[#008751] group-hover:rotate-12 transition-all">
                            {result.grade}
                         </div>
                         <div className="space-y-1">
                            <p className="font-black text-2xl text-[#008751] tracking-tighter uppercase italic">{result.courseId}</p>
                            <div className="flex items-center gap-3">
                               <span className="text-[9px] font-black text-[#008751] uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-[#008751]/10">{result.semester}</span>
                               <span className="text-[9px] font-black text-[#008751]/40 uppercase tracking-widest">{result.level}</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-right space-y-1">
                         <p className="text-4xl font-black text-[#008751] tracking-tighter leading-none italic">{result.score}</p>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Composite Score</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ðŸ›ï¸ SENATE SUMMARY */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-indigo-950 p-10 rounded-[4rem] text-[#008751] space-y-10 shadow-2xl sticky top-24 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#008751]/3 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform" />
              
              <div className="space-y-6 relative z-10">
                 <h4 className="text-lg font-black text-[#008751] tracking-tighter uppercase italic">Senate Summary</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-4 border-b border-[#008751]/5 group/stat">
                       <span className="text-[9px] font-black text-[#008751]/35 uppercase tracking-widest group-hover/stat:text-[#008751] transition-colors">Courses Passed</span>
                       <span className="font-black text-2xl tracking-tighter">{results.filter(r => r.score >= 40).length}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-[#008751]/5 group/stat">
                       <span className="text-[9px] font-black text-[#008751]/35 uppercase tracking-widest group-hover/stat:text-rose-400 transition-colors">Courses Outstanding</span>
                       <span className="font-black text-2xl tracking-tighter text-rose-400/40">{results.filter(r => r.score < 40).length}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 group/stat">
                       <span className="text-[9px] font-black text-[#008751]/35 uppercase tracking-widest group-hover/stat:text-[#008751] transition-colors">Total Units Recorded</span>
                       <span className="font-black text-2xl tracking-tighter">00</span>
                    </div>
                 </div>
              </div>

              <div className="pt-6 relative z-10">
                 <div className="p-8 bg-[#008751]/3 rounded-[2.5rem] border border-[#008751]/5 flex items-center gap-6 group-hover:bg-[#008751]/5 transition-colors">
                    <div className="p-3 bg-[#008751]/5 rounded-2xl"><Award className="w-8 h-8 text-[#008751]" /></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#008751]/35 mb-1">Academic Status</p>
                       <p className="text-xl font-black text-[#008751] tracking-tighter uppercase italic">Good Standing</p>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-green-8000/10 rounded-[2rem] border border-[#008751]/10 flex gap-4 items-start relative z-10">
                 <AlertCircle className="w-5 h-5 text-[#008751] shrink-0" />
                 <p className="text-[9px] text-[#008751]/35 leading-relaxed font-medium italic overflow-hidden">Candidate's results are subject to final ratification by the University Senate. Any discrepancy should be reported within 14 registries of result release.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}



