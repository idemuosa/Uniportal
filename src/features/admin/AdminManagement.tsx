import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, CreditCard, ShieldCheck,
  Search, Filter, CheckCircle, XCircle, Clock, Award, Wallet
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
    <div className="space-y-8">
      {/* 📊 MINIMAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: students.length, icon: <Users className="w-4 h-4" />, color: 'emerald' },
          { label: 'Pending Admissions', value: students.filter(s => s.Application?.status === 'pending').length, icon: <Clock className="w-4 h-4" />, color: 'amber' },
          { label: 'Total Revenue', value: '₦' + students.reduce((acc, s) => acc + (s.Payments?.reduce((pAcc: any, p: any) => pAcc + Number(p.amount), 0) || 0), 0).toLocaleString(), icon: <Wallet className="w-4 h-4" />, color: 'blue' },
          { label: 'Verified Staff', value: '12', icon: <ShieldCheck className="w-4 h-4" />, color: 'slate' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
               <div className={`p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                 {stat.icon}
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 🔍 SEARCH & TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 ring-emerald-500/10 transition-all outline-none"
            />
          </div>
          <button className="px-5 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finance</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.uid} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        {student.photoUrl ? <img src={student.photoUrl} className="w-full h-full object-cover" /> : <Users className="w-full h-full p-2.5 text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                        <p className="text-[10px] text-slate-400 lowercase">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">{student.department || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400">{student.level || '---'}</p>
                  </td>
                  <td className="px-8 py-5">
                    {student.Payments?.length > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase">Paid</span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 uppercase">Default</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${student.Application?.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase italic">{student.Application?.status || 'No App'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateStatus(student.uid, 'approved')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => updateStatus(student.uid, 'rejected')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
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
