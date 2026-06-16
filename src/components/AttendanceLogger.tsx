import { useState } from 'react';
import { UserProfile } from '../types';
import api from '../api/axios';
import { toast } from 'sonner';
import { LogIn, MapPin, Loader2, CheckCircle } from 'lucide-react';

export default function AttendanceLogger({ user }: { user: UserProfile }) {
  const [loading, setLoading] = useState(false);
  const [logged, setLogged] = useState(false);

  const handleLogAttendance = async () => {
    setLoading(true);
    try {
      // In a real app, you'd get courseId from the current class schedule
      await api.post('/academics/attendance', {
        studentId: user.uid,
        courseId: 'GEN101',
        location: 'Main Lecture Theater'
      });
      setLogged(true);
      toast.success('Attendance Logged Successfully');
    } catch (error) {
      toast.error('Failed to log attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#008751]/10 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#008751]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div className={`p-4 rounded-2xl transition-all ${logged ? 'bg-emerald-50 text-emerald-500' : 'bg-[#008751]/5 text-[#008751]'}`}>
          {logged ? <CheckCircle className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
        </div>

        <div>
          <h3 className="text-xl font-black text-[#008751] uppercase tracking-tighter italic">Class Attendance</h3>
          <p className="text-[10px] text-[#008751]/40 font-bold uppercase tracking-widest mt-1 flex items-center justify-center gap-2">
            <MapPin className="w-3 h-3" /> Main Lecture Theater
          </p>
        </div>

        {logged ? (
          <div className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            Verified for today
          </div>
        ) : (
          <button
            onClick={handleLogAttendance}
            disabled={loading}
            className="w-full bg-[#008751] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#006e41] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#008751]/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Entry'}
          </button>
        )}
      </div>
    </div>
  );
}
