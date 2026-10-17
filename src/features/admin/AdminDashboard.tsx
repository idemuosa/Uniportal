import { useState, useEffect } from 'react';
import { UserProfile, AdmissionApplication, Course, LoanApplication, BankDetails } from '../../types';
import api from '../../api/axios';
import { FACULTIES, DEPARTMENTS, LEVELS, SCHOOL_FEES } from '../../constants';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Users, FileText, BookOpen, Settings, CheckCircle, XCircle, Trash2, Plus, DollarSign, Building2, Landmark, Clock, ArrowRight, Camera, Eye, Fingerprint, ShieldCheck, Award, AlertCircle, LogIn, Search, UserPlus, CreditCard, Save } from 'lucide-react';
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

  // Search States
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  // Form States
  const [newCourse, setNewCourse] = useState({ courseCode: '', title: '', units: 3, faculty: FACULTIES[0] || '', department: '', level: '100L' });
  const [newDept, setNewDept] = useState({ faculty: FACULTIES[0] || '', name: '' });
  const [manualStudent, setManualStudent] = useState({ name: '', email: '', faculty: FACULTIES[0] || '', department: '', level: '100L', age: 18, locationCity: '' });

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
  const [savingTreasury, setSavingTreasury] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, studentsRes, coursesRes, loansRes, treasuryRes, bankRes] = await Promise.allSettled([
        api.get('/academics/applications/'),
        api.get('/accounts/users/?role=student'),
        api.get('/academics/courses/'),
        api.get('/finances/loans/'),
        api.get('/portal/treasury-settings/'),
        api.get('/portal/bank-details/')
      ]);

      const extractArray = (res: any) => {
        if (!res || res.status !== 'fulfilled' || !res.value) return [];
        const data = res.value.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      };

      setApplications(extractArray(appsRes).filter(Boolean));
      setStudents(extractArray(studentsRes).filter(Boolean).map((u: any) => ({
        uid: (u?.id || u?.uid || '').toString(),
        email: u?.email || '',
        role: u?.role || 'student',
        name: `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || u?.username || u?.email || 'Student',
        university: 'UniPortal',
        faculty: u?.faculty || '',
        department: u?.department || '',
        level: u?.level || '100L',
        ...u
      })));
      setCourses(extractArray(coursesRes).filter(Boolean));
      setLoans(extractArray(loansRes).filter(Boolean));

      if (treasuryRes?.status === 'fulfilled' && treasuryRes.value.data) {
        const t = Array.isArray(treasuryRes.value.data) ? treasuryRes.value.data[0] : (treasuryRes.value.data.results ? treasuryRes.value.data.results[0] : treasuryRes.value.data);
        if (t) {
          if (t.max_loan_amount) setMaxLoanAmount(t.max_loan_amount);
          if (t.acceptance_fee) setAcceptanceFee(t.acceptance_fee);
          if (t.early_payment_discount) setEarlyPaymentDiscount(t.early_payment_discount);
        }
      }

      if (bankRes?.status === 'fulfilled') {
        const bData = extractArray(bankRes).filter(Boolean);
        if (bData.length > 0) {
          setBanks(bData.map((b: any) => ({
            bankName: b?.bank_name || b?.bankName || 'Bank',
            accountNumber: b?.account_number || b?.accountNumber || '',
            accountName: b?.account_name || b?.accountName || ''
          })));
        }
      }

      fetchExamSubmissions();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamSubmissions = async () => {
    try {
      const res = await api.get('/academics/entrance-exams/submissions');
      setExamSubmissions(Array.isArray(res.data) ? res.data : []);
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

  const handleApprove = async (app: AdmissionApplication) => {
    try {
      const matricNo = `UNI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
      await api.patch(`/academics/applications/${app.id}/`, { status: 'approved' });
      await api.patch(`/accounts/users/${app.uid}/`, { role: 'student', matric_no: matricNo });
      toast.success('Application approved!');
      fetchData();
      setSelectedApp(null);
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
      setSelectedApp(null);
    } catch (error) { toast.error('Failed to reject application'); }
  };

  const handleAddCourse = async () => {
    if (!newCourse.courseCode || !newCourse.title) {
      toast.error('Please enter Course Code and Course Title');
      return;
    }
    try {
      await api.post('/academics/courses/', { ...newCourse, course_code: newCourse.courseCode });
      toast.success('Course added successfully');
      setNewCourse({ courseCode: '', title: '', units: 3, faculty: FACULTIES[0] || '', department: '', level: '100L' });
      const res = await api.get('/academics/courses/');
      setCourses(Array.isArray(res.data) ? res.data : (res.data?.results || []));
    } catch (error) { toast.error('Failed to add course'); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await api.delete(`/academics/courses/${courseId}/`);
      toast.success('Course deleted');
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleAddBank = async () => {
    if (!bankSetup.bankName || !bankSetup.accountNumber || !bankSetup.accountName) {
      toast.error('Please fill in bank name, account number, and account name');
      return;
    }
    try {
      await api.post('/portal/bank-details/', {
        bank_name: bankSetup.bankName,
        account_number: bankSetup.accountNumber,
        account_name: bankSetup.accountName
      });
      toast.success('Bank details saved successfully');
      setBanks([...banks, { bankName: bankSetup.bankName, accountNumber: bankSetup.accountNumber, accountName: bankSetup.accountName }]);
      setBankSetup({ bankName: '', accountNumber: '', accountName: '' });
    } catch (error) {
      toast.error('Failed to save bank details');
    }
  };

  const handleUpdateTreasurySettings = async () => {
    setSavingTreasury(true);
    try {
      await api.post('/portal/treasury-settings/', {
        max_loan_amount: maxLoanAmount,
        acceptance_fee: acceptanceFee,
        early_payment_discount: earlyPaymentDiscount
      });
      toast.success('Treasury settings saved successfully');
    } catch (error) {
      toast.error('Failed to save treasury settings');
    } finally {
      setSavingTreasury(false);
    }
  };

  const handleRecordManualPay = async () => {
    if (!manualPay.uid || manualPay.amount <= 0) {
      toast.error('Please provide student UID and valid payment amount');
      return;
    }
    try {
      await api.post('/finances/payments/manual/', manualPay);
      toast.success(`Manual payment of ₦${manualPay.amount.toLocaleString()} recorded!`);
      setManualPay({ uid: '', type: 'tuition', amount: 0 });
    } catch (error) {
      toast.error('Failed to record manual payment');
    }
  };

  const handleAddDept = async () => {
    if (!newDept.name || !newDept.faculty) {
      toast.error('Please select faculty and specify department name');
      return;
    }
    try {
      await api.post('/academics/departments/', newDept);
      toast.success(`Department "${newDept.name}" created under ${newDept.faculty}`);
      setNewDept({ faculty: FACULTIES[0] || '', name: '' });
    } catch (error) {
      toast.error('Failed to create department');
    }
  };

  const handleAddManualStudent = async () => {
    if (!manualStudent.name || !manualStudent.email) {
      toast.error('Please provide student name and email');
      return;
    }
    try {
      await api.post('/accounts/users/manual-student/', manualStudent);
      toast.success(`Student ${manualStudent.name} created successfully`);
      setManualStudent({ name: '', email: '', faculty: FACULTIES[0] || '', department: '', level: '100L', age: 18, locationCity: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to enroll student manually');
    }
  };

  const startSimulation = (student: UserProfile) => {
    if (onSimulateLogin) {
      onSimulateLogin(student);
      navigate('/portal');
      toast.success(`Logged in as ${student.name}`);
    }
  };

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    (c.courseCode || c.course_code || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
    (c.title || '').toLowerCase().includes(courseSearch.toLowerCase()) ||
    (c.department || '').toLowerCase().includes(courseSearch.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-12 bg-white min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* CLEAN HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Control</h1>
            <p className="text-slate-500 text-sm font-medium">UniPortal Administrative Dashboard</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto scrollbar-hide max-w-full">
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
                { icon: FileText, label: 'Apps', value: applications.filter(a => a?.status === 'pending').length },
                { icon: BookOpen, label: 'Courses', value: courses.length },
                { icon: Landmark, label: 'Loans', value: loans.filter(l => l?.status === 'pending').length },
                { icon: DollarSign, label: 'Revenue', value: '₦' + loans.filter(l => l?.status === 'approved').reduce((acc, l) => acc + (l?.amount || 0), 0).toLocaleString() }
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

              {/* EXAMS TAB */}
              {activeTab === 'exams' && (
                <div className="p-8 space-y-12">
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

              {/* APPLICATIONS TAB */}
              {activeTab === 'applications' && (
                <div className="p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-3"><FileText className="w-5 h-5 text-emerald-500" /> Pending Admission Applications</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="py-4 px-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Candidate</th>
                          <th className="py-4 px-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Program</th>
                          <th className="py-4 px-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="py-4 px-4 font-bold text-xs text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {applications.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-xs text-slate-400 uppercase font-bold">No applications found</td></tr>
                        ) : (
                          applications.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50 transition-all">
                              <td className="py-4 px-4">
                                <p className="font-bold text-slate-900">{app.name}</p>
                                <p className="text-xs text-slate-500">{app.email || 'No Email'}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-xs font-bold text-slate-700">{app.faculty}</p>
                                <p className="text-[10px] text-slate-500">{app.department}</p>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button onClick={() => setSelectedApp(app)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Eye className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STUDENTS TAB */}
              {activeTab === 'students' && (
                <div className="p-8 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <Users className="w-5 h-5 text-emerald-500" /> Student Directory
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Enrolled students across faculties and levels</p>
                    </div>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student or department..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Student Name & Email</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Faculty & Department</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Level</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Matric / ID</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider text-right">Simulate Session</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-400 uppercase font-bold">No students found</td></tr>
                        ) : (
                          filteredStudents.map(student => (
                            <tr key={student.uid} className="hover:bg-slate-50/80 transition-all">
                              <td className="p-4">
                                <p className="font-bold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-400 font-mono">{student.email}</p>
                              </td>
                              <td className="p-4">
                                <p className="text-xs font-bold text-slate-700">{student.faculty || 'Unassigned'}</p>
                                <p className="text-[10px] text-slate-500">{student.department || '---'}</p>
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                                  {student.level || '100L'}
                                </span>
                              </td>
                              <td className="p-4 text-xs font-mono text-slate-600 font-bold">
                                {(student as any).matric_no || (student.uid || '').slice(0, 10)}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => startSimulation(student)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto transition-all"
                                >
                                  <LogIn className="w-3.5 h-3.5" /> Simulate Login
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COURSES TAB */}
              {activeTab === 'courses' && (
                <div className="p-8 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-emerald-500" /> Academic Course Directory
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Manage accredited course offerings and units</p>
                    </div>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search code, title, or department..."
                        value={courseSearch}
                        onChange={e => setCourseSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Course Code</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Title</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Units</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Faculty & Dept</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Level</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredCourses.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-xs text-slate-400 uppercase font-bold">No courses found</td></tr>
                        ) : (
                          filteredCourses.map(course => (
                            <tr key={course.id || course.courseCode} className="hover:bg-slate-50/80 transition-all">
                              <td className="p-4 font-mono font-bold text-emerald-600 text-xs">
                                {course.courseCode || course.course_code}
                              </td>
                              <td className="p-4 font-bold text-slate-900 text-xs">
                                {course.title}
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold">
                                  {course.units} Units
                                </span>
                              </td>
                              <td className="p-4 text-xs">
                                <p className="font-bold text-slate-700">{course.faculty || 'General'}</p>
                                <p className="text-[10px] text-slate-400">{course.department || '---'}</p>
                              </td>
                              <td className="p-4 text-xs font-bold text-slate-600">
                                {course.level || '100L'}
                              </td>
                              <td className="p-4 text-right">
                                {course.id && (
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
              )}

              {/* TREASURY TAB */}
              {activeTab === 'treasury' && (
                <div className="p-8 space-y-10">
                  {/* BANK ACCOUNT CONFIGURATION */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <Landmark className="w-5 h-5 text-emerald-500" /> Bank Details & Payment Accounts
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Official bank accounts displayed to students for direct payment verification</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add New Bank Account</h4>
                        <input
                          type="text"
                          placeholder="Bank Name (e.g. UBA, OPAY)"
                          value={bankSetup.bankName}
                          onChange={e => setBankSetup({ ...bankSetup, bankName: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Account Number"
                          value={bankSetup.accountNumber}
                          onChange={e => setBankSetup({ ...bankSetup, accountNumber: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Account Name"
                          value={bankSetup.accountName}
                          onChange={e => setBankSetup({ ...bankSetup, accountName: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                        <button
                          onClick={handleAddBank}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                          Save Bank Details
                        </button>
                      </div>

                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {banks.map((b, idx) => (
                          <div key={idx} className="bg-slate-900 text-white p-6 rounded-2xl space-y-3 relative overflow-hidden">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">{b.bankName}</span>
                              <CreditCard className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-xl font-mono font-bold tracking-wider">{b.accountNumber}</p>
                              <p className="text-xs text-slate-400 uppercase mt-1">{b.accountName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PORTAL FEES & LOAN SETTINGS */}
                  <div className="space-y-6 pt-8 border-t border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <Settings className="w-5 h-5 text-emerald-500" /> Fee Policy & Student Loan Limits
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Configure global fee limits and loan caps across the institution</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Acceptance Fee (₦)</label>
                        <input
                          type="number"
                          value={acceptanceFee}
                          onChange={e => setAcceptanceFee(Number(e.target.value))}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Maximum Student Loan (₦)</label>
                        <input
                          type="number"
                          value={maxLoanAmount}
                          onChange={e => setMaxLoanAmount(Number(e.target.value))}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Early Payment Discount (%)</label>
                        <input
                          type="number"
                          value={earlyPaymentDiscount}
                          onChange={e => setEarlyPaymentDiscount(Number(e.target.value))}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <button
                          onClick={handleUpdateTreasurySettings}
                          disabled={savingTreasury}
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {savingTreasury ? 'Saving Settings...' : 'Save Treasury Settings'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RECORD MANUAL PAYMENT */}
                  <div className="space-y-6 pt-8 border-t border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-emerald-500" /> Record Offline Payment
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Manually credit a student payment into system ledger</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Student UID / User ID"
                        value={manualPay.uid}
                        onChange={e => setManualPay({ ...manualPay, uid: e.target.value })}
                        className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                      />
                      <select
                        value={manualPay.type}
                        onChange={e => setManualPay({ ...manualPay, type: e.target.value as any })}
                        className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                      >
                        <option value="tuition">Tuition Fee</option>
                        <option value="hostel">Hostel Accommodation</option>
                        <option value="admission">Admission Acceptance</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amount (₦)"
                        value={manualPay.amount || ''}
                        onChange={e => setManualPay({ ...manualPay, amount: Number(e.target.value) })}
                        className="p-3 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                      />
                      <button
                        onClick={handleRecordManualPay}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LOANS TAB */}
              {activeTab === 'loans' && (
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                      <Landmark className="w-5 h-5 text-emerald-500" /> Student Loan Applications
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Review financial assistance and loan requests from students</p>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Applicant & UID</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Amount Requested</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Reason / Purpose</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loans.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-400 uppercase font-bold">No loan applications found</td></tr>
                        ) : (
                          loans.map(loan => (
                            <tr key={loan.id} className="hover:bg-slate-50/80 transition-all">
                              <td className="p-4">
                                <p className="font-bold text-slate-900">{loan.studentName || loan.uid}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{loan.uid}</p>
                              </td>
                              <td className="p-4 font-bold text-slate-900 text-sm">
                                ₦{(loan.amount || 0).toLocaleString()}
                              </td>
                              <td className="p-4 text-xs text-slate-600 max-w-xs truncate">
                                {loan.reason || 'Tuition Assistance'}
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  loan.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                  loan.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {loan.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {loan.status === 'pending' ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleLoanStatus(loan.id, 'approved')}
                                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleLoanStatus(loan.id, 'rejected')}
                                      className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400 uppercase italic">
                                    {loan.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SETUP TAB */}
              {activeTab === 'setup' && (
                <div className="p-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PROVISION COURSE */}
                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <h3 className="text-md font-bold flex items-center gap-3 text-slate-900">
                        <Plus className="w-5 h-5 text-emerald-500" /> Provision Course
                      </h3>
                      <div className="space-y-3">
                        <input
                          placeholder="Course Code (e.g. CSC 201)"
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:ring-2 ring-emerald-500/20"
                          value={newCourse.courseCode}
                          onChange={e => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                        />
                        <input
                          placeholder="Course Title"
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:ring-2 ring-emerald-500/20"
                          value={newCourse.title}
                          onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={newCourse.faculty}
                            onChange={e => setNewCourse({ ...newCourse, faculty: e.target.value })}
                            className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                          >
                            {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <select
                            value={newCourse.level}
                            onChange={e => setNewCourse({ ...newCourse, level: e.target.value })}
                            className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                          >
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <button
                          onClick={handleAddCourse}
                          className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md"
                        >
                          Register Course
                        </button>
                      </div>
                    </div>

                    {/* CREATE DEPARTMENT */}
                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <h3 className="text-md font-bold flex items-center gap-3 text-slate-900">
                        <Building2 className="w-5 h-5 text-emerald-500" /> Create Department
                      </h3>
                      <div className="space-y-3">
                        <select
                          value={newDept.faculty}
                          onChange={e => setNewDept({ ...newDept, faculty: e.target.value })}
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                        >
                          {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <input
                          placeholder="Department Name"
                          className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:ring-2 ring-emerald-500/20"
                          value={newDept.name}
                          onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                        />
                        <button
                          onClick={handleAddDept}
                          className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md"
                        >
                          Create Department
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MANUAL STUDENT REGISTRATION */}
                  <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-md font-bold flex items-center gap-3 text-slate-900">
                      <UserPlus className="w-5 h-5 text-emerald-500" /> Register Student Manually
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        placeholder="Full Name"
                        className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                        value={manualStudent.name}
                        onChange={e => setManualStudent({ ...manualStudent, name: e.target.value })}
                      />
                      <input
                        placeholder="Email Address"
                        className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                        value={manualStudent.email}
                        onChange={e => setManualStudent({ ...manualStudent, email: e.target.value })}
                      />
                      <select
                        value={manualStudent.faculty}
                        onChange={e => setManualStudent({ ...manualStudent, faculty: e.target.value })}
                        className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      >
                        {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <input
                        placeholder="Department"
                        className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                        value={manualStudent.department}
                        onChange={e => setManualStudent({ ...manualStudent, department: e.target.value })}
                      />
                      <select
                        value={manualStudent.level}
                        onChange={e => setManualStudent({ ...manualStudent, level: e.target.value })}
                        className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                      >
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <button
                        onClick={handleAddManualStudent}
                        className="bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md"
                      >
                        Enroll Student
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden">
                    {selectedApp.faceUrl ? <img src={selectedApp.faceUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">No Photo</div>}
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate Name</p>
                      <p className="text-xl font-bold text-slate-900">{selectedApp.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Program Applied</p>
                      <p className="text-sm font-bold text-slate-700">{selectedApp.faculty} - {selectedApp.department}</p>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleApprove(selectedApp)} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold">Approve Application</button>
                      <button onClick={() => handleReject(selectedApp)} className="flex-1 bg-rose-50 text-rose-600 py-4 rounded-xl font-bold">Reject Application</button>
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
