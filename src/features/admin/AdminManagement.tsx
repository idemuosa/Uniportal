import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, CreditCard, ShieldCheck,
  Search, Filter, MoreVertical, CheckCircle, XCircle, Clock
} from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'sonner';

export default function AdminManagement() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (uid: string, status: string) => {
    try {
      await api.post(`/admin/students/status`, { uid, status });
      toast.success(`Student status updated to ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 📊 STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: students.length, icon: <Users />, color: 'emerald' },
          { label: 'Pending Admissions', value: students.filter(s => s.Application?.status === 'pending').length, icon: <Clock />, color: 'amber' },
          { label: 'Total Revenue', value: '₦' + students.reduce((acc, s) => acc + (s.Payments?.reduce((pAcc: any, p: any) => pAcc + Number(p.amount), 0) || 0), 0).toLocaleString(), icon: <CreditCard />, color: 'blue' },
          { label: 'Verified Staff', value: '12', icon: <ShieldCheck />, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-[#008751]/10 shadow-xl shadow-[#008751]/5">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600 flex items-center justify-center mb-4`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-[#008751]/40 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-[#008751] tracking-tighter mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 🔍 SEARCH & FILTER */}
      <div className="bg-white p-4 rounded-3xl border border-[#008751]/10 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#008751]/30" />
          <input
            type="text"
            placeholder="Search students by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 ring-emerald-500/20"
          />
        </div>
        <button className="px-6 py-4 bg-slate-50 text-[#008751] rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 transition-all">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* 📋 STUDENT DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-[#008751]/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-[#008751]/5">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-[#008751] uppercase tracking-widest">Student Identity</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#008751] uppercase tracking-widest">Academic Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#008751] uppercase tracking-widest">Fee Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#008751] uppercase tracking-widest">Registry Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-[#008751] uppercase tracking-widest text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#008751]/5">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><div className="w-8 h-8 border-4 border-[#008751] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.uid} className="hover:bg-[#008751]/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden border border-[#008751]/10">
                        {student.photoUrl ? <img src={student.photoUrl} className="w-full h-full object-cover" /> : <Users className="w-full h-full p-3 text-[#008751]/20" />}
                      </div>
                      <div>
                        <p className="font-black text-[#008751] text-sm uppercase italic">{student.name}</p>
                        <p className="text-[10px] font-bold text-[#008751]/40 lowercase">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-black text-[#008751] uppercase tracking-tighter italic">{student.department || 'Unassigned'}</p>
                    <p className="text-[9px] font-bold text-[#008751]/30 uppercase tracking-widest">{student.level || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    {student.Payments?.length > 0 ? (
                      <span className="px-4 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Paid ₦{Number(student.Payments[0].amount).toLocaleString()}</span>
                    ) : (
                      <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest">Defaulter</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${student.Application?.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] font-black text-[#008751] uppercase tracking-widest italic">{student.Application?.status || 'No Application'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => updateStatus(student.uid, 'approved')}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                        title="Approve Admission"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(student.uid, 'rejected')}
                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                        title="Reject Admission"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
