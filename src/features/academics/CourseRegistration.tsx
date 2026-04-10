import { useState, useEffect } from 'react';
import { UserProfile, Course, Registration } from '../../types';
import api from '../../api/axios';
import { toast } from 'sonner';
import { BookOpen, CheckCircle, Clock, Plus, Save, Info, AlertCircle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CourseRegistrationProps {
  user: UserProfile;
}

export default function CourseRegistration({ user }: CourseRegistrationProps) {
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, regRes] = await Promise.all([
          api.get('/academics/courses/'),
          api.get('/academics/registrations/')
        ]);
        
        // Filter courses by department/level of student if backend doesn't already
        const allCourses = coursesRes.data.map((c: any) => ({
          courseCode: c.code,
          title: c.title,
          units: c.unit,
        }));
        setAvailableCourses(allCourses);

        if (regRes.data.length > 0) {
          const reg = regRes.data[0];
          setRegistration({
            id: reg.id,
            studentId: reg.user,
            semester: reg.semester,
            level: user.level,
            courses: reg.courses.map((c: any) => c.code),
            isApproved: reg.is_completed,
            createdAt: reg.created_at
          } as Registration);
        }
      } catch (error) {
        console.error('Failed to fetch registration data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.level]);

  const toggleCourse = (course: Course) => {
    if (selectedCourses.find(c => c.courseCode === course.courseCode)) {
      setSelectedCourses(selectedCourses.filter(c => c.courseCode !== course.courseCode));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Select at least one Course Unit');
      return;
    }

    setSubmitting(true);
    try {
      // Find course IDs for the selected codes
      const coursesRes = await api.get('/academics/courses/');
      const selectedIds = selectedCourses.map(sc => 
        coursesRes.data.find((c: any) => c.code === sc.courseCode)?.id
      ).filter(id => id);

      await api.post('/academics/registrations/', {
        semester: 'Harmattan Semester',
        session: '2025/2026',
        courses: selectedIds,
        is_completed: false
      });

      toast.success('Course Registration Submitted');
      // Refresh
      window.location.reload();
    } catch (error) {
      toast.error('Registry Synchronization Error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-[#008751] border-t-transparent rounded-full animate-spin" /></div>;

  if (registration) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        <div className="bg-white/40 p-12 rounded-[3.5rem] shadow-2xl border border-[#008751]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl opacity-50" />
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
               <div className="p-3 bg-white rounded-2xl text-[#008751] shadow-inner"><FileText className="w-8 h-8" /></div>
                 <div>
                    <h2 className="text-3xl font-black text-[#008751] tracking-tighter uppercase italic">Institutional Registration</h2>
                    <p className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-widest leading-none">Session: 2025/2026 â€¢ Semester: Harmattan</p>
                 </div>
              </div>
            </div>
            <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${registration.isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              {registration.isApproved ? 'Senate Approved' : 'Pending Verification'}
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {registration.courses.map(code => (
              <div key={code} className="p-6 bg-slate-50 rounded-[2rem] border border-[#008751]/5 flex justify-between items-center group hover:bg-white/40 hover:border-[#008751]/15 hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-6">
                   <div className="w-2 h-2 rounded-full bg-green-400 group-hover:scale-150 transition-transform" />
                   <span className="font-black text-xl text-[#008751] tracking-tighter uppercase italic">{code}</span>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{availableCourses.find(c => c.courseCode === code)?.title}</span>
                   <div className="px-3 py-1 bg-slate-50 rounded-lg border border-[#008751]/10 text-[10px] font-black text-[#008751]">
                      {availableCourses.find(c => c.courseCode === code)?.units} CU
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-indigo-100/50 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#008751] mb-3">Electronic Verification Slip</p>
             <p className="text-[10px] text-[#008751] leading-relaxed font-medium italic">This registration is digitally signed and serves as official proof of enrollment until senate approval.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      {/* ðŸš€ REGISTRATION HEADER */}
      <div className="bg-slate-50 p-10 rounded-[3rem] shadow-2xl border border-[#008751]/5 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-8000/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 space-y-2">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-white text-[#008751] rounded-xl shadow-inner"><BookOpen className="w-6 h-6" /></div>
              <h2 className="text-3xl font-black text-[#008751] tracking-tighter uppercase italic">Academic Registry Terminal</h2>
           </div>
           <p className="text-[10px] font-bold text-[#008751]/40 uppercase tracking-[0.3em] pl-12">{user.faculty} â€¢ {user.level} Session Enrollment</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || selectedCourses.length === 0}
          className="bg-[#008751] text-[#008751] px-10 py-5 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-20 flex items-center gap-3 active:scale-95 relative z-10 uppercase tracking-widest italic"
        >
          {submitting ? 'Registry Sync...' : <>Finalize Enrollment <Save className="w-5 h-5" /></>}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* ðŸ“š COURSE SELECTION */}
        <div className="xl:col-span-8 space-y-6">
           <div className="bg-slate-50 p-10 rounded-[3.5rem] shadow-2xl border border-[#008751]/10">
              <h3 className="text-xl font-black text-[#008751] tracking-tight uppercase italic mb-8 flex items-center gap-3">
                 <div className="p-2 bg-slate-50 rounded-xl"><Plus className="w-5 h-5 text-[#008751]" /></div>
                 Available Course Units
              </h3>
              <div className="grid grid-cols-1 gap-4">
                 {availableCourses.map(course => (
                   <button
                     key={course.courseCode}
                     onClick={() => toggleCourse(course)}
                     className={`w-full p-6 md:p-8 rounded-[2.5rem] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group ${
                       selectedCourses.find(c => c.courseCode === course.courseCode) 
                       ? 'bg-[#008751] border-[#008751] shadow-xl shadow-indigo-200 text-[#008751]' 
                       : 'bg-slate-50 border-[#008751]/10 hover:bg-slate-50 hover:border-indigo-100 text-[#008751]'
                     }`}
                   >
                     <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-colors ${selectedCourses.find(c => c.courseCode === course.courseCode) ? 'bg-[#008751]/5 text-[#008751]' : 'bg-slate-50 text-[#008751] shadow-sm border border-[#008751]/10'}`}>
                           {course.courseCode.slice(-3)}
                        </div>
                        <div className="text-left space-y-1">
                           <p className="font-black text-xl tracking-tighter uppercase italic">{course.courseCode}</p>
                           <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedCourses.find(c => c.courseCode === course.courseCode) ? 'text-[#008751]/50' : 'text-[#008751]/40'}`}>{course.title}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-6 relative z-10">
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${selectedCourses.find(c => c.courseCode === course.courseCode) ? 'bg-[#008751]/5 border-[#008751]/15' : 'bg-slate-50 border-[#008751]/10 shadow-inner'}`}>
                           {course.units} COURSE UNITS
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${selectedCourses.find(c => c.courseCode === course.courseCode) ? 'bg-slate-50 text-[#008751] rotate-0' : 'bg-slate-200 text-[#008751]/40 rotate-90 scale-75'}`}>
                           {selectedCourses.find(c => c.courseCode === course.courseCode) ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                     </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* ðŸ“Š SUMMARY TRACKER */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[4rem] text-[#008751] space-y-10 shadow-2xl sticky top-24 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#008751]/3 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-125 transition-transform" />
              
              <div className="space-y-4 relative z-10">
                 <h4 className="text-xl font-black text-[#008751] tracking-tighter uppercase italic">Registration Summary</h4>
                 <div className="h-1 w-full bg-[#008751]/5 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: `${(selectedCourses.reduce((acc, c) => acc + c.units, 0) / 24) * 100}%` }} 
                       className="h-full bg-green-8000" 
                    />
                 </div>
                 <div className="flex justify-between text-[8px] font-black text-[#008751]/35 uppercase tracking-widest">
                    <span>Registry Min: 12 CU</span>
                    <span>Registry Max: 24 CU</span>
                 </div>
              </div>

              <div className="space-y-4 relative z-10 max-h-[300px] overflow-y-auto scrollbar-hide">
                 {selectedCourses.map(course => (
                   <div key={course.courseCode} className="flex justify-between items-center py-4 border-b border-[#008751]/5">
                      <div className="space-y-1">
                         <p className="text-xs font-black uppercase italic tracking-widest">{course.courseCode}</p>
                         <p className="text-[8px] text-[#008751]/35 font-bold uppercase">{course.units} UNITS</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-[#008751]" />
                   </div>
                 ))}
                 {selectedCourses.length === 0 && (
                   <div className="py-20 text-center space-y-4 opacity-20">
                      <Clock className="w-10 h-10 mx-auto" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Selection</p>
                   </div>
                 )}
              </div>

              <div className="pt-6 relative z-10">
                 <div className="bg-[#008751]/3 p-8 rounded-[2rem] border border-[#008751]/5 text-center group-hover:bg-[#008751]/5 transition-colors">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#008751]/35 mb-2">Aggregate Units Locked</p>
                    <p className="text-6xl font-black tracking-tighter italic shadow-sm">{selectedCourses.reduce((acc, c) => acc + c.units, 0)}</p>
                 </div>
              </div>

              <div className="p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex gap-4 items-start relative z-10">
                 <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                 <p className="text-[9px] text-amber-200/60 leading-relaxed font-medium italic">Candidates must ensure their total units do not exceed the departmental maximum threshold for the current session.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}



