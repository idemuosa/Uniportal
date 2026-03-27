import { UserProfile } from '../types';
import { GraduationCap, BookOpen, CreditCard, Bed, FileText, User, MapPin, Building2, ShieldCheck, Mail, Landmark, ArrowRight, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface StudentPortalProps {
  user: UserProfile;
}

export default function StudentPortal({ user }: StudentPortalProps) {
  const schoolSpecifics = {
    UNIBEN: { portalName: 'Kofa Portal', idLabel: 'Kofa ID', idValue: user.kofaId || 'Not Assigned' },
    UI: { portalName: 'UI Portal', idLabel: 'UI Matric No', idValue: user.uiMatricNo || user.matricNo },
    UNILAG: { portalName: 'UNILAG Portal', idLabel: 'UNILAG ID', idValue: user.unilagId || 'Not Assigned' },
    GENERAL: { portalName: 'Student Portal', idLabel: 'Matric No', idValue: user.matricNo }
  };

  const currentSchool = schoolSpecifics[user.university] || schoolSpecifics.GENERAL;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{currentSchool.portalName}</h1>
          <p className="text-neutral-500">Welcome back, {user.name}. ({user.university})</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-neutral-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="p-2 bg-neutral-800 rounded-xl"><GraduationCap className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">{currentSchool.idLabel}</p>
              <p className="font-mono text-sm">{currentSchool.idValue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <User className="w-6 h-6" />
              Academic Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100"><Building2 className="w-5 h-5 text-neutral-500" /></div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Faculty</p>
                    <p className="font-bold">{user.faculty}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100"><MapPin className="w-5 h-5 text-neutral-500" /></div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Department</p>
                    <p className="font-bold">{user.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100"><Mail className="w-5 h-5 text-neutral-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Student Email</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm truncate max-w-[180px]">{user.studentEmail || 'Pending Generation'}</p>
                      {user.studentEmail && (
                        <button onClick={() => copyToClipboard(user.studentEmail!, 'Email')} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100"><BookOpen className="w-5 h-5 text-neutral-500" /></div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Current Level</p>
                    <p className="font-bold">{user.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100"><FileText className="w-5 h-5 text-neutral-500" /></div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Current CGPA</p>
                    <p className="font-bold">0.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-900 text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Landmark className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">UniPortal Bank</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Virtual Account</h3>
                  <p className="text-emerald-100/60 text-sm mb-6">Use this account number for school fees and other academic payments.</p>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Account Number</p>
                      <p className="text-xl font-mono font-bold tracking-wider">{user.virtualAccountNumber || 'Not Assigned'}</p>
                    </div>
                    {user.virtualAccountNumber && (
                      <button onClick={() => copyToClipboard(user.virtualAccountNumber!, 'Account Number')} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                        <Copy className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-100/40 mt-3 italic">UniPortal Bank • 0.00% Transaction Fee</p>
                </div>
                
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <h4 className="font-bold mb-4">Need Financial Support?</h4>
                  <p className="text-sm text-emerald-100/60 mb-6">Apply for a student loan with low interest rates and flexible repayment plans.</p>
                  <Link to="/loan" className="flex items-center justify-between w-full bg-emerald-400 text-emerald-950 p-4 rounded-2xl font-bold hover:bg-emerald-300 transition-all">
                    Apply for Loan
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {user.university !== 'GENERAL' && (
            <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6" />
                {user.university} Specific Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.university === 'UNIBEN' && (
                  <>
                    <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                      <h4 className="font-bold text-purple-900 mb-2">Kofa ID Management</h4>
                      <p className="text-sm text-purple-700">Manage your unique Kofa ID and biometric data sync.</p>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                      <h4 className="font-bold text-purple-900 mb-2">Post-Graduate Screening</h4>
                      <p className="text-sm text-purple-700">Track your PG screening and interview status.</p>
                    </div>
                  </>
                )}
                {user.university === 'UI' && (
                  <>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-2">Distance Learning Portal</h4>
                      <p className="text-sm text-blue-700">Access UI-DLC specific courseware and materials.</p>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-2">UI LMS Integration</h4>
                      <p className="text-sm text-blue-700">Direct access to the Learning Management System.</p>
                    </div>
                  </>
                )}
                {user.university === 'UNILAG' && (
                  <>
                    <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                      <h4 className="font-bold text-rose-900 mb-2">GST Portal</h4>
                      <p className="text-sm text-rose-700">Register and check results for General Studies courses.</p>
                    </div>
                    <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                      <h4 className="font-bold text-rose-900 mb-2">DLI Management</h4>
                      <p className="text-sm text-rose-700">Distance Learning Institute specific portal features.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Financial Status
              </h4>
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider">Tuition Fees</span>
                <span className="font-bold">Paid</span>
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Accommodation
              </h4>
              <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-wider">Hostel</span>
                <span className="font-bold">Not Allocated</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-neutral-900 text-white p-10 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
              <p className="text-neutral-400 text-sm mb-8">Manage your academic activities.</p>
              <div className="space-y-3">
                <button className="w-full bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl text-left font-bold transition-all flex items-center justify-between">
                  Register Courses
                  <BookOpen className="w-5 h-5" />
                </button>
                <button className="w-full bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl text-left font-bold transition-all flex items-center justify-between">
                  Check Results
                  <FileText className="w-5 h-5" />
                </button>
                <button className="w-full bg-white/10 hover:bg-white/20 text-white p-4 rounded-2xl text-left font-bold transition-all flex items-center justify-between">
                  Pay Fees
                  <CreditCard className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
