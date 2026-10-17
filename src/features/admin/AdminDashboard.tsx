import { useState, useEffect } from 'react';
import { UserProfile, AdmissionApplication, Course, LoanApplication, BankDetails } from '../../types';
import api from '../../api/axios';
import { FACULTIES, DEPARTMENTS, LEVELS, SCHOOL_FEES } from '../../constants';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Users, FileText, BookOpen, Settings, CheckCircle, XCircle, Trash2, Plus, DollarSign, Building2, Landmark, Clock, ArrowRight, Camera, Eye, Fingerprint, ShieldCheck, Award, AlertCircle, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import AdminManagement from './AdminManagement';

interface AdminDashboardProps {
  user: UserProfile;
  onSimulateLogin?: (user: UserProfile) => void;
}

export default function AdminDashboard({ user, onSimulateLogin }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'management' | 'applications' | 'students' | 'courses' | 'treasury' | 'loans' | 'setup' | 'exams'>('management');

  // Entrance Exam CBT Admin State
  const [examSubmissions, setExamSubmissions] = useState<any[]>([]);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    stream: 'JAMB',
    subject: 'English Language',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);

  // Form States
  const [newCourse, setNewCourse] = useState({ courseCode: '', title: '', units: 3, faculty: '', department: '', level: '100L' });
  const [newDept, setNewDept] = useState({ faculty: '', name: '' });
  const [manualStudent, setManualStudent] = useState({ name: '', email: '', faculty: '', department: '', level: '100L', age: 18, locationCity: '' });

  // Treasury State
  const [bankSetup, setBankSetup] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [banks, setBanks] = useState<BankDetails[]>([
    { accountName: 'idemudia osamudiamen', bankName: 'UBA', accountNumber: '2054037193' },
    { accountName: 'idemudia osamudiamen', bankName: 'OPAY', accountNumber: '8183793358' },
    { accountName: 'idemudia osamudiamen', bankName: 'PALMPAY', accountNumber: '8106202283' }
  ]);
  const [manualPay, setManualPay] = useState({ uid: '', type: 'tuition' as 'tuition' | 'hostel' | 'admission', amount: 0 });
  const [dynamicFees, setDynamicFees] = useState<Record<string, number>>(SCHOOL_FEES);
  const [maxLoanAmount, setMaxLoanAmount] = useState<number>(500000);
  const [acceptanceFee, setAcceptanceFee] = useState<number>(120000);
  const [earlyPaymentDiscount, setEarlyPaymentDiscount] = useState<number>(5);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [appsRes, studentsRes, coursesRes, loansRes, treasuryRes, bankRes] = await Promise.all([
          api.get('/academics/applications/'),
          api.get('/accounts/users/?role=student'),
          api.get('/academics/courses/'),
          api.get('/finances/loans/'),
          api.get('/portal/treasury-settings/'),
          api.get('/portal/bank-details/')
        ]);

        setApplications(appsRes.data);
        fetchExamSubmissions();
        setStudents(studentsRes.data.map((u: any) => ({
          uid: u.id.toString(),
          email: u.email,
          role: u.role,
          name: `${u.first_name} ${u.last_name}`.trim(),
          university: 'UniPortal',
          ...u
        })));
        setCourses(coursesRes.data);
        setLoans(loansRes.data);
        
        if (treasuryRes.data.length > 0) {
          const t = treasuryRes.data[0];
          setMaxLoanAmount(t.max_loan_amount);
          setAcceptanceFee(t.acceptance_fee);
          setEarlyPaymentDiscount(t.early_payment_discount);
        }

        if (bankRes.data.length > 0) {
          setBanks(bankRes.data.map((b: any) => ({
            bankName: b.bank_name,
            accountNumber: b.account_number,
            accountName: b.account_name
          })));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchExamSubmissions = async () => {
    try {
      const res = await api.get('/academics/entrance-exams/submissions');
      setExamSubmissions(res.data);
    } catch (e) {
      console.warn('Exam submissions fetch warning:', e);
    }
  };

  const handleReleaseExamResult = async (subId: string) => {
    setReleasingId(subId);
    try {
      const res = await api.post(`/academics/entrance-exams/release/${subId}`);
      toast.success(res.data.message || 'Result released & admission guaranteed!');
      fetchExamSubmissions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to release result');
    } finally {
      setReleasingId(null);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim() || !newQuestion.optionA || !newQuestion.optionB) {
      toast.error('Please enter question text and at least options A and B');
      return;
    }

    try {
      await api.post('/academics/entrance-exams/questions', {
        stream: newQuestion.stream,
        subject: newQuestion.subject,
        question: newQuestion.question,
        options: [newQuestion.optionA, newQuestion.optionB, newQuestion.optionC, newQuestion.optionD].filter(Boolean),
        correctAnswer: newQuestion.correctAnswer
      });
      toast.success('Entrance exam question added successfully!');
      setNewQuestion({
        stream: 'JAMB',
        subject: 'English Language',
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 0
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add question');
    }
  };

  // [Handlers kept same as before for functionality]
  const handleApprove = async (app: AdmissionApplication) => {
    try {
      const matricNo = `UNI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
      await api.patch(`/academics/applications/${app.id}/`, { status: 'approved' });
      await api.patch(`/accounts/users/${app.uid}/`, { role: 'student', matric_no: matricNo });
      toast.success('Application approved!');
      window.location.reload(); 
    } catch (error) { toast.error('Failed to approve application'); }
  };

  const handleLoanStatus = async (loanId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/finances/loans/${loanId}/`, { status });
      toast.success(`Loan application ${status} successfully!`);
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status } : l));
    } catch (error) { toast.error(`Failed to ${status} loan application`); }
  };

  const handleReject = async (app: AdmissionApplication) => {
    try {
      await api.patch(`/academics/applications/${app.id!}/`, { status: 'rejected' });
      toast.success('Application rejected');
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
    } catch (error) { toast.error('Failed to reject application'); }
  };

  const handleAddCourse = async () => {
    try {
      await api.post('/academics/courses/', { ...newCourse, course_code: newCourse.courseCode });
      toast.success('Course added successfully');
      const res = await api.get('/academics/courses/');
      setCourses(res.data);
    } catch (error) { toast.error('Failed to add course'); }
  };

  const startSimulation = (student: UserProfile) => {
    if (onSimulateLogin) {
      onSimulateLogin(student);
      navigate('/portal');
      toast.success(`Logged in as ${student.name}`);
    }
  };

  if (loading) return <div className="flex justify-center p-12 bg-white min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* CLEAN HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Control</h1>
            <p className="text-slate-500 text-sm font-medium">UniPortal Administrative</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-hide">
            {(['management', 'applications', 'exams', 'students', 'courses', 'treasury', 'loans', 'setup'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${activeTab === tab ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab === 'exams' ? 'Entrance Exams & CBT' : tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'management' ? (
          <AdminManagement />
        ) : (
          <div className="space-y-8">
            {/* CLEAN STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: Users, label: 'Students', value: students.length },
                { icon: FileText, label: 'Apps', value: applications.filter(a => a.status === 'pending').length },
                { icon: BookOpen, label: 'Courses', value: courses.length },
                { icon: Landmark, label: 'Loans', value: loans.filter(l => l.status === 'pending').length },
                { icon: DollarSign, label: 'Revenue', value: '₦0' }
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-300">
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* TAB CONTENT AREA */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
              {activeTab === 'exams' && (
                <div className="p-8 space-y-12">
                  {/* SECTION 1: CANDIDATE EXAM SUBMISSIONS */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                          <Award className="w-5 h-5 text-emerald-500" /> Entrance Exam Submissions & Admission Guarantees
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Review CBT submissions from UTME and Direct Entry candidates and release results to guarantee admission.
                        </p>
                      </div>
                      <button
                        onClick={fetchExamSubmissions}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Candidate & Reg No</th>
                            <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Stream</th>
                            <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">CBT Score</th>
                            <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {examSubmissions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                                No entrance exam submissions recorded yet.
                              </td>
                            </tr>
                          ) : (
                            examSubmissions.map((sub: any) => (
                              <tr key={sub.id} className="hover:bg-slate-50/80 transition-all">
                                <td className="p-4">
                                  <p className="font-bold text-slate-900">{sub.candidateName || 'Candidate'}</p>
                                  <p className="text-xs text-emerald-600 font-mono font-black">{sub.registrationNumber}</p>
                                </td>
                                <td className="p-4">
                                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase">
                                    {sub.stream || 'JAMB'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <p className="text-sm font-black text-slate-900">{sub.percentage}%</p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    {sub.totalScore}/{sub.maxScore} pts
                                  </p>
                                </td>
                                <td className="p-4">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                    sub.admissionGuaranteed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {sub.admissionGuaranteed ? 'Admission Guaranteed' : sub.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  {sub.admissionGuaranteed || sub.status === 'released' ? (
                                    <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                                      <CheckCircle className="w-4 h-4" /> Released
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleReleaseExamResult(sub.id)}
                                      disabled={releasingId === sub.id}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                      {releasingId === sub.id ? 'Releasing...' : 'Release & Guarantee Admission'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 2: CONFIGURE CBT QUESTIONS FOR DIRECT ENTRY & UTME */}
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <Plus className="w-5 h-5 text-emerald-500" /> Set Direct Entry & UTME Entrance Exam Questions
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Configure questions for Direct Entry applicants (without JAMB) or specific JAMB subjects.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Target Stream</label>
                          <select
                            value={newQuestion.stream}
                            onChange={e => setNewQuestion({ ...newQuestion, stream: e.target.value })}
                            className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                          >
                            <option value="JAMB">JAMB / UTME Candidate</option>
                            <option value="Direct Entry">Direct Entry Candidate (No JAMB)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Subject / Category</label>
                          <input
                            type="text"
                            placeholder="e.g. General Aptitude, Mathematics, English, Biology"
                            value={newQuestion.subject}
                            onChange={e => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                            className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Question Text</label>
                        <textarea
                          rows={2}
                          placeholder="Type the entrance exam question here..."
                          value={newQuestion.question}
                          onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Option A"
                          value={newQuestion.optionA}
                          onChange={e => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
                          className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Option B"
                          value={newQuestion.optionB}
                          onChange={e => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
                          className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Option C"
                          value={newQuestion.optionC}
                          onChange={e => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
                          className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Option D"
                          value={newQuestion.optionD}
                          onChange={e => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
                          className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Correct Option Index</label>
                        <select
                          value={newQuestion.correctAnswer}
                          onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: Number(e.target.value) })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        >
                          <option value={0}>Option A is Correct</option>
                          <option value={1}>Option B is Correct</option>
                          <option value={2}>Option C is Correct</option>
                          <option value={3}>Option D is Correct</option>
                        </select>
                      </div>

                      <button
                        onClick={handleAddQuestion}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
                      >
                        Add Entrance Question to Question Bank
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'applications' && (
                <div className="p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-3"><FileText className="w-5 h-5 text-emerald-500" /> Pending Admissions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Candidate</th>
                          <th className="py-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Program</th>
                          <th className="py-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="py-4 font-bold text-xs text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {applications.map(app => (
                          <tr key={app.id} className="hover:bg-slate-50 transition-all">
                            <td className="py-4">
                              <p className="font-bold text-slate-900">{app.name}</p>
                              <p className="text-xs text-slate-500">{app.email || 'No Email'}</p>
                            </td>
                            <td className="py-4">
                              <p className="text-xs font-bold text-slate-700">{app.faculty}</p>
                              <p className="text-[10px] text-slate-500">{app.department}</p>
                            </td>
                            <td className="py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button onClick={() => setSelectedApp(app)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Eye className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'setup' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-3 text-slate-900"><Plus className="w-5 h-5 text-emerald-500" /> Provision Course</h3>
                      <div className="space-y-4">
                        <input placeholder="Course Code" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 ring-emerald-500/10" value={newCourse.courseCode} onChange={e => setNewCourse({...newCourse, courseCode: e.target.value})} />
                        <input placeholder="Course Title" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 ring-emerald-500/10" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
                        <button onClick={handleAddCourse} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10">Register Course</button>
                      </div>
                   </div>
                </div>
              )}

              {/* Other tabs can be similarly simplified... */}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedApp(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-start mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">Application Dossier</h2>
                  <button onClick={() => setSelectedApp(null)}><XCircle className="w-6 h-6 text-slate-300 hover:text-slate-500" /></button>
               </div>
               {/* Simplified Modal Content */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden">
                    {selectedApp.faceUrl && <img src={selectedApp.faceUrl} className="w-full h-full object-cover" />}
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate Name</p>
                      <p className="text-xl font-bold text-slate-900">{selectedApp.name}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleApprove(selectedApp)} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold">Approve</button>
                      <button onClick={() => handleReject(selectedApp)} className="flex-1 bg-rose-50 text-rose-600 py-4 rounded-xl font-bold">Reject</button>
                    </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
